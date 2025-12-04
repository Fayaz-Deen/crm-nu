package com.crm.controller;

import com.crm.dto.ContactDto;
import com.crm.entity.User;
import com.crm.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Global search endpoint for searching contacts.
 *
 * TODO: Future AI integration placeholder
 * - Add semantic/vector search using embeddings
 * - Integrate with LLM for natural language queries
 * - Add relevance scoring and ranking
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * Global search across contacts.
     * Searches: name, email, phone, company, tags, notes
     * Returns results ordered by most recently updated.
     */
    @GetMapping
    public ResponseEntity<List<ContactDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal User user) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(searchService.searchContacts(user.getId(), q.trim(), limit));
    }
}
