package com.freezeshield.backend.controller;

import com.freezeshield.backend.entity.TabState;
import com.freezeshield.backend.service.TabStateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/v1/tab-states")
@CrossOrigin(origins = "*")
public class TabStateController {

    private final TabStateService tabStateService;

    public TabStateController(TabStateService tabStateService) {
        this.tabStateService = tabStateService;
    }

    @PostMapping
    public ResponseEntity<TabState> saveTabState(@RequestBody TabState tabState) {
        TabState savedState = tabStateService.saveTabState(tabState);

        return ResponseEntity.ok(savedState);
    }

    @GetMapping
    public ResponseEntity<TabState> getLatestTabState(
            @RequestParam String sessionId,
            @RequestParam String url
    ) {

        System.out.println("========== FREEZESHIELD GET ==========");
        System.out.println("Session ID: [" + sessionId + "]");
        System.out.println("URL: [" + url + "]");
        System.out.println("Session length: " + sessionId.length());
        System.out.println("URL length: " + url.length());

        return tabStateService.getLatestTabState(sessionId, url)
                .map(state -> {
                    System.out.println("STATE FOUND: ID = " + state.getId());
                    return ResponseEntity.ok(state);
                })
                .orElseGet(() -> {
                    System.out.println("STATE NOT FOUND");
                    return ResponseEntity.notFound().build();
                });
    }
}