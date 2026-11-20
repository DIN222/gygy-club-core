# GY-GY CHAT CORE
## Unified Technical Architecture
**Document:** GY-GY_CHAT_CORE_ARCHITECTURE.md  
**Version:** 0.1.3  
**Status:** Consolidated architecture baseline — component-by-component review in progress  
**Scope:** Universal chat architecture for GY-GY Club locations  
**Repository:** `DIN222/gygy-club-core`  
**Location:** `Development/GYGY_CHAT_CORE/`

---

## 1. Purpose

GY-GY CHAT CORE is a universal chat architecture intended for use by different GY-GY Club locations. It is designed as a reusable system rather than a collection of unrelated page-specific chats.

The architecture is divided into ten components. Each component has a distinct responsibility, while shared infrastructure is provided through Core Services. Components must cooperate through defined interfaces and shared mechanisms rather than independently duplicating foundational services.

This document consolidates the architectural decisions currently available from the design discussions and the existing De-Stress Studio readiness record. It is an architectural baseline, not a claim that implementation is complete or certified.

## 2. Architectural hierarchy and deployment

The universal chat is designed to operate within the established Club hierarchy:

**Location → Launch Complex 1 → Launch Complex 2 → … → Launch Complex n → Club-wide level**

A chat instance belongs to a location, while its shared mechanisms and operational coordination must respect the Launch Complex and Club-wide levels. A new Launch Complex must be able to reuse the established chat architecture without rebuilding its foundations.

The first integration sequence is:
1. De-Stress Studio;
2. Atelier «Horse in a Coat»;
3. Lunar Base.

The three locations are prepared and integrated into Launch Complex 1 as a separate stage. Completing one location's chat does not by itself mean that the whole Launch Complex is complete.

## 3. Component architecture

The approved component structure consists of exactly ten components, in this order:

1. Chat Interface
2. Topics
3. Messages
4. Replies & Quotes
5. Media
6. Reactions
7. Personal Space
8. Search & Notifications
9. AI & Moderation
10. Core Services

### 3.1. Component 1 — Chat Interface

**Responsibility:** The participant-facing interface through which the chat is accessed and operated.

Architectural requirements:
- Full functionality on desktop computers, tablets and smartphones.
- Responsive adaptation must preserve chat functionality rather than remove essential operations on smaller screens.
- One fixed visual theme is used; the chat does not provide a participant theme switcher.
- The interface supports localization.
- The participant's Passport language is the initial language. A participant may override the language in the chat; the selected chat language is persisted.
- The interface brings together topic navigation, the selected topic's messages, message composition, media viewing, replies and quotations, unread indicators, Personal Space access, notifications and connection status.
- Pagination/history loading must be supported without breaking the participant's position and context.

**Approved interaction rules for unfinished operations:**
- An unfinished operation can be collapsed without being cancelled.
- Collapsing the operation preserves its current stage and entered progress.
- The participant can continue reading the chat while the operation is collapsed.
- The participant can reopen the operation and continue from the preserved stage.
- No separate indicator is displayed to signal that a collapsed unfinished operation exists.
- The participant cannot start another operation while the previous one remains unfinished. A new operation becomes available only after the current operation is completed or explicitly cancelled.

The interface is a presentation and interaction component. Business rules, persistence, delivery guarantees and shared infrastructure belong to their responsible components and Core Services.

### 3.2. Component 2 — Topics

**Responsibility:** Creation, organization, navigation and lifecycle of discussion topics.

Known approved decisions:

**Topic creation**
- Any participant may create a topic.
- A topic title is mandatory.
- The first message starts the discussion.
- There is no separate "Short description" field.
- An optional introductory explanation may be displayed above the first message. This does not reinstate a separate short-description field.

**Topic title**
- Once published, the topic title cannot be changed through ordinary participant editing.
- An exceptional title-change procedure through OFFICE is permitted. Its detailed authorization and execution workflow belongs to the relevant OFFICE specification.

**Topic history, cover and tags**
- A topic change history is mandatory.
- The history must record changes to the topic cover, including adding, replacing and removing a cover.
- Actions involving topic tags must also be reflected in the topic history.
- Tag functionality was treated as architecturally worked through in the component discussion. This consolidated baseline records the history requirement without inventing tag rules that are not reproduced in the available decision record.

**Open decision:** The policy and exact behavior for deleting a topic have not been finalized. This document does not assume that topic deletion is allowed or define its consequences.

Topic navigation and topic-scoped search must use stable topic identity so that messages, replies, quotations and search results remain associated with the correct topic.

### 3.3. Component 3 — Messages

**Responsibility:** Message composition, publication, editing, version history, persistence and delivery state.

Approved reliability requirements:
- The server determines the order of accepted messages.
- Every accepted message receives a unique identifier.
- The system records sending time and server acceptance time.
- Simultaneous publications must not block or overwrite one another.
- Accepted messages must not be lost.
- Participants must see a consistent message sequence.
- A message is considered published only after server confirmation.
- Until confirmation, the message remains a pending send operation.
- On reconnection, the system checks whether the server accepted the message before offering a retry.
- A previously accepted message must not be published again.
- A unique send-operation identifier is reused across retries to prevent duplicate publication.

Editing and history:
- The original version of each message is retained.
- Each revision receives a version number and edit date.
- Version history remains accessible.
- Editing must not break references from replies and quotations.

**Details not yet finalized in the consolidated record:**
- Which message types and content formats are supported beyond the separately specified Media attachments.
- Who may edit a published message and whether editing is subject to a time limit or other conditions.
- Whether and under what conditions a published message may be deleted.
- The exact lifecycle and persistence rules for unsent drafts.
- The participant-facing presentation of pending, accepted and failed send states.
- Whether delivery, receipt and read confirmations beyond server acceptance are required, and their exact semantics.

These items remain open for explicit design decisions. They must not be inferred from the server-acceptance and duplicate-prevention rules above.

### 3.4. Component 4 — Replies & Quotes

**Responsibility:** Replies to messages, quotations and preservation of contextual relationships.

Approved requirements:
- Replies and quotations retain links to their original message.
- A quotation preserves the text selected by the participant at the time of quoting.
- Editing the original message does not break the history or links of replies and quotations.
- Message relationships must remain intact after recovery from a technical failure.

The detailed rules for nesting depth, display, editing or deleting replies, and any additional quotation controls are not established in the currently consolidated source material and must not be invented during implementation.

### 3.5. Component 5 — Media

**Responsibility:** Media attachments and their presentation within chat messages.

**Launch Complex 1 scope is deliberately minimal.** It includes:
- image and video attachments;
- display of media in the conversation;
- viewing images and playing supported video;
- the storage required for these basic operations;
- basic checks of file format, size and safety;
- reliable handling of partial upload failures.

Partial upload requirements:
- Successfully uploaded images are retained.
- Failed uploads are identified separately.
- Only failed uploads are retried.
- The participant does not have to restart the entire upload.
- Before publication, the participant confirms the final set of attachments.
- A message with an incomplete attachment set is not published without the participant's confirmation.
- Text and attached images are protected against loss caused by connection interruption.

A full media library, advanced editing and comprehensive media management are outside the initial Launch Complex 1 scope.

A shared GY-GY Club storage system is recognized as necessary. Its detailed architecture is deferred to the separate **Common Mechanisms of the Launch Complex** design stage. This document therefore does not prescribe its storage provider or implementation.

### 3.6. Component 6 — Reactions

**Responsibility:** Participant reactions to chat content.

The component's approved scope includes:
- likes;
- dislikes;
- reactions to individual images.

The detailed reaction catalog, multiplicity rules, change/removal behavior, visibility, counting and anti-abuse limits are not established in the consolidated source material. These are recorded as design details to resolve before implementation; no additional reaction types or policies are assumed here.

### 3.7. Component 7 — Personal Space

**Responsibility:** A participant's personal area within the chat.

The preliminary component scope discussed includes personal drafts, favorites, notes, reading history and personal settings. These items are recorded as the working scope, not as a fully finalized specification.

The exact contents, privacy boundaries, retention rules, synchronization behavior and participant controls require confirmation before implementation. Personal Space data must not be exposed to other participants unless a separately approved feature explicitly provides for it.

### 3.8. Component 8 — Search & Notifications

**Responsibility:** Finding content within the permitted scope and informing participants about relevant chat events.

**Approved search boundary:**
- Search is performed only inside the currently opened topic.
- Search covers message text and author nicknames.
- There is no general search across all topics in the current approved scope.

The interface includes unread indicators and notification access. The detailed notification event catalog, delivery channels, participant preferences, retention and batching rules require further specification. Shared notification delivery infrastructure is provided by Core Services.

### 3.9. Component 9 — AI & Moderation

**Responsibility:** AI-assisted capabilities and moderation support within the chat.

The approved component scope includes:
- translation support;
- detection of suspicious activity;
- routing disputed cases to OFFICE for review.

This component must remain distinct from the broader Club-wide architectural subject «Клуб — ИИ». The latter is a Club-level subject and is not being designed or replaced by this chat component.

The detailed moderation taxonomy, confidence thresholds, participant notices, appeal process, retention of moderation evidence, and exact authority boundaries for automated actions are not finalized in the currently consolidated component record. They must be specified separately before enabling consequential automated moderation actions.

### 3.10. Component 10 — Core Services

**Responsibility:** Shared infrastructure for the other nine components. Foundational mechanisms are implemented once as common services rather than duplicated independently in each component.

Core Services follows the full hierarchy:

**Location → Launch Complex 1 → Launch Complex 2 → … → Launch Complex n → Club-wide level**

#### 3.10.1. Reliability, recovery and availability
- Fault isolation: failure of one component or service must not automatically disable the whole chat.
- Centralized error handling integrated into the relevant Launch Complex mechanisms and the Club-wide mechanism.
- Chat-level diagnostics for all components, with results passed to the corresponding Launch Complex mechanism.
- Automatic detection of failed services and failover to backup instances.
- Availability Management: readiness and availability states, including full, limited and temporarily unavailable operation.
- Graceful Degradation: preserve core functions and limit only functions dependent on a failed element.
- Maintenance Mode for a component, service or the whole chat.
- Graceful Shutdown: finish or safely preserve active operations, save unfinished work and state, release resources and protect data.
- Backup and recovery of critical data.
- Integrity controls for loss, damage, duplication and inconsistent records.
- Environment readiness checks before startup.
- Transaction Management for consistent completion or rollback of related changes.
- Controlled recovery after interruption.

#### 3.10.2. Monitoring, diagnostics and traceability
- Unified logging of important events.
- Performance monitoring: response time, latency, resource use, queues and service availability.
- Correlation ID to trace an operation across components and associated logs.
- Self-diagnostics of Core Services, including its own integrity, dependencies, interactions, backup mechanisms and protective responses.
- Reporting to the appropriate Launch Complex level.
- Unified time management and clock synchronization, including timestamps and time-zone-aware display.
- Lifecycle management of temporary data: retention periods, cleanup, archiving and integrity of archives.

#### 3.10.3. Security, access and data governance
- Unified inter-component access management using least privilege.
- Encryption in transit and at rest.
- Secure management of keys and secrets.
- Secrets Management for API keys, passwords, tokens and other confidential technical data; secrets must not be stored in plaintext in source code or logs.
- Rate Limiting and protection against overload, mass requests and automated attacks.
- Data Governance: common policies for access, use, storage, transfer and deletion, respecting the rules of the applicable hierarchy level.
- Secure file operations and integrity verification.
- Protection against unauthorized access, corruption and substitution.

#### 3.10.4. Component coordination and lifecycle
- Event Bus for event-based communication without unnecessary hard dependencies.
- Queue Management: persistence of tasks during temporary unavailability, ordering and priorities, retries, duplicate prevention and tracking of unprocessed tasks.
- Scheduler for periodic checks, cleanup, maintenance, synchronization and other background tasks.
- Notification Management: unified notification delivery, delivery monitoring, retries and duplicate prevention.
- Component Lifecycle Management: startup, initialization, registration, suspension, shutdown and restart, respecting dependencies and readiness.
- Dependency Management and assessment of update impact.
- Compatibility Management for component versions, interfaces and data-exchange formats.

#### 3.10.5. Configuration, versions and updates
- Centralized configuration management.
- Configuration versioning and change control.
- Safe configuration application and rollback.
- Component version management, update control, conflict detection and rollback.
- Safe staged updates of infrastructure without full chat shutdown wherever technically possible.
- Feature Flags to enable or disable capabilities without changing core code, limit rollout by location, Launch Complex or participant group, and withdraw problematic features quickly.

#### 3.10.6. Resources, scaling and workload
- Resource Management and automatic scaling as demand grows.
- Architectural support for branching into multiple independent instances from the beginning, even if the first deployment uses one instance.
- Load Management and load balancing across available instances based on current utilization.
- Quota Management for requests, operations, storage and other resources across components, locations and Launch Complexes.
- Priority Management for requests, events and background tasks.
- Cache Management, including freshness, refresh and cleanup.

#### 3.10.7. Data consistency and transactions
- Data Synchronization between components and storage systems.
- Detection of discrepancies and resolution of conflicts.
- Verification that required participants in the system have received current data.
- Transaction Management to prevent partial, inconsistent updates.
- Data integrity controls and recovery mechanisms.

#### 3.10.8. External services
- API Gateway as the controlled interface for AI models, third-party platforms and tools.
- Access and key control, request/response handling, API limits and error handling.
- Ability to replace an external provider where feasible.
- Circuit Breaker to isolate a temporarily failing external service and test recovery.

#### 3.10.9. Localization, formatting, files and notifications
- Localization & Formatting: common language settings, date/time, number, currency and regional formats.
- File Management: safe upload, transfer, storage, reading and deletion; format and size checks; integrity and protection from damage or substitution.
- Notification Management as the shared delivery mechanism used by components.

#### 3.10.10. Prospective capability
Experiment & Testing Management is included as a future architectural capability. It may support controlled tests, comparison of implementation variants, collection of results and evaluation of impact. Full implementation is deferred; it is not a prerequisite for the initial chat launch.

**Core Services architectural analogy:** It serves as a common protective and sustaining system for the chat, somewhat like an immune system: it detects faults and threats, isolates problems, initiates protective responses, supports recovery and reports system condition. This analogy does not mean that Core Services replaces the specialized responsibilities of the other components.

## 4. Cross-component data and reliability rules

The following requirements apply across the components:
- Every accepted message has a unique identity and a server-defined place in the accepted sequence.
- A pending send is not treated as a published message until server confirmation.
- Retries must not create duplicate messages or attachments.
- Replies and quotations retain stable relationships with their source message.
- The original message and its version history are preserved.
- Partial media upload failures must be visible and recoverable without restarting successful uploads.
- Recovery must preserve confirmed messages and media, identify pending operations, prevent duplicates and preserve reactions and message relationships.
- Component failure must be isolated where possible; the chat should continue in a limited mode when safe.
- Shared services are provided centrally through Core Services and are governed at the appropriate hierarchy level.

## 5. De-Stress Studio readiness requirements

The existing `Development/DESTRESS_STUDIO/Architecture/CHAT_CORE_READINESS.md` record approves six architectural readiness areas for the De-Stress Studio chat:

1. Reliable message delivery and consistent server-accepted order.
2. Preservation of pending messages and attachments during connectivity loss, with safe retry and duplicate prevention.
3. Partial image upload recovery, retaining successful uploads and retrying only failed ones.
4. Conversation history integrity, including message versions and stable reply/quotation links.
5. Recovery after technical failure, verifying confirmed content, pending operations, duplicates and message relationships.
6. Readiness for increased load, including independent scaling of image storage, search and notifications, while prioritizing reading access and data integrity.

These are architectural requirements. They do not certify that an implementation has passed tests. Each area and their combined operation must be tested.

## 6. Scope and implementation discipline

- The ten-component structure is fixed as the approved architecture baseline.
- Each component must be implemented according to its responsibility; shared infrastructure belongs in Core Services.
- Launch Complex 1 uses a deliberately minimal Media implementation.
- Detailed design of shared Club storage is deferred to the Common Mechanisms of the Launch Complex stage.
- Experiment & Testing Management is prospective and may be implemented later.
- Architectural provision does not require immediate implementation of every advanced capability.
- No unresolved policy or behavior may be silently converted into an assumed requirement.
- Component-specific decisions must remain compatible with the wider hierarchy and with already operating locations and Launch Complexes.

## 7. Continuous review of Core Services

Core Services is not considered permanently closed after this initial design.

**After the launch of each subsequent Launch Complex, the project returns to the Core Services architecture and reviews it against actual operating experience.**

Each review checks:
- whether existing infrastructure mechanisms are sufficient;
- whether new requirements or dependencies have appeared;
- whether existing mechanisms need refinement;
- whether new risks have emerged;
- whether additional capabilities are necessary;
- whether proposed changes can be introduced without disrupting already operating Launch Complexes.

The results are incorporated into the next version of the Core Services technical document. This review cycle continues as GY-GY Club grows.

## 8. Open items requiring explicit decisions

The following items remain open in the currently consolidated record and must not be treated as approved implementation rules:
- Topic deletion policy and consequences.
- Detailed reply nesting and reply/quote editing/deletion rules.
- Full Media architecture and shared Club storage design.
- Reaction catalog and reaction behavior beyond the approved likes, dislikes and per-image reactions.
- Exact Personal Space contents, privacy controls and retention behavior.
- Notification event catalog, delivery channels and participant preferences.
- Detailed AI & Moderation policy, thresholds, notices, appeals, evidence retention and authority boundaries for automated actions.
- Detailed test cases and acceptance thresholds for each component and their integrated operation.

These open items should be resolved in the relevant component or Launch Complex design stage, then reflected in a revised version of this document.

## 9. Document status

This file consolidates the architecture currently recoverable from the approved discussions and the existing De-Stress Studio readiness record. Components 1–5 and Core Services have a number of explicit operational requirements recorded above. For components 6–9, only the scope and decisions explicitly available in the source record are stated; missing detail is deliberately marked open rather than fabricated.

**Status:** Consolidated baseline prepared for user review.  
**Next step:** Review this document against the full component discussions, resolve the listed open items where required, and then mark the unified architecture as approved for implementation planning.
