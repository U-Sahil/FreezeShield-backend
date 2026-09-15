package com.freezeshield.backend.repository;

import com.freezeshield.backend.entity.TabState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TabStateRepository
        extends JpaRepository<TabState, Long> {

    Optional<TabState> findTopBySessionIdAndTabUrlOrderBySavedAtDesc(
            String sessionId,
            String tabUrl
    );
}