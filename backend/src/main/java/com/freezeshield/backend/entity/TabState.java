package com.freezeshield.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "tab_states",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "unique_session_url",
                        columnNames = {"session_id", "tab_url"}
                )
        }
)
public class TabState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 2048)
    @Column(name = "tab_url", nullable = false, length = 2048)
    private String tabUrl;

    @Column(name = "form_data", columnDefinition = "TEXT")
    private String formData;

    @Column(name = "scrollx", nullable = false)
    private int scrollX;

    @Column(name = "scrolly", nullable = false)
    private int scrollY;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;

    @NotBlank
    @Size(max = 100)
    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public TabState() {
    }


    // ==========================================
    // GETTERS AND SETTERS
    // ==========================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTabUrl() {
        return tabUrl;
    }

    public void setTabUrl(String tabUrl) {
        this.tabUrl = tabUrl;
    }

    public String getFormData() {
        return formData;
    }

    public void setFormData(String formData) {
        this.formData = formData;
    }

    public int getScrollX() {
        return scrollX;
    }

    public void setScrollX(int scrollX) {
        this.scrollX = scrollX;
    }

    public int getScrollY() {
        return scrollY;
    }

    public void setScrollY(int scrollY) {
        this.scrollY = scrollY;
    }

    public LocalDateTime getSavedAt() {
        return savedAt;
    }

    public void setSavedAt(LocalDateTime savedAt) {
        this.savedAt = savedAt;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}