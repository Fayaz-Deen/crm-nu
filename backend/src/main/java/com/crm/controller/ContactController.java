package com.crm.controller;

import com.crm.dto.ContactDto;
import com.crm.dto.ContactSearchDto;
import com.crm.dto.ShareDto;
import com.crm.entity.Contact;
import com.crm.entity.User;
import com.crm.service.ContactService;
import com.crm.service.ShareService;
import javax.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    private final ContactService contactService;
    private final ShareService shareService;

    public ContactController(ContactService contactService, ShareService shareService) {
        this.contactService = contactService;
        this.shareService = shareService;
    }

    @GetMapping
    public ResponseEntity<List<ContactDto>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.getAll(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactDto> getById(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.getById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<ContactDto> create(@Valid @RequestBody ContactDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.create(dto, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactDto> update(@PathVariable String id, @Valid @RequestBody ContactDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.update(id, dto, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        contactService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<ContactDto>> search(@RequestParam String q, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.search(user.getId(), q));
    }

    // Share endpoints - matching frontend API expectations
    @GetMapping("/shared")
    public ResponseEntity<List<ContactDto>> getSharedWithMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(shareService.getSharedContactsWithMe(user.getId()));
    }

    @PostMapping("/{contactId}/share")
    public ResponseEntity<Void> shareContact(
            @PathVariable String contactId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        ShareDto dto = new ShareDto();
        dto.setContactId(contactId);
        dto.setSharedWithEmail((String) body.get("email"));
        dto.setPermission((String) body.get("permission"));
        if (body.get("expiresAt") != null) {
            dto.setExpiresAt(LocalDateTime.parse((String) body.get("expiresAt")));
        }
        shareService.shareContact(user.getId(), dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{contactId}/share/{userId}")
    public ResponseEntity<Void> revokeShare(
            @PathVariable String contactId,
            @PathVariable String userId,
            @AuthenticationPrincipal User user) {
        shareService.revokeShareByContactAndUser(user.getId(), contactId, userId);
        return ResponseEntity.noContent().build();
    }

    // Advanced search with filters
    @PostMapping("/search/advanced")
    public ResponseEntity<List<ContactDto>> advancedSearch(
            @RequestBody ContactSearchDto searchDto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.advancedSearch(user.getId(), searchDto));
    }

    // CSV Export
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportToCsv(@AuthenticationPrincipal User user) {
        String csv = contactService.exportToCsv(user.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contacts.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    // CSV Import
    @PostMapping("/import/csv")
    public ResponseEntity<List<ContactDto>> importFromCsv(
            @RequestBody String csvContent,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.importFromCsv(user.getId(), csvContent));
    }

    // vCard export for single contact
    @GetMapping("/{id}/vcard")
    public ResponseEntity<String> exportToVCard(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        String vcard = contactService.exportToVCard(user.getId(), id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contact.vcf")
                .contentType(MediaType.parseMediaType("text/vcard"))
                .body(vcard);
    }

    // vCard export for all contacts
    @GetMapping("/export/vcard")
    public ResponseEntity<String> exportAllToVCard(@AuthenticationPrincipal User user) {
        String vcard = contactService.exportAllToVCard(user.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contacts.vcf")
                .contentType(MediaType.parseMediaType("text/vcard"))
                .body(vcard);
    }

    // Duplicate detection
    @GetMapping("/duplicates")
    public ResponseEntity<List<List<ContactDto>>> findDuplicates(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(contactService.findDuplicates(user.getId()));
    }

    // Merge contacts
    @PostMapping("/merge")
    public ResponseEntity<ContactDto> mergeContacts(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        String primaryId = (String) body.get("primaryId");
        @SuppressWarnings("unchecked")
        List<String> mergeIds = (List<String>) body.get("mergeIds");
        return ResponseEntity.ok(contactService.mergeContacts(user.getId(), primaryId, mergeIds));
    }
}
