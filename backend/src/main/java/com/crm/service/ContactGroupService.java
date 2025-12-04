package com.crm.service;

import com.crm.dto.ContactDto;
import com.crm.dto.ContactGroupDto;
import com.crm.entity.Contact;
import com.crm.entity.ContactGroup;
import com.crm.repository.ContactGroupRepository;
import com.crm.repository.ContactRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactGroupService {
    private final ContactGroupRepository groupRepository;
    private final ContactRepository contactRepository;
    private final ObjectMapper objectMapper;

    public ContactGroupService(ContactGroupRepository groupRepository, ContactRepository contactRepository, ObjectMapper objectMapper) {
        this.groupRepository = groupRepository;
        this.contactRepository = contactRepository;
        this.objectMapper = objectMapper;
    }

    public List<ContactGroupDto> getAll(String userId) {
        return groupRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ContactGroupDto getById(String id, String userId) {
        ContactGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        return toDto(group);
    }

    public List<ContactDto> getGroupContacts(String id, String userId) {
        ContactGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        List<String> contactIds = parseJsonArray(group.getContactIds());
        return contactIds.stream()
                .map(contactId -> contactRepository.findById(contactId).orElse(null))
                .filter(c -> c != null)
                .map(this::toContactDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactGroupDto create(ContactGroupDto dto, String userId) {
        if (groupRepository.existsByUserIdAndName(userId, dto.getName())) {
            throw new RuntimeException("Group with this name already exists");
        }

        ContactGroup group = new ContactGroup();
        group.setUserId(userId);
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        group.setColor(dto.getColor() != null ? dto.getColor() : "#3B82F6");
        group.setContactIds(toJson(dto.getContactIds() != null ? dto.getContactIds() : new ArrayList<>()));
        group = groupRepository.save(group);
        return toDto(group);
    }

    @Transactional
    public ContactGroupDto update(String id, ContactGroupDto dto, String userId) {
        ContactGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        if (dto.getName() != null && !dto.getName().equals(group.getName())) {
            if (groupRepository.existsByUserIdAndName(userId, dto.getName())) {
                throw new RuntimeException("Group with this name already exists");
            }
            group.setName(dto.getName());
        }
        if (dto.getDescription() != null) group.setDescription(dto.getDescription());
        if (dto.getColor() != null) group.setColor(dto.getColor());
        if (dto.getContactIds() != null) group.setContactIds(toJson(dto.getContactIds()));

        group = groupRepository.save(group);
        return toDto(group);
    }

    @Transactional
    public ContactGroupDto addContact(String id, String contactId, String userId) {
        ContactGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        // Verify contact exists and belongs to user
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        if (!contact.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        List<String> contactIds = parseJsonArray(group.getContactIds());
        if (!contactIds.contains(contactId)) {
            contactIds.add(contactId);
            group.setContactIds(toJson(contactIds));
            group = groupRepository.save(group);
        }
        return toDto(group);
    }

    @Transactional
    public ContactGroupDto removeContact(String id, String contactId, String userId) {
        ContactGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        List<String> contactIds = parseJsonArray(group.getContactIds());
        contactIds.remove(contactId);
        group.setContactIds(toJson(contactIds));
        group = groupRepository.save(group);
        return toDto(group);
    }

    @Transactional
    public void delete(String id, String userId) {
        ContactGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        groupRepository.delete(group);
    }

    private ContactGroupDto toDto(ContactGroup group) {
        ContactGroupDto dto = new ContactGroupDto();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setColor(group.getColor());
        List<String> contactIds = parseJsonArray(group.getContactIds());
        dto.setContactIds(contactIds);
        dto.setContactCount(contactIds.size());
        dto.setCreatedAt(group.getCreatedAt() != null ? group.getCreatedAt().toString() : null);
        dto.setUpdatedAt(group.getUpdatedAt() != null ? group.getUpdatedAt().toString() : null);
        return dto;
    }

    private ContactDto toContactDto(Contact c) {
        ContactDto dto = new ContactDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmails(parseJsonArray(c.getEmails()));
        dto.setPhones(parseJsonArray(c.getPhones()));
        dto.setCompany(c.getCompany());
        dto.setTags(parseJsonArray(c.getTags()));
        return dto;
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        try {
            return json != null ? objectMapper.readValue(json, List.class) : new ArrayList<>();
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list != null ? list : new ArrayList<>());
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
