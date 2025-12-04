package com.crm.service;

import com.crm.dto.ContactDto;
import com.crm.entity.Contact;
import com.crm.repository.ContactRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Search service for global contact search.
 *
 * TODO: Future AI integration placeholder
 * - Add embedding generation for semantic search
 * - Integrate with vector database (Pinecone, Weaviate, etc.)
 * - Add LLM-based query understanding
 * - Implement relevance scoring beyond simple LIKE matching
 */
@Service
public class SearchService {
    private final ContactRepository contactRepository;
    private final ObjectMapper objectMapper;

    public SearchService(ContactRepository contactRepository, ObjectMapper objectMapper) {
        this.contactRepository = contactRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Search contacts using keyword matching across multiple fields.
     * Fields searched: name, email, phone, company, tags, notes
     * Results ordered by most recently updated.
     *
     * @param userId The authenticated user's ID
     * @param query The search query string
     * @param limit Maximum number of results to return
     * @return List of matching contacts
     */
    public List<ContactDto> searchContacts(String userId, String query, int limit) {
        String lowerQuery = query.toLowerCase();

        // Get all user's contacts and filter in memory
        // For larger datasets, this should use a native ILIKE query
        List<Contact> contacts = contactRepository.findByUserId(userId);

        return contacts.stream()
                .filter(c -> matchesQuery(c, lowerQuery))
                .sorted((a, b) -> {
                    // Order by most recently updated (descending)
                    if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                    if (a.getUpdatedAt() == null) return 1;
                    if (b.getUpdatedAt() == null) return -1;
                    return b.getUpdatedAt().compareTo(a.getUpdatedAt());
                })
                .limit(limit)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private boolean matchesQuery(Contact c, String query) {
        // Check name
        if (c.getName() != null && c.getName().toLowerCase().contains(query)) {
            return true;
        }

        // Check company
        if (c.getCompany() != null && c.getCompany().toLowerCase().contains(query)) {
            return true;
        }

        // Check emails (stored as JSON array)
        List<String> emails = parseJson(c.getEmails());
        for (String email : emails) {
            if (email.toLowerCase().contains(query)) {
                return true;
            }
        }

        // Check phones (stored as JSON array)
        List<String> phones = parseJson(c.getPhones());
        for (String phone : phones) {
            if (phone.contains(query)) {
                return true;
            }
        }

        // Check tags (stored as JSON array)
        List<String> tags = parseJson(c.getTags());
        for (String tag : tags) {
            if (tag.toLowerCase().contains(query)) {
                return true;
            }
        }

        // Check notes
        if (c.getNotes() != null && c.getNotes().toLowerCase().contains(query)) {
            return true;
        }

        return false;
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

    @SuppressWarnings("unchecked")
    private List<String> parseJson(String json) {
        try {
            return json != null ? objectMapper.readValue(json, List.class) : List.of();
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
