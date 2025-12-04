package com.crm.service;

import com.crm.dto.TagDto;
import com.crm.entity.Contact;
import com.crm.entity.Tag;
import com.crm.repository.ContactRepository;
import com.crm.repository.TagRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagService {
    private final TagRepository tagRepository;
    private final ContactRepository contactRepository;
    private final ObjectMapper objectMapper;

    public TagService(TagRepository tagRepository, ContactRepository contactRepository, ObjectMapper objectMapper) {
        this.tagRepository = tagRepository;
        this.contactRepository = contactRepository;
        this.objectMapper = objectMapper;
    }

    public List<TagDto> getAll(String userId) {
        List<Contact> contacts = contactRepository.findByUserId(userId);
        return tagRepository.findByUserId(userId).stream()
                .map(tag -> toDto(tag, countContactsWithTag(contacts, tag.getName())))
                .collect(Collectors.toList());
    }

    public TagDto getById(String id, String userId) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));
        if (!tag.getUserId().equals(userId)) throw new RuntimeException("Access denied");
        List<Contact> contacts = contactRepository.findByUserId(userId);
        return toDto(tag, countContactsWithTag(contacts, tag.getName()));
    }

    @Transactional
    public TagDto create(TagDto dto, String userId) {
        if (tagRepository.existsByUserIdAndName(userId, dto.getName())) {
            throw new RuntimeException("Tag with this name already exists");
        }
        Tag tag = new Tag();
        tag.setUserId(userId);
        tag.setName(dto.getName());
        tag.setColor(dto.getColor() != null ? dto.getColor() : "#3B82F6");
        tag.setDescription(dto.getDescription());
        tag = tagRepository.save(tag);
        return toDto(tag, 0L);
    }

    @Transactional
    public TagDto update(String id, TagDto dto, String userId) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));
        if (!tag.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        String oldName = tag.getName();
        if (!oldName.equals(dto.getName()) && tagRepository.existsByUserIdAndName(userId, dto.getName())) {
            throw new RuntimeException("Tag with this name already exists");
        }

        tag.setName(dto.getName());
        if (dto.getColor() != null) tag.setColor(dto.getColor());
        if (dto.getDescription() != null) tag.setDescription(dto.getDescription());
        tag = tagRepository.save(tag);

        // Update tag name in all contacts if name changed
        if (!oldName.equals(dto.getName())) {
            updateTagNameInContacts(userId, oldName, dto.getName());
        }

        List<Contact> contacts = contactRepository.findByUserId(userId);
        return toDto(tag, countContactsWithTag(contacts, tag.getName()));
    }

    @Transactional
    public void delete(String id, String userId) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));
        if (!tag.getUserId().equals(userId)) throw new RuntimeException("Access denied");

        // Remove tag from all contacts
        removeTagFromContacts(userId, tag.getName());
        tagRepository.delete(tag);
    }

    private void updateTagNameInContacts(String userId, String oldName, String newName) {
        List<Contact> contacts = contactRepository.findByUserId(userId);
        for (Contact contact : contacts) {
            List<String> tags = parseJsonArray(contact.getTags());
            if (tags.contains(oldName)) {
                tags = tags.stream()
                        .map(t -> t.equals(oldName) ? newName : t)
                        .collect(Collectors.toList());
                contact.setTags(toJson(tags));
                contactRepository.save(contact);
            }
        }
    }

    private void removeTagFromContacts(String userId, String tagName) {
        List<Contact> contacts = contactRepository.findByUserId(userId);
        for (Contact contact : contacts) {
            List<String> tags = parseJsonArray(contact.getTags());
            if (tags.contains(tagName)) {
                tags = tags.stream().filter(t -> !t.equals(tagName)).collect(Collectors.toList());
                contact.setTags(toJson(tags));
                contactRepository.save(contact);
            }
        }
    }

    private long countContactsWithTag(List<Contact> contacts, String tagName) {
        return contacts.stream()
                .filter(c -> parseJsonArray(c.getTags()).contains(tagName))
                .count();
    }

    private TagDto toDto(Tag tag, long contactCount) {
        TagDto dto = new TagDto();
        dto.setId(tag.getId());
        dto.setName(tag.getName());
        dto.setColor(tag.getColor());
        dto.setDescription(tag.getDescription());
        dto.setContactCount(contactCount);
        dto.setCreatedAt(tag.getCreatedAt() != null ? tag.getCreatedAt().toString() : null);
        return dto;
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        try {
            return json != null ? objectMapper.readValue(json, List.class) : List.of();
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
