package com.crm.service;

import com.crm.dto.ContactDto;
import com.crm.dto.ContactSearchDto;
import com.crm.entity.Contact;
import com.crm.entity.User;
import com.crm.repository.ContactRepository;
import com.crm.repository.ReminderRepository;
import com.crm.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.BufferedReader;
import java.io.StringReader;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ContactService {
    private final ContactRepository contactRepository;
    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final ReminderService reminderService;
    private final ObjectMapper objectMapper;

    public ContactService(ContactRepository contactRepository, ReminderRepository reminderRepository,
                          UserRepository userRepository, @Lazy ReminderService reminderService,
                          ObjectMapper objectMapper) {
        this.contactRepository = contactRepository;
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.reminderService = reminderService;
        this.objectMapper = objectMapper;
    }

    public List<ContactDto> getAll(String userId) {
        return contactRepository.findByUserId(userId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public ContactDto getById(String id, String userId) {
        Contact contact = contactRepository.findById(id).orElseThrow(() -> new RuntimeException("Contact not found"));
        if (!contact.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        return toDto(contact);
    }

    @Transactional
    public ContactDto create(ContactDto dto, String userId) {
        Contact contact = toEntity(dto);
        contact.setUserId(userId);
        contact = contactRepository.save(contact);

        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            if (contact.getBirthday() != null) {
                reminderService.createBirthdayReminder(contact, user);
            }
            if (contact.getAnniversary() != null) {
                reminderService.createAnniversaryReminder(contact, user);
            }
        }

        return toDto(contact);
    }

    public ContactDto update(String id, ContactDto dto, String userId) {
        Contact contact = contactRepository.findById(id).orElseThrow(() -> new RuntimeException("Contact not found"));
        if (!contact.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        updateEntity(contact, dto);
        return toDto(contactRepository.save(contact));
    }

    @Transactional
    public void delete(String id, String userId) {
        Contact contact = contactRepository.findById(id).orElseThrow(() -> new RuntimeException("Contact not found"));
        if (!contact.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        reminderRepository.deleteByContactId(id);
        contactRepository.delete(contact);
    }

    public List<ContactDto> search(String userId, String query) {
        return contactRepository.findByUserIdAndNameContainingIgnoreCase(userId, query).stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ContactDto> advancedSearch(String userId, ContactSearchDto search) {
        List<Contact> contacts = contactRepository.findByUserId(userId);

        return contacts.stream()
                .filter(c -> matchesSearch(c, search))
                .sorted((a, b) -> compareContacts(a, b, search.getSortBy(), search.getSortOrder()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private boolean matchesSearch(Contact c, ContactSearchDto search) {
        // Text query filter
        if (search.getQuery() != null && !search.getQuery().isEmpty()) {
            String q = search.getQuery().toLowerCase();
            boolean matches = c.getName().toLowerCase().contains(q) ||
                    (c.getCompany() != null && c.getCompany().toLowerCase().contains(q)) ||
                    (c.getEmails() != null && c.getEmails().toLowerCase().contains(q)) ||
                    (c.getNotes() != null && c.getNotes().toLowerCase().contains(q));
            if (!matches) return false;
        }

        // Tag filter
        if (search.getTags() != null && !search.getTags().isEmpty()) {
            List<String> contactTags = parseJson(c.getTags());
            boolean hasTag = search.getTags().stream().anyMatch(contactTags::contains);
            if (!hasTag) return false;
        }

        // Company filter
        if (search.getCompany() != null && !search.getCompany().isEmpty()) {
            if (c.getCompany() == null || !c.getCompany().toLowerCase().contains(search.getCompany().toLowerCase())) {
                return false;
            }
        }

        // Last contacted date range
        if (search.getLastContactedFrom() != null && !search.getLastContactedFrom().isEmpty()) {
            LocalDateTime from = LocalDateTime.parse(search.getLastContactedFrom());
            if (c.getLastContactedAt() == null || c.getLastContactedAt().isBefore(from)) return false;
        }
        if (search.getLastContactedTo() != null && !search.getLastContactedTo().isEmpty()) {
            LocalDateTime to = LocalDateTime.parse(search.getLastContactedTo());
            if (c.getLastContactedAt() == null || c.getLastContactedAt().isAfter(to)) return false;
        }

        // Created date range
        if (search.getCreatedFrom() != null && !search.getCreatedFrom().isEmpty()) {
            LocalDateTime from = LocalDateTime.parse(search.getCreatedFrom());
            if (c.getCreatedAt() == null || c.getCreatedAt().isBefore(from)) return false;
        }
        if (search.getCreatedTo() != null && !search.getCreatedTo().isEmpty()) {
            LocalDateTime to = LocalDateTime.parse(search.getCreatedTo());
            if (c.getCreatedAt() == null || c.getCreatedAt().isAfter(to)) return false;
        }

        // Has email filter
        if (Boolean.TRUE.equals(search.getHasEmail())) {
            List<String> emails = parseJson(c.getEmails());
            if (emails.isEmpty()) return false;
        }

        // Has phone filter
        if (Boolean.TRUE.equals(search.getHasPhone())) {
            List<String> phones = parseJson(c.getPhones());
            if (phones.isEmpty()) return false;
        }

        // Has WhatsApp filter
        if (Boolean.TRUE.equals(search.getHasWhatsapp())) {
            if (c.getWhatsappNumber() == null || c.getWhatsappNumber().isEmpty()) return false;
        }

        // Has Instagram filter
        if (Boolean.TRUE.equals(search.getHasInstagram())) {
            if (c.getInstagramHandle() == null || c.getInstagramHandle().isEmpty()) return false;
        }

        return true;
    }

    private int compareContacts(Contact a, Contact b, String sortBy, String sortOrder) {
        int result = 0;
        if (sortBy == null) sortBy = "name";

        switch (sortBy.toLowerCase()) {
            case "name":
                result = a.getName().compareToIgnoreCase(b.getName());
                break;
            case "company":
                String compA = a.getCompany() != null ? a.getCompany() : "";
                String compB = b.getCompany() != null ? b.getCompany() : "";
                result = compA.compareToIgnoreCase(compB);
                break;
            case "lastcontacted":
                if (a.getLastContactedAt() == null && b.getLastContactedAt() == null) result = 0;
                else if (a.getLastContactedAt() == null) result = 1;
                else if (b.getLastContactedAt() == null) result = -1;
                else result = a.getLastContactedAt().compareTo(b.getLastContactedAt());
                break;
            case "created":
                result = a.getCreatedAt().compareTo(b.getCreatedAt());
                break;
            default:
                result = a.getName().compareToIgnoreCase(b.getName());
        }

        return "desc".equalsIgnoreCase(sortOrder) ? -result : result;
    }

    // Duplicate detection
    public List<List<ContactDto>> findDuplicates(String userId) {
        List<Contact> contacts = contactRepository.findByUserId(userId);
        Map<String, List<Contact>> emailGroups = new HashMap<>();
        Map<String, List<Contact>> phoneGroups = new HashMap<>();
        Map<String, List<Contact>> nameGroups = new HashMap<>();

        for (Contact c : contacts) {
            // Group by email
            List<String> emails = parseJson(c.getEmails());
            for (String email : emails) {
                String key = email.toLowerCase().trim();
                emailGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(c);
            }

            // Group by phone
            List<String> phones = parseJson(c.getPhones());
            for (String phone : phones) {
                String key = phone.replaceAll("[^0-9]", "");
                if (key.length() >= 7) {
                    phoneGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(c);
                }
            }

            // Group by name (fuzzy)
            String nameKey = c.getName().toLowerCase().replaceAll("[^a-z]", "");
            nameGroups.computeIfAbsent(nameKey, k -> new ArrayList<>()).add(c);
        }

        // Find duplicates (groups with more than one contact)
        Set<Set<String>> seenGroups = new HashSet<>();
        List<List<ContactDto>> duplicates = new ArrayList<>();

        for (List<Contact> group : emailGroups.values()) {
            if (group.size() > 1) {
                Set<String> ids = group.stream().map(Contact::getId).collect(Collectors.toSet());
                if (!seenGroups.contains(ids)) {
                    seenGroups.add(ids);
                    duplicates.add(group.stream().map(this::toDto).collect(Collectors.toList()));
                }
            }
        }

        for (List<Contact> group : phoneGroups.values()) {
            if (group.size() > 1) {
                Set<String> ids = group.stream().map(Contact::getId).collect(Collectors.toSet());
                if (!seenGroups.contains(ids)) {
                    seenGroups.add(ids);
                    duplicates.add(group.stream().map(this::toDto).collect(Collectors.toList()));
                }
            }
        }

        for (List<Contact> group : nameGroups.values()) {
            if (group.size() > 1) {
                Set<String> ids = group.stream().map(Contact::getId).collect(Collectors.toSet());
                if (!seenGroups.contains(ids)) {
                    seenGroups.add(ids);
                    duplicates.add(group.stream().map(this::toDto).collect(Collectors.toList()));
                }
            }
        }

        return duplicates;
    }

    // CSV Export
    public String exportToCsv(String userId) {
        List<Contact> contacts = contactRepository.findByUserId(userId);
        StringBuilder sb = new StringBuilder();
        sb.append("Name,Company,Emails,Phones,WhatsApp,Instagram,Address,Tags,Birthday,Anniversary,Notes\n");

        for (Contact c : contacts) {
            sb.append(escapeCsv(c.getName())).append(",");
            sb.append(escapeCsv(c.getCompany())).append(",");
            sb.append(escapeCsv(String.join(";", parseJson(c.getEmails())))).append(",");
            sb.append(escapeCsv(String.join(";", parseJson(c.getPhones())))).append(",");
            sb.append(escapeCsv(c.getWhatsappNumber())).append(",");
            sb.append(escapeCsv(c.getInstagramHandle())).append(",");
            sb.append(escapeCsv(c.getAddress())).append(",");
            sb.append(escapeCsv(String.join(";", parseJson(c.getTags())))).append(",");
            sb.append(c.getBirthday() != null ? c.getBirthday().toString() : "").append(",");
            sb.append(c.getAnniversary() != null ? c.getAnniversary().toString() : "").append(",");
            sb.append(escapeCsv(c.getNotes())).append("\n");
        }

        return sb.toString();
    }

    // CSV Import
    @Transactional
    public List<ContactDto> importFromCsv(String userId, String csvContent) {
        List<ContactDto> imported = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new StringReader(csvContent))) {
            String header = reader.readLine(); // Skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = parseCsvLine(line);
                if (parts.length >= 1 && !parts[0].isEmpty()) {
                    ContactDto dto = new ContactDto();
                    dto.setName(parts[0]);
                    if (parts.length > 1) dto.setCompany(parts[1]);
                    if (parts.length > 2) dto.setEmails(Arrays.asList(parts[2].split(";")));
                    if (parts.length > 3) dto.setPhones(Arrays.asList(parts[3].split(";")));
                    if (parts.length > 4) dto.setWhatsappNumber(parts[4]);
                    if (parts.length > 5) dto.setInstagramHandle(parts[5]);
                    if (parts.length > 6) dto.setAddress(parts[6]);
                    if (parts.length > 7) dto.setTags(Arrays.asList(parts[7].split(";")));
                    if (parts.length > 8 && !parts[8].isEmpty()) dto.setBirthday(parts[8]);
                    if (parts.length > 9 && !parts[9].isEmpty()) dto.setAnniversary(parts[9]);
                    if (parts.length > 10) dto.setNotes(parts[10]);

                    imported.add(create(dto, userId));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to import CSV: " + e.getMessage());
        }
        return imported;
    }

    // vCard Export
    public String exportToVCard(String userId, String contactId) {
        Contact c = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        if (!c.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        return generateVCard(c);
    }

    public String exportAllToVCard(String userId) {
        List<Contact> contacts = contactRepository.findByUserId(userId);
        StringBuilder sb = new StringBuilder();
        for (Contact c : contacts) {
            sb.append(generateVCard(c)).append("\n");
        }
        return sb.toString();
    }

    private String generateVCard(Contact c) {
        StringBuilder vcard = new StringBuilder();
        vcard.append("BEGIN:VCARD\n");
        vcard.append("VERSION:3.0\n");
        vcard.append("FN:").append(c.getName()).append("\n");
        vcard.append("N:").append(c.getName()).append(";;;;\n");

        if (c.getCompany() != null) {
            vcard.append("ORG:").append(c.getCompany()).append("\n");
        }

        for (String email : parseJson(c.getEmails())) {
            vcard.append("EMAIL:").append(email).append("\n");
        }

        for (String phone : parseJson(c.getPhones())) {
            vcard.append("TEL:").append(phone).append("\n");
        }

        if (c.getAddress() != null) {
            vcard.append("ADR:;;").append(c.getAddress().replace("\n", " ")).append(";;;;\n");
        }

        if (c.getBirthday() != null) {
            vcard.append("BDAY:").append(c.getBirthday().toString().replace("-", "")).append("\n");
        }

        if (c.getNotes() != null) {
            vcard.append("NOTE:").append(c.getNotes().replace("\n", "\\n")).append("\n");
        }

        vcard.append("END:VCARD\n");
        return vcard.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (char ch : line.toCharArray()) {
            if (ch == '"') {
                inQuotes = !inQuotes;
            } else if (ch == ',' && !inQuotes) {
                result.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(ch);
            }
        }
        result.add(current.toString().trim());
        return result.toArray(new String[0]);
    }

    @Transactional
    public ContactDto mergeContacts(String userId, String primaryId, List<String> mergeIds) {
        Contact primary = contactRepository.findById(primaryId)
                .orElseThrow(() -> new RuntimeException("Primary contact not found"));
        if (!primary.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        for (String mergeId : mergeIds) {
            if (mergeId.equals(primaryId)) continue;
            Contact merge = contactRepository.findById(mergeId).orElse(null);
            if (merge == null || !merge.getUserId().equals(userId)) continue;

            // Merge emails
            Set<String> emails = new HashSet<>(parseJson(primary.getEmails()));
            emails.addAll(parseJson(merge.getEmails()));
            primary.setEmails(toJson(new ArrayList<>(emails)));

            // Merge phones
            Set<String> phones = new HashSet<>(parseJson(primary.getPhones()));
            phones.addAll(parseJson(merge.getPhones()));
            primary.setPhones(toJson(new ArrayList<>(phones)));

            // Merge tags
            Set<String> tags = new HashSet<>(parseJson(primary.getTags()));
            tags.addAll(parseJson(merge.getTags()));
            primary.setTags(toJson(new ArrayList<>(tags)));

            // Fill empty fields
            if (primary.getCompany() == null && merge.getCompany() != null) primary.setCompany(merge.getCompany());
            if (primary.getWhatsappNumber() == null && merge.getWhatsappNumber() != null) primary.setWhatsappNumber(merge.getWhatsappNumber());
            if (primary.getInstagramHandle() == null && merge.getInstagramHandle() != null) primary.setInstagramHandle(merge.getInstagramHandle());
            if (primary.getAddress() == null && merge.getAddress() != null) primary.setAddress(merge.getAddress());
            if (primary.getBirthday() == null && merge.getBirthday() != null) primary.setBirthday(merge.getBirthday());
            if (primary.getAnniversary() == null && merge.getAnniversary() != null) primary.setAnniversary(merge.getAnniversary());

            // Append notes
            if (merge.getNotes() != null && !merge.getNotes().isEmpty()) {
                String existingNotes = primary.getNotes() != null ? primary.getNotes() : "";
                primary.setNotes(existingNotes + "\n\n--- Merged from " + merge.getName() + " ---\n" + merge.getNotes());
            }

            // Delete merged contact
            reminderRepository.deleteByContactId(mergeId);
            contactRepository.delete(merge);
        }

        primary = contactRepository.save(primary);
        return toDto(primary);
    }

    private ContactDto toDto(Contact c) {
        ContactDto dto = new ContactDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmails(parseJson(c.getEmails()));
        dto.setPhones(parseJson(c.getPhones()));
        dto.setWhatsappNumber(c.getWhatsappNumber());
        dto.setInstagramHandle(c.getInstagramHandle());
        dto.setCompany(c.getCompany());
        dto.setTags(parseJson(c.getTags()));
        dto.setAddress(c.getAddress());
        dto.setNotes(c.getNotes());
        dto.setBirthday(c.getBirthday() != null ? c.getBirthday().toString() : null);
        dto.setAnniversary(c.getAnniversary() != null ? c.getAnniversary().toString() : null);
        dto.setProfilePicture(c.getProfilePicture());
        dto.setLastContactedAt(c.getLastContactedAt() != null ? c.getLastContactedAt().toString() : null);
        dto.setCreatedAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        dto.setUpdatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
        return dto;
    }

    private Contact toEntity(ContactDto dto) {
        Contact c = new Contact();
        updateEntity(c, dto);
        return c;
    }

    private void updateEntity(Contact c, ContactDto dto) {
        c.setName(dto.getName());
        c.setEmails(toJson(dto.getEmails()));
        c.setPhones(toJson(dto.getPhones()));
        c.setWhatsappNumber(dto.getWhatsappNumber());
        c.setInstagramHandle(dto.getInstagramHandle());
        c.setCompany(dto.getCompany());
        c.setTags(toJson(dto.getTags()));
        c.setAddress(dto.getAddress());
        c.setNotes(dto.getNotes());
        c.setBirthday(dto.getBirthday() != null && !dto.getBirthday().isEmpty() ? LocalDate.parse(dto.getBirthday()) : null);
        c.setAnniversary(dto.getAnniversary() != null && !dto.getAnniversary().isEmpty() ? LocalDate.parse(dto.getAnniversary()) : null);
        c.setProfilePicture(dto.getProfilePicture());
        if (dto.getLastContactedAt() != null) c.setLastContactedAt(LocalDateTime.parse(dto.getLastContactedAt()));
    }

    private String toJson(List<String> list) {
        try { return list != null ? objectMapper.writeValueAsString(list) : "[]"; }
        catch (JsonProcessingException e) { return "[]"; }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJson(String json) {
        try { return json != null ? objectMapper.readValue(json, List.class) : List.of(); }
        catch (JsonProcessingException e) { return List.of(); }
    }
}
