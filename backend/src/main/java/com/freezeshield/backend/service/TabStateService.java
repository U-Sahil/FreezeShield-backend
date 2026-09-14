package com.freezeshield.backend.service;

import com.freezeshield.backend.entity.TabState;
import com.freezeshield.backend.repository.TabStateRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TabStateService {

    private final TabStateRepository tabStateRepository;

    public TabStateService(TabStateRepository tabStateRepository) {
        this.tabStateRepository = tabStateRepository;
    }

    public TabState saveTabState(TabState tabState) {

        tabState.setSavedAt(java.time.LocalDateTime.now());

        return tabStateRepository
                .findTopBySessionIdAndTabUrlOrderBySavedAtDesc(
                        tabState.getSessionId(),
                        tabState.getTabUrl()
                )
                .map(existingState -> {

                    existingState.setFormData(tabState.getFormData());
                    existingState.setScrollX(tabState.getScrollX());
                    existingState.setScrollY(tabState.getScrollY());
                    existingState.setSavedAt(tabState.getSavedAt());

                    return tabStateRepository.save(existingState);
                })
                .orElseGet(() -> tabStateRepository.save(tabState));
    }

    public Optional<TabState> getLatestTabState(
            String sessionId,
            String tabUrl
    ) {
        return tabStateRepository
                .findTopBySessionIdAndTabUrlOrderBySavedAtDesc(
                        sessionId,
                        tabUrl
                );
    }
}