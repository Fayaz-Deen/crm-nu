package com.crm.controller;

import com.crm.dto.ContactDto;
import com.crm.dto.ContactGroupDto;
import com.crm.entity.User;
import com.crm.service.ContactGroupService;
import javax.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class ContactGroupController {
    private final ContactGroupService groupService;

    public ContactGroupController(ContactGroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<ContactGroupDto>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getAll(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactGroupDto> getById(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getById(id, user.getId()));
    }

    @GetMapping("/{id}/contacts")
    public ResponseEntity<List<ContactDto>> getGroupContacts(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.getGroupContacts(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<ContactGroupDto> create(@Valid @RequestBody ContactGroupDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.create(dto, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactGroupDto> update(@PathVariable String id, @RequestBody ContactGroupDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.update(id, dto, user.getId()));
    }

    @PostMapping("/{id}/contacts/{contactId}")
    public ResponseEntity<ContactGroupDto> addContact(@PathVariable String id, @PathVariable String contactId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.addContact(id, contactId, user.getId()));
    }

    @DeleteMapping("/{id}/contacts/{contactId}")
    public ResponseEntity<ContactGroupDto> removeContact(@PathVariable String id, @PathVariable String contactId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(groupService.removeContact(id, contactId, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        groupService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
