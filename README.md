# FreezeShield

> Automatically preserves important webpage state so users can recover their work after page reloads, tab recovery, or browser tab discard.

---

##  Problem Statement

Modern browsers may reload, recover, or discard inactive tabs to manage memory and system resources.

When this happens, users can lose transient webpage state such as:

- Form inputs
- Textarea content
- Selected options
- Editable content
- Scroll position

For example:

A user spends several minutes filling out a long form. The browser later discards the tab. When the page is restored, the form may be empty and the user has to start again.

### The problem

> How can we automatically preserve important transient webpage state so that it can be restored when the page is recovered?

---

# Solution

**FreezeShield** is a Chrome Extension backed by a Spring Boot REST API and PostgreSQL database.

It periodically creates a lightweight snapshot of the current webpage state and stores it on the backend.

When the page is loaded again, FreezeShield identifies the page session, retrieves the latest snapshot, and restores the saved state.

---

#  Architecture

```text
┌──────────────────────────────┐
│       Chrome Browser        │
│                              │
│   FreezeShield Extension     │
│                              │
│  ┌────────────────────────┐  │
│  │      content.js        │  │
│  │                        │  │
│  │  Capture webpage state │  │
│  │  Restore webpage state │  │
│  └───────────┬────────────┘  │
│              │               │
│              │ HTTP/JSON     │
└──────────────┼───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Spring Boot API        │
│                              │
│  Controller                  │
│       ↓                      │
│  Service                     │
│       ↓                      │
│  Spring Data JPA             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         PostgreSQL           │
│                              │
│         tab_states           │
└──────────────────────────────┘




Tech Stack
Frontend / Browser
Chrome Extension
Manifest V3
Vanilla JavaScript
Chrome Extension APIs
sessionStorage
Backend
Java
Spring Boot
Spring Web
Spring Data JPA
Hibernate
Bean Validation
Maven
Database
PostgreSQL
Development Tools
IntelliJ IDEA
PostgreSQL / pgAdmin
Postman
Git / GitHub

 Key Features
1. Automatic State Capture

FreezeShield captures important webpage state including:

Text inputs
Email inputs
Textareas
Select elements
contenteditable elements
Horizontal scroll position
Vertical scroll position

Password inputs are explicitly excluded from capture.

2. Debounced Saving

FreezeShield does not send a database request for every keystroke.

Instead, it waits for the user to stop making changes for approximately one second.

User types:

H → He → Hel → Hell → Hello

       ↓

Wait 1 second

       ↓

Save snapshot

This reduces unnecessary API calls and database writes.

3. Page Session Identity

Each page receives a unique session identifier:

sessionId

The identifier is stored in:

sessionStorage

This allows FreezeShield to distinguish between multiple identical tabs.

For example:

Tab A
sessionId = A123

Tab B
sessionId = B456

Even if both tabs contain the same URL, their saved states remain separate.

4. State Restoration

When a page loads:

Page loads
    ↓
Get sessionId
    ↓
Get current URL
    ↓
Request latest saved state
    ↓
Restore fields
    ↓
Restore scroll position
5. Save-or-Update Behavior

The backend checks:

sessionId + tabUrl

If a state already exists:

UPDATE

If no state exists:

INSERT

This prevents unnecessary duplicate records.

 Important Engineering Decision: Why Not tabId?

The initial implementation used Chrome's tabId as the long-lived identity of a page.

During testing with Chrome tab discard/recovery, the browser environment demonstrated that the tab ID could change during recovery.

Therefore, using tabId as the persistent identity was not reliable enough.

FreezeShield was redesigned to use a page-level session identifier stored in:

sessionStorage

This identifier survived the tested discard/recovery flow and allowed the restored page to locate its previous state.

 Recovery Workflow
                    PAGE LOAD
                       │
                       ▼
              Get sessionStorage ID
                       │
                       ▼
               Get stable page URL
                       │
                       ▼
            Request saved state
                       │
                 ┌─────┴─────┐
                 │           │
               Found       Not Found
                 │           │
                 ▼           ▼
          Restore state    Continue
                 │
                 ▼
        Restore form fields
                 │
                 ▼
        Restore scroll position
                 │
                 ▼
          Page recovered
 Database Design

Table:

tab_states
Column	Description
id	Primary key
session_id	Unique page session
tab_url	URL of the webpage
form_data	Serialized webpage state
scrollx	Horizontal scroll position
scrolly	Vertical scroll position
saved_at	Last snapshot timestamp

The database enforces:

UNIQUE(session_id, tab_url)

This guarantees that one page session cannot have multiple state records for the same URL.

🔌 REST API

Base URL:

/api/v1/tab-states
Save / Update State
POST /api/v1/tab-states

Example request:

{
  "sessionId": "test-session-001",
  "tabUrl": "https://example.com",
  "formData": "[]",
  "scrollX": 100,
  "scrollY": 500
}

If the state does not exist:

INSERT

If it already exists:

UPDATE
Retrieve Latest State
GET /api/v1/tab-states?sessionId=test-session-001&url=https%3A%2F%2Fexample.com

Possible responses:

200 OK

or:

404 Not Found

when no saved state exists.

 Validation

The API validates incoming requests using Spring Bean Validation.

For example:

@NotBlank
@Size(max = 100)
private String sessionId;

and:

@NotBlank
@Size(max = 2048)
private String tabUrl;

Invalid requests are rejected before reaching the service/database layer.

FreezeShield also uses a centralized exception handler:

GlobalExceptionHandler

which returns structured validation errors.

 Security Considerations

FreezeShield is designed to minimize sensitive data capture.

Password fields

Password inputs are excluded:

input:not([type='password'])
Database credentials

Database credentials are supplied through environment variables instead of being hard-coded into source code.

Example:

spring.datasource.password=${DB_PASSWORD}
Production deployment

The production version should use:

HTTPS
Restricted CORS
Environment-based secrets
Database access controls
Appropriate API rate limiting
Minimal required extension permissions

 Testing

FreezeShield has been tested against several scenarios.

Normal Reload
User enters data
      ↓
State saved
      ↓
Page reload
      ↓
State restored
Multiple Identical Tabs
Tab A
session A
data A

Tab B
session B
data B

The two states remain independent even when both tabs use the same URL.

Chrome Tab Discard

The extension was tested using Chrome's tab discard functionality.

The tested recovery flow successfully restored:

Session identity
Saved form state
Scroll position
Backend Update Test

Initial request:

ID = 4
scrollX = 100
scrollY = 500

Second request with the same:

sessionId
tabUrl

but new scroll values:

scrollX = 999
scrollY = 888

The database record remained:

ID = 4

while the values were updated.

This confirmed that the service performs an update instead of creating another row.

Local Setup
Prerequisites

Install:

Java 21
Maven
PostgreSQL
Google Chrome
IntelliJ IDEA
Postman
1. Clone the Repository
git clone <repository-url>
cd FreezeShield
2. Create PostgreSQL Database

Create:

freezeshield_db
3. Configure Environment Variables

Set:

DB_PASSWORD=<your-postgresql-password>

Optional:

DB_USERNAME=postgres
DB_URL=jdbc:postgresql://localhost:5432/freezeshield_db
PORT=8080
4. Start Backend

Navigate to:

backend/

Run:

mvn spring-boot:run

Backend runs on:

http://localhost:8080
5. Load Chrome Extension

Open:

chrome://extensions

Enable:

Developer mode

Select:

Load unpacked

Choose:

FreezeShield/extension
6. Test

Open:

extension/test-page.html

Enter information into the fields.

Reload the page or test Chrome tab recovery.

FreezeShield should restore the saved state.

Project Structure
FreezeShield/
│
├── .gitignore
│
├── backend/
│   │
│   ├── pom.xml
│   │
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/
│           │       └── freezeshield/
│           │           └── backend/
│           │               ├── controller/
│           │               │   └── TabStateController.java
│           │               │
│           │               ├── entity/
│           │               │   └── TabState.java
│           │               │
│           │               ├── exception/
│           │               │   └── GlobalExceptionHandler.java
│           │               │
│           │               ├── repository/
│           │               │   └── TabStateRepository.java
│           │               │
│           │               ├── service/
│           │               │   └── TabStateService.java
│           │               │
│           │               └── BackendApplication.java
│           │
│           └── resources/
│               └── application.properties
│
└── extension/
    ├── manifest.json
    ├── background.js
    ├── content.js
    └── test-page.html

 Future Improvements

Potential future improvements include:

Public HTTPS backend deployment
Authentication and authorization
Better sensitive-field detection
Encrypted state storage
Automatic state expiration
User-controlled retention periods
Recovery history
Conflict resolution
Improved support for dynamic web applications
Chrome Web Store publication
Production monitoring and logging

