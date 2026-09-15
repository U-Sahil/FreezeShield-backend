package com.freezeshield.backend.service;

import com.freezeshield.backend.entity.TabState;
import com.freezeshield.backend.repository.TabStateRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TabStateService {

    private final TabStateRepository tabStateRepository;

    public TabStateService(TabStateRepository tabStateRepository) {
        this.tabStateRepository = tabStateRepository;
    }

    public TabState saveTabState(TabState tabState) {

        tabState.setSavedAt(LocalDateTime.now());

        Optional<TabState> existingState =
                tabStateRepository
                        .findTopBySessionIdAndTabUrlOrderBySavedAtDesc(
                                tabState.getSessionId(),
                                tabState.getTabUrl()
                        );

        if (existingState.isPresent()) {

            TabState state = existingState.get();

            state.setFormData(tabState.getFormData());
            state.setScrollX(tabState.getScrollX());
            state.setScrollY(tabState.getScrollY());
            state.setSavedAt(tabState.getSavedAt());

            return tabStateRepository.save(state);
        }

        return tabStateRepository.save(tabState);
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