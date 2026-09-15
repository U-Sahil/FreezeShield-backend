package com.freezeshield.backend.controller;

import com.freezeshield.backend.entity.TabState;
import com.freezeshield.backend.service.TabStateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tab-states")
public class TabStateController {

    private final TabStateService tabStateService;

    public TabStateController(TabStateService tabStateService) {
        this.tabStateService = tabStateService;
    }

    @PostMapping
    public ResponseEntity<TabState> saveTabState(
            @Valid @RequestBody TabState tabState) {

        TabState savedState =
                tabStateService.saveTabState(tabState);

        return ResponseEntity.ok(savedState);
    }


    // ==========================================
    // GET LATEST TAB STATE
    // ==========================================

    @GetMapping
    public ResponseEntity<TabState> getLatestTabState(
            @RequestParam String sessionId,
            @RequestParam String url) {

        return tabStateService
                .getLatestTabState(sessionId, url)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}