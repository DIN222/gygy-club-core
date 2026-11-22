# GY-GY CHAT CORE
## Unified Technical Architecture
**Document:** GY-GY_CHAT_CORE_ARCHITECTURE.md  
**Version:** 0.1.48  
**Status:** Consolidated architecture baseline with approved decisions through 2026-11-22  
**Scope:** Universal chat architecture for GY-GY Club locations  
**Repository:** `DIN222/gygy-club-core`  
**Location:** `Development/GYGY_CHAT_CORE/`

---

## 1. Purpose

GY-GY CHAT CORE is a universal chat architecture intended for use by different GY-GY Club locations. It is designed as a reusable system rather than a collection of unrelated page-specific chats.

The architecture is divided into ten components. Each component has a distinct responsibility, while shared infrastructure is provided through Core Services. Components must cooperate through defined interfaces and shared mechanisms rather than independently duplicating foundational services.

This document is the consolidated outcome of the current theoretical design stage. Version 0.1.48 incorporates the additional approved decisions recorded in Section 10. Where Section 10 explicitly updates or supersedes an earlier open item or formulation, Section 10 takes precedence. It brings together the architectural decisions established in the design discussions and the existing De-Stress Studio readiness record. It is the approved architectural baseline for practical implementation, not a claim that every component is fully specified at code level, that implementation is complete, or that the system has been tested or certified. Questions deliberately left open are to be resolved when implementation and integration make them concrete; practical findings may justify controlled revisions to this architecture.

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

**Cross-component clarification still required:** The approved preservation of progress when an unfinished operation is collapsed must be reconciled with Personal Space's explicit-command-only draft saving rule. The exact persistence boundary — including behavior after navigation, reload or reconnection, and whether the preserved operation is considered a draft — has not been established.

The interface is a presentation and interaction component. Business rules, persistence, delivery guarantees and shared infrastructure belong to their responsible components and Core Services.

### 3.2. Component 2 — Topics

**Responsibility:** Creation, organization, navigation and lifecycle of discussion topics.

Known approved decisions:

**Topic creation**
**Creation and first-message publication contract:**
- A topic is considered created and becomes available as a published topic only when its required first message has been successfully accepted by the server.
- Creating the topic and accepting its first message must behave as one logical publication operation: the system must not expose a fully created topic with a missing or unaccepted first message.
- If the first-message publication fails or its outcome is uncertain because of a connection interruption, the topic must not be presented as successfully created. The author can resume the operation after reconnection.
- On recovery, the system checks whether the first message was already accepted before offering a retry. An accepted first message must not be published again; the existing send-operation identity and duplicate-prevention requirements apply.
- The exact technical transaction or coordination mechanism is an implementation detail to be defined through the Topics, Messages and Core Services interfaces. The logical all-or-nothing creation rule is the architectural requirement.

- Any participant may create a topic.
- A topic title is mandatory.
- The first message starts the discussion.
- There is no separate "Short description" field.
- An optional introductory explanation may be displayed above the first message. This does not reinstate a separate short-description field.
- Once the topic is published, its author cannot edit the introductory explanation.

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
- If a participant cancels a reply before sending it, that reply is not published and is not retained in the conversation history.
- When another participant replies to a message, its author receives a visual notification.
- Notifications about new replies can be disabled in the participant's settings.

The notification preference controls whether the participant receives this reply notification; it does not change the reply itself or its relationship to the original message.

**Details not yet finalized in the consolidated record:**
- Whether a cancelled reply leaves any local draft text, and the exact lifecycle of that text.
- The permitted nesting depth and exact presentation of replies.
- Whether and how published replies may be edited or deleted.
- Additional quotation controls and the behavior of quotations when the original message is deleted.
- The detailed navigation behavior between a reply or quotation and its original message.

These items remain open for explicit design decisions and must not be inferred during implementation.

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
- Media automatically determines and reports the technical status of each attachment, including whether upload and required checks have completed successfully. This technical status is not a substitute for the author's confirmation.
- The author of the message alone confirms the final set of attachments to be included in publication. No other participant, moderator or OFFICE employee may confirm that set on the author's behalf.
- Messages must not publish the message with its attachments until the author has confirmed the final attachment set. If some uploads failed, the author may review the outcomes and confirm the final set to be published; the system must not silently treat failed or omitted files as accepted.
- If the connection is interrupted before the server confirms publication, the system checks the actual state of the message and its attachments after reconnection. It must not assume that an upload or publication succeeded merely because the author previously confirmed the set.
- Attachments that are still successfully stored and available are retained; they are not uploaded again unnecessarily.
- If one or more attachments are missing, unavailable or could not be recovered, the system explicitly informs the author which items are affected and that they are not currently available. The system must not silently omit them or claim that the full confirmed set is intact.
- The author restores or re-uploads the missing attachments and repeats the confirmation/publication operation for the corrected final set.
- Before offering a retry, Messages checks whether the server has already accepted the message. If publication was already accepted, the message must not be published again; the existing send-operation identifier and duplicate-prevention rules apply.
- A message with an incomplete attachment set is not published without the participant's confirmation.
- Text and attached images are protected against loss caused by connection interruption.

A full media library, advanced editing and comprehensive media management are outside the initial Launch Complex 1 scope.

**Centralized Media storage architecture:**
- Media files use a shared, centralized GY-GY Club storage system.
- Supabase Storage is accepted as the initial storage foundation.
- The Media architecture must remain independent of the storage provider so that the provider can be replaced or the storage system expanded without redesigning chat functionality.
- Files must retain their associations with the relevant messages and topics.
- Access control and protection of stored media are mandatory.

The detailed storage architecture and operational mechanisms are deferred to the separate **Common Mechanisms of the Launch Complex** design stage. The initial use of Supabase Storage does not make the chat architecture dependent on Supabase-specific storage behavior.

**Open storage-structure decision:** Whether images, videos and service thumbnails should be separated into distinct logical storage areas has not yet been decided.

Other detailed Media parameters not established in the consolidated decision record — including exact supported formats, file-size limits and thumbnail-generation rules — must remain open rather than being invented during implementation.
- Whether the image-upload recovery guarantees also apply to video uploads, including partial failure and reconnection recovery, remains to be explicitly decided.

### 3.6. Component 6 — Reactions

**Responsibility:** Participant reactions to chat content.

**Preliminary component scope identified in the earlier discussion:**
- likes;
- dislikes;
- reactions to individual images.

This list identifies the reaction areas proposed for the component; it is not a finalized approval of their detailed behavior or complete implementation scope.

**Decisions still required before implementation:**
- Whether likes and dislikes are the only reactions for messages, or whether other reaction types are intended.
- Whether a participant may apply one reaction or multiple reactions to the same message or image.
- Whether a participant may change or remove an existing reaction, and how that action works.
- Whether reactions apply to the whole message, individual images, or both, and how those targets are distinguished.
- How reaction identities and totals are displayed to participants.
- How reaction totals are counted and updated.
- Whether reaction activity generates notifications.
- What limits or safeguards are needed to prevent abuse.

No answer to these questions is assumed by this architecture baseline. The component's final scope and behavior remain open for explicit decisions.

### 3.7. Component 7 — Personal Space

**Responsibility:** A participant's personal area within the chat.

The working component scope includes:
- personal drafts;
- favorites;
- notes;
- reading history;
- personal settings.

The inclusion of these areas defines the working scope of Personal Space; their complete detailed specifications are not all finalized.

**Approved draft rules and privacy boundary:**
- A draft is saved only when the participant explicitly commands its saving. Automatic draft saving is not used.
- A saved draft can be reopened and continued later.
- Drafts belong to the participant's Personal Space.
- OFFICE has no access to the contents of a participant's drafts.
- Access by OFFICE personnel to other private communications or personal data is limited to employees who need the relevant information to review an assigned matter; private communications and personal data are not available through blanket administration-wide access.

Personal Space is private to its participant. Its contents must not be exposed to other participants unless a separately approved feature explicitly provides for it.

**Details still requiring explicit decisions:**
- The detailed behavior and controls for favorites, notes and reading history.
- The exact scope and behavior of personal settings within this component.
- Retention and deletion rules for each type of Personal Space data.
- Synchronization behavior across devices and sessions.
- Whether any specific Personal Space data, other than draft contents, may be accessed by authorized club systems, and under what strictly defined conditions.

The approved draft rules above must not be weakened by later implementation choices. Unresolved details must not be inferred during implementation.

### 3.8. Component 8 — Search & Notifications

**Responsibility:** Finding content within the permitted scope and informing participants about relevant chat events.

**Approved search boundary:**
- Search is performed only inside the currently opened topic.
- Search covers message text and author nicknames.
- There is no general search across all topics in the current approved scope.

**Approved notification control and push behavior:**
- Notification management uses a general participant control; separate switches for each notification type are not required.
- Notifications about new replies are subject to the general notification control and can be disabled through it; no separate reply-only switch is required.
- A push notification contains only the author's nickname and the topic title. It must not contain the message text.
- When the participant opens the push notification, the chat opens the corresponding topic and navigates to the message that triggered the notification.
- GY-GY CHAT CORE does not maintain a separate internal notification history.
- Search & Notifications defines the notification event, its intended recipient and the permitted content; Core Services provides the shared technical delivery mechanism.
- Core Services may retry a push delivery after a temporary failure. Retries must be bounded; delivery must not be attempted indefinitely.
- If the push cannot be delivered after the permitted retries, it is treated as undelivered. Failure to deliver the push does not remove or invalidate the underlying chat event or message.
- The underlying unread state remains available independently of push delivery, so the participant can see the unread message when they next visit the chat. This does not create a separate internal notification history.
- Delivery retries and recovery must avoid generating duplicate notifications where the delivery mechanism can determine that a prior attempt was already accepted.

The interface includes unread indicators and access to notifications. Shared notification delivery infrastructure is provided by Core Services.

**Details still requiring explicit decisions:**
- The complete catalog of events that generate notifications.
- Whether and how participants can subscribe to topics or notification categories.
- The detailed interface and behavior of the general notification control.
- Delivery channels beyond the approved push behavior, and their respective rules.
- Exact retry limits, retry intervals, batching and technical delivery acknowledgements.

The approved push-content restriction, navigation behavior, bounded retry rule and independence of unread state from push delivery must be preserved by implementation. Unresolved notification preferences and event rules must not be inferred.

### 3.9. Component 9 — AI & Moderation

**Responsibility:** AI-assisted capabilities and moderation support within the chat.

The working scope identified for this component includes:
- translation support;
- detection of suspicious activity;
- routing disputed cases to OFFICE for review.

These are the currently identified functional directions. Their detailed behavior and operational policies have not been fully specified in the consolidated component record.

**Approved boundary for disputed moderation cases:**
- AI may detect and flag a potentially disputed situation and refer it to OFFICE for human review.
- AI does not independently take moderation measures affecting the message or the participant before that review. Detection and referral are support functions, not a moderation decision.
- The case is passed to OFFICE for consideration by authorized staff. The AI and the assigned staff member may discuss the case: AI may analyze the available information, explain relevant considerations and recommend possible responses.
- The authorized OFFICE staff member retains sole responsibility and final authority for the moderation decision, including whether a message should be hidden or deleted.
- AI may carry out an action such as hiding or deleting a message only when explicitly instructed by the responsible OFFICE staff member. AI must not independently choose or initiate such an action.
- The review record must preserve the case history, including the relevant information considered, the AI–staff discussion and analysis, recommendations, the staff member's final decision, any actions carried out (including actions delegated to AI), and the known outcome.
- Access to a case record and its supporting materials is restricted to the OFFICE staff member or staff members assigned to that case, and the AI participating in its review. Other club employees and administrators receive no automatic access. Access is case-scoped and limited to what is necessary for the assigned review.
- After a case is closed, the AI may be granted access to its retained record for a separately authorized retrospective analysis of accumulated case experience. Closure does not create permanent or unrestricted AI access: each such review must have an explicit authorized purpose, remain within the approved scope, and expose only the case information necessary for that analysis.
- Authorization for retrospective access to closed case records must be granted by an authorized OFFICE staff member; AI must not authorize its own access or expand the scope of its own review. The authorization must identify the purpose, scope and records permitted for the task.
- The authorization record must preserve who granted the permission, when it was granted, its defined purpose and scope, the case records or information made accessible, and the period for which access is permitted. Any renewal, change or revocation of the authorization must also be recorded. If the designated AI identifies that additional case records or information may be necessary to complete the authorized retrospective analysis, it may submit a reasoned request to the authorized OFFICE staff member for an extension or change of scope. The request must explain the newly identified circumstances and specify the additional access sought. The AI must not access the additional records or information unless and until an authorized OFFICE staff member explicitly approves the request; the approval and any resulting scope change must be recorded. The authorized OFFICE staff member may approve or refuse the request. A refusal must include an explanation of the reasons for the decision. Where the original authorization remains sufficient for meaningful work, OFFICE may direct the AI to continue within the original scope; such direction does not authorize access to any additional records or information. If the designated AI considers that analysis within the original scope would produce an incomplete, unreliable or materially limited result, it must explain its assessment to OFFICE, identify the relevant limitations and recommend appropriate options. This is a reasoned recommendation, not a refusal to carry out the authorized task. If OFFICE directs the AI to proceed within the original scope, the AI must do so and clearly state the scope limitations and their effect on the reliability or completeness of its findings. OFFICE must also review the circumstances, draw its own conclusions and consider whether its procedures, decisions or working practices should be adjusted. The resulting human review and any approved changes must be handled through the applicable OFFICE governance and recorded processes. Relevant conclusions, lessons and approved improvements arising from this review must be captured in the Club's shared body of practical operating experience so that other relevant departments and future reviews can benefit from them. Sharing must follow defined access and need-to-know boundaries; making lessons available across the Club does not grant other departments access to the underlying case records or private information.
- The end of the stated access period is a mandatory review point, not an automatic revocation. Before or at that point, the designated AI and the responsible authorized OFFICE staff member must jointly review the task's progress, continuing need, scope and any new circumstances. They may recommend or agree that access should end, continue, be extended or be changed as appropriate. Any continuation or extension must be explicitly renewed and recorded by the authorized OFFICE staff member; AI cannot renew or prolong its own access. The authorization may also be ended or revised earlier when circumstances warrant, with the decision and its rationale recorded.
- Retrospective analysis involving multiple cases or broader cross-case comparisons requires an explicitly defined authorization scope appropriate to that wider analysis. The authorizing OFFICE staff member or designated OFFICE authority must approve the selected case set and permitted information before the analysis begins.
- A retrospective review may be assigned not only to the AI that participated in the original case, but also to a different AI instance or service specifically designated for that review. Such an AI receives only separately authorized, case-scoped access to the information necessary for the defined retrospective task; designation does not grant general access to the case archive.
- AI may proactively identify recurring problems, patterns or systemic weaknesses in OFFICE operations within the information and records it is already explicitly authorized to access, even when no individual review task has requested that specific analysis. It may report its observations and evidence-based recommendations to OFFICE for human consideration. This capability does not grant additional data access, authorize AI to initiate changes, or transfer decision-making authority from authorized people.
- A separately authorized retrospective analysis may compare multiple closed cases to identify recurring situations, patterns and broader correlations. The authorization must define the purpose and scope of the comparison, and the designated AI may access only the records and information necessary for that task. Permission to compare selected cases does not grant general or standing access to the archive.
- The designated AI may provide OFFICE staff with evidence-based recommendations arising from retrospective analysis, including suggested improvements to workflows, safeguards or AI-assisted support. Recommendations must explain their supporting observations, reasoning, expected benefits and relevant uncertainties or risks. They are advisory only: they do not change club rules, moderation policy, permissions, procedures or AI operating boundaries unless separately reviewed and approved through the Club's established human-governed process.
- Recommendations arising from retrospective analysis must be submitted to a dedicated OFFICE review queue or equivalent tracked review workflow so they can be considered without being lost among active casework. Their submission does not constitute approval or authorize implementation; an authorized human reviewer must assess and decide whether to accept, reject, defer or request further analysis.
- When a recommendation is approved for implementation, its subsequent lifecycle must be tracked in the OFFICE workflow. The record must identify the human staff member or responsible role accountable for implementation, the decision and agreed scope, the implementation status and relevant dates, whether implementation was completed, and the observed result or evaluation when available. AI may assist with monitoring, analysis and reporting, but accountability for implementation and approval of any resulting operational or policy change remain with authorized people.
- These records form practical operating experience for AI-assisted analysis and improvement: they can be reviewed to identify patterns, assess prior recommendations and outcomes, and improve future support to OFFICE staff.
- Accumulated case experience does not authorize AI to change club rules, moderation policy, permissions, decision authority or its own operating boundaries. Any such changes remain subject to the Club's established human-governed approval process.
- The AI flag and referral to OFFICE are internal workflow events. The participant is not notified merely because AI has flagged a message or referred the case for review.
- Whether and how a participant is informed of an outcome or a subsequent decision that affects their message or account remains a separate open policy question.

**Architectural separation:**
- AI & Moderation covers AI-assisted functions and moderation support within GY-GY CHAT CORE.
- It is distinct from the broader Club-wide architectural subject «Клуб — ИИ».
- The Club-wide «Клуб — ИИ» architecture addresses the relationship and coexistence of AI and the GY-GY Club as a whole. It is not reducible to chat moderation, translation or a chat assistant, and must be designed separately at Club level.
- The chat component must not be treated as the specification or source of authority for the Club-wide AI architecture.
- OFFICE is a staff-only environment with a separate authentication entry. OFFICE authorization is not participant authentication and must not be required for club visitors.

**Details still requiring explicit decisions:**
- The moderation taxonomy and what qualifies as suspicious activity.
- Detection methods, confidence thresholds and handling of uncertain results.
- The detailed moderation decision procedure, the criteria and limits for hiding or deleting content, and the operational controls for AI execution of an explicitly authorized OFFICE decision.
- The detailed authorization workflow, scope and access controls for retrospective AI reviews of closed case records; access auditing; retention periods; and the governed process for reviewing accumulated case experience and incorporating approved improvements.
- How disputed cases are submitted to and reviewed by OFFICE, including responsibility for final decisions.
- Participant notification and explanation after a moderation decision affecting their message or account: whether the participant must be notified, what reasons or details may be disclosed, and when. This is a prospective policy question; defer detailed discussion until the relevant moderation and participant-notice design becomes timely.
- What participants are told when AI or moderation processes affect their content or account.
- Whether participants can challenge or appeal a moderation decision, and how that process works.
- What moderation evidence is retained, who may access it and for how long.
- The exact information and attachments that may be made available to OFFICE when a disputed case is referred for review; access must follow the need-to-review restriction stated in Personal Space.
- Translation must not replace the original message text; the original remains available alongside translation support.
- The exact behavior, availability and participant controls for translation support.

No specific automated moderation powers, sanctions or appeal procedures are established by this baseline. They must not be inferred during implementation.

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
- Connection Management: management of chat connection state, connection loss and restoration, coordinated with the relevant component operations.
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

### 3.11. Cross-component responsibility boundaries

The following responsibility boundaries are an explicit architectural contract between components. They define ownership at the level of responsibility; they do not silently settle unresolved policies or prescribe a specific technical implementation.

**Messages**
- Owns the message lifecycle and message-level semantics: composition, publication, server acceptance state, ordering requirements, editing and version history, and the message's association with its topic.
- Coordinates publication of a message that contains attachments, but does not own the technical upload, storage, processing or delivery mechanisms for media files.

**Media**
- Owns the technical lifecycle of media attachments: upload, storage, processing, media access and presentation.
- Maintains the technical association between each media object and the relevant message or topic.
- Makes attachment readiness and upload outcomes available to the message-publication flow. The exact interface, states and identifiers remain to be specified in the detailed Media/implementation design.
- Media reports technical attachment readiness and upload outcomes to the message-publication flow. The author alone makes the publication-level confirmation of the final attachment set; automated technical readiness checks do not constitute that confirmation, and no other person may confirm on the author's behalf.
- Messages enforces the publication gate: a message containing attachments is not published until the author's confirmation of the final attachment set has been received. The exact technical interface and state model remain part of detailed design.
- Does not independently publish or define the content semantics of a chat message.

**Core Services**
- Provides shared infrastructure and generic mechanisms used by the components, including reliability, queues, transactions, recovery, security, storage-related foundations, event coordination and notification delivery.
- Does not take ownership of component-specific business rules, message semantics, media policies or moderation judgments.
- Supplies mechanisms; the component that owns a function remains responsible for defining what that function means and when it should be invoked.

**OFFICE**
- Is the staff-only environment in which authorized personnel may review matters referred for human consideration, including disputed cases routed from AI & Moderation.
- Acts only within the access restrictions and authority granted by the applicable OFFICE architecture and procedures.
- Does not receive blanket access to participant communications or Personal Space. Access to private information is limited to personnel who need the relevant information to review an assigned matter; draft contents remain inaccessible to OFFICE.
- The exact referral payload, evidence and attachment access, review workflow, decision authority and resulting actions remain open for explicit definition.

These boundaries are complementary: Messages owns the message, Media owns the technical media lifecycle, Core Services supplies shared infrastructure, and OFFICE performs authorized staff review. Where a workflow crosses these boundaries, the components must cooperate through defined interfaces without transferring ownership of one another's responsibilities.

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

**After each Launch Complex is launched and operating experience becomes available, the project must return to the Core Services architecture and review it against actual operating experience.** This applies to every Launch Complex, not only when preparing the next one. The review includes practical validation of the shared mechanisms in operation.

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
- Detailed AI & Moderation policy, thresholds, notices, evidence retention and authority boundaries for automated actions.
- Participant appeal or review process for OFFICE moderation decisions, including eligibility, submission route, review responsibility, timing, and possible outcomes. This is a prospective question and will be addressed when the moderation and participant-notice framework is designed.
- Whether and how the history of OFFICE decisions must preserve the full sequence of decisions, reviews, revisions and changes, so that the development of a case can be reconstructed. This is a prospective question to be addressed when the relevant decision-history and case-record requirements are designed.
- The persistence boundary for collapsed unfinished operations and their relationship to Personal Space drafts, which are saved only by explicit participant command.
- Detailed test cases and acceptance thresholds for each component and their integrated operation.
- OFFICE collaboration architecture: the structure and relationship of OFFICE CHAT, live meetings and other organized working sessions, including whether chat spaces are shared or divided by departments and functions. This question is deliberately deferred until all three Launch Complex 1 locations — De-Stress Studio, Atelier «Horse in a Coat» and Lunar Base — are ready for integration; it will then be revisited as part of the broader discussion of their integration and the corresponding OFFICE arrangements.

These open items should be resolved in the relevant component or Launch Complex design stage, then reflected in a revised version of this document.

## 9. Document status

This document is the final consolidated architectural baseline for the current theoretical design stage. It records the approved decisions and explicitly separates them from unresolved questions. The maturity of the ten components is not uniform; this is intentional and must remain visible during implementation.

**Current architecture maturity by component:**
- **Chat Interface:** Core interaction and responsive behavior are defined. Persistence behavior for collapsed unfinished operations remains open.
- **Topics:** Creation, first-message publication, title and history principles are defined. Topic deletion policy remains open.
- **Messages:** Server acceptance, ordering, identity, retry and version-history principles are defined. Editing rights, deletion, drafts and delivery/read semantics remain open.
- **Replies & Quotes:** Stable relationships, quotation preservation and basic reply-notification behavior are defined. Nesting, editing/deletion and detailed navigation remain open.
- **Media:** Launch Complex 1's minimal image/video scope, author confirmation and partial-upload recovery principles are defined. Detailed storage design and media parameters remain open for the Common Mechanisms stage and implementation.
- **Reactions:** The preliminary scope is identified; detailed reaction behavior remains open.
- **Personal Space:** Its working scope, explicit-command-only draft saving and key privacy boundaries are defined. Detailed behavior and retention rules remain open.
- **Search & Notifications:** Topic-scoped search and key push-content, navigation and delivery-recovery rules are defined. The full event catalog, channels and preference details remain open.
- **AI & Moderation:** Human decision authority, AI support boundaries, case-scoped access, retrospective review, evidence-based recommendations and the controlled learning/improvement cycle are defined. Detailed moderation policy, thresholds, evidence rules and participant-facing procedures remain open.
- **Core Services:** The shared infrastructure responsibilities and continuous post-launch review principle are defined. Detailed technical designs and operational thresholds will be validated during implementation and operation.

**Status:** The theoretical architecture-design stage is complete for now. This document is the baseline for practical implementation. It does not imply that every open item has been resolved or that every component is fully specified at code level. Open questions must remain explicit and must not be silently converted into assumed requirements. They should be revisited when coding, testing, integration and operating experience make them concrete. Any resulting architectural change must be reviewed and recorded in a subsequent document version.

**Latest update:** Version 0.1.48 incorporates the approved decisions through 2026-11-22. The original ten-component structure and the approved Launch Complex 1 staging remain unchanged. Section 10 records later decisions and takes precedence over earlier conflicting or superseded open-item formulations.

**Next step:** Use this document as the architectural reference for practical implementation of GY-GY CHAT CORE. Validate component contracts through code and tests, resolve deferred questions at the appropriate stage, and then proceed to the organization and integration of the three Launch Complex 1 locations.


---

## 10. Approved architectural decisions incorporated after version 0.1.47

**Precedence and interpretation**

This section records decisions approved in the subsequent CHAT CORE architecture discussions through 2026-11-22. It is a normative part of this document, not an informal proposal list. Where it updates an earlier open item or conflicts with an earlier preliminary formulation, the approved decision in this section takes precedence. Earlier provisions that do not conflict remain valid.

The expanded capabilities below describe the agreed CHAT CORE architecture. Their implementation may be staged. They do not mean that every advanced capability must be included in the first De-Stress Studio deployment or that the deliberately minimal Launch Complex 1 Media scope has been silently expanded.

### 10.1. Topics — additional approved details

- The topic list uses the following columns: **Topics, Replies, Author, Views, Last message**.
- The first message remains mandatory and starts the discussion.
- The optional introductory explanation is displayed above the first message. It is not a separate short-description field.
- After publication, the author cannot edit the introductory explanation.
- The topic title cannot be changed through ordinary participant editing after publication. An exceptional change through OFFICE remains subject to the relevant OFFICE procedure.
- Topic creation and acceptance of its first message form one logical publication operation. A topic is not exposed as successfully created until the first message is accepted by the server.
- If publication fails or its result is uncertain, the participant can resume the operation after reconnection. The system checks whether the first message was already accepted before retrying and prevents duplicate publication.
- Topic history records cover changes and tag-related actions.
- Topic deletion policy remains open unless separately decided in the applicable architecture.

### 10.2. Messages — editing, deletion and personal archiving

The later approved decisions resolve the earlier open questions about participant editing and deletion as follows.

**Editing**
- A participant may edit their own published messages without a time limit.
- The original version and every subsequent revision are retained.
- Each revision has its date and exact time.
- The “Edited” indicator opens the revision history.
- Two versions can be compared, with added, removed and changed content highlighted.
- Any earlier version can be restored. Restoration creates a new revision and does not erase later history.
- The participant can copy the full text or a selected fragment from any historical version.
- Attachments can be added, removed or replaced. Earlier files and attachment compositions remain in history.
- The general message text and individual attachment comments can be edited independently; their histories and associations are preserved.
- Attachment order can be changed. Historical order is retained and comments remain associated with their files.
- ALT text can be added, edited or removed after publication. Its history and language versions remain associated with the image.
- A displayed filename can be changed without changing the original filename or file contents.
- Before saving, the participant can compare the prepared revision with the published version, inspect a preview and cancel without publishing.
- Intermediate editing states are automatically preserved as unpublished temporary states, recoverable after closing the interface or losing connection. They are visible only to the author.
- Several intermediate states can be reviewed, compared and restored. Restoring an earlier state does not delete later states.
- Conflicts between devices must never silently overwrite changes. Compatible changes may be merged, followed by a review before publication.
- The author is notified if the message changes on another device while it is being edited. Optional locking can prevent editing on the author's other devices during the current editing session; the lock is released when the session ends or is cancelled, including appropriate handling of connection loss.

**Deletion and trash**
- A participant may delete their own published messages.
- Deletion removes the message from the ordinary conversation view but does not silently destroy its revision history or associated data; the technical relationship is retained.
- Deleted messages enter a personal trash.
- The trash supports viewing, individual and bulk restoration, and permanent deletion with confirmation.
- Restoration preserves revision history, attachments, comments and ALT.
- Trash is synchronized between devices.
- Automatic permanent deletion occurs 30 days after the message enters the trash. The remaining period is displayed; earlier permanent deletion is available with confirmation.
- Bulk actions support selecting multiple or all items for restoration or permanent deletion.

**Personal archive of sent messages**
- A participant may archive their own sent messages. Archiving hides them only from that participant's main list; other participants continue to see the messages normally.
- The personal archive has its own view, search, filtering, sorting and restoration.
- Archived messages retain revisions, reactions, attachments and their links.
- The archive supports nested folders, manual organization, favorites, tags and color labels.
- One archived message may be referenced from more than one folder without creating duplicate message objects.
- Export and import support individual messages, groups, folders or the full archive, with selectable content and preservation of message text, explanations, attachment comments, files, dates, revision history, folder structure, tags and favorites.
- Import includes preview, selective restoration, integrity and compatibility checks, and duplicate handling: skip, replace or create a copy. Existing data is not changed without an explicit choice.
- Export/import activity is recorded in the shared CHAT CORE operation log, including date/time, operation type, result, counts and errors, with a link to the archive file where available. The log does not store the content of private messages.

### 10.3. Replies & Quotes — expanded relationship and chain model

- A participant can reply to a specific message using the “Reply” action.
- The reply shows a compact quotation of the original, the author's nickname and a text excerpt.
- Selecting the quotation opens and highlights the original message.
- The link remains stable when the original message is edited.
- A participant can quote a selected text fragment. The quoted text, source link and relationship to the original message history are preserved.
- A participant can quote an individual attachment. The quotation identifies its author and shows a thumbnail or the file name/type; it retains the relationship to the original message and attachment, including historical state if the attachment is replaced or removed.
- Multiple attachments can be quoted.
- Replies to replies are supported. Each reply retains its direct parent relationship and its position in the complete chain.
- The conversation view shows the immediate context; the full chain remains accessible.
- A dedicated chain view displays the source message and all related replies in chronological order and by nesting level, with links, highlighting, attachments and revision history.
- Branches can be collapsed and expanded individually or as a whole. The interface shows the number of hidden messages; the display state is synchronized.
- Chain navigation supports previous/next and first/last items, accounts for collapsed branches and expands a branch when necessary to reach the target.
- Search within a chain supports text, author, dates, quoted fragments, attachment content where available and file names. Results preserve chain structure and respect access rights.
- Participants can save entire chains, selected branches or multiple branches to favorites.
- Favorite chains support personal names and notes, folders with unlimited nesting, multiple-folder references without duplication, tags and color labels.
- Personal notes on a favorite chain are private, searchable, editable and deletable, with date/time and revision history.
- Export/import of favorite chains preserves messages, replies, chronology, nesting, attachments, quotations, links, personal names, notes, folders, tags and colors. It uses the common CHAT CORE export/import mechanism and shared operation log; “Favorite chains” is a separate operation category.

### 10.4. Media — expanded attachment and document capabilities

The Launch Complex 1 initial deployment remains deliberately minimal as specified in Section 3.5. The following are approved capabilities for the broader CHAT CORE Media architecture and may be implemented in stages.

**Grouped file preparation and upload**
- Multiple files can be selected or added by drag-and-drop.
- Each file has its own pre-publication card and can be removed independently.
- The interface shows file name, format and size, a group-level upload indicator and each file's individual status.
- Individual uploads can be cancelled.
- A shared explanatory text can accompany the group and appears before the file cards; it is optional.
- Each file can have its own optional comment, independently editable or removable before publication.
- File order can be changed by drag-and-drop and is preserved after publication; comments remain bound to their files.

**Group attachment drafts**
- A group can be saved as a draft with its files, order, shared text and individual comments.
- Drafts can be reopened, continued, modified, have files added/removed, or be deleted. They are not visible to other participants before publication.
- Autosaving occurs when text, composition, comments or order changes.
- The latest state is restored after closing and reopening; the interface indicates saving status.
- Drafts synchronize between devices. Reconnection triggers synchronization; conflicts must not silently discard changes.
- Draft version history supports viewing, restoring and comparing versions. Restoring an earlier version does not delete later versions.
- Drafts support names, search across name/text/file comments, sorting, nested folders, favorites, user tags, colors and bulk operations.
- A draft can be archived. Archived drafts remain searchable and recoverable and preserve text, files, comments, tags and versions.
- Draft trash supports individual and bulk restoration, permanent deletion with confirmation and automatic cleanup after 30 days. The remaining retention period is displayed.
- After successful publication, the draft is removed from active drafts while the published message remains. A new independent draft may be created from the sent message. If publication fails or is interrupted, the draft remains.

**Preview, thumbnails and accessibility**
- The system detects file format and compares the actual format with the extension; it identifies damaged or malformed files where possible.
- Preview is supported for images, PDF and supported text documents. The original file is not changed.
- If preview is unavailable, the participant receives a clear notice and may download the file when permitted.
- Image thumbnails and first-page document/PDF thumbnails are generated where supported; otherwise a file-type icon is shown.
- Thumbnails adapt to device and display size while preserving proportions and readability. Caching is supported.
- Lazy loading begins as a message approaches the visible area. Text takes priority on slow connections.
- Placeholders reserve layout space; failed thumbnail loading does not break the message list or neighboring items.
- Automatic retry follows a network error, followed by a manual retry option. Successfully loaded thumbnails are not unnecessarily reloaded.
- ALT text is supported for images and thumbnails. Author-provided ALT takes precedence; AI may suggest ALT when absent, and a neutral file-type description is used if no meaningful ALT is available.
- Authors can add or edit ALT without re-uploading the image.
- ALT supports multiple language versions, author translations, AI-assisted translation when an author version is unavailable, interface-language selection and fallback to the source version. Translation does not alter the original ALT.
- ALT quality checks may identify empty, generic, malformed or duplicate descriptions. AI suggestions require author acceptance; there is no automatic replacement.
- ALT language can be detected automatically, with manual selection for ambiguous cases.

**Text extraction and OCR**
- Text can be extracted from PDFs and supported documents for search and screen-reader access where technically possible, preserving logical structure where available. The original file remains unchanged.
- OCR is available for scans and images embedded in PDFs.
- OCR detects languages automatically and supports multilingual documents and language changes within a document. The language of recognized fragments is retained for search and reading.
- Recognized fragments retain page numbers and coordinates where available; search can open the corresponding page and highlight the fragment. If highlighting is unavailable, the page is still opened.
- Recognized text can be copied by fragment or in full. Logical order, columns and tables are preserved where possible.
- OCR confidence is retained by word or fragment; uncertain regions are marked and considered in search and display.
- Low-confidence regions may be processed again using alternative parameters without re-uploading the file. Results can be compared; both evaluations and their history are retained.
- Authorized OFFICE staff may manually correct OCR text. Corrections are stored separately from the original OCR, with author, date/time and revision history.
- The verified text is used for search, copying and reading; manually corrected portions are visibly marked, and the original and corrected text can be compared.
- A manual correction can be cancelled, returning to the original OCR while retaining the corrected version in history. A new correction can then be made.
- OCR versions can be compared with added, removed and changed content highlighted.
- Verified text can be exported separately from the source PDF, preserving structure and indicating manual corrections.

File quarantine, antivirus infrastructure, shared storage design and other cross-club security mechanisms remain in the relevant common Launch Complex architecture, not duplicated as local CHAT CORE infrastructure.

### 10.5. Reactions — approved interaction model

- Reactions are displayed chronologically.
- A participant cannot react to their own message or to an OFFICE message that has been deleted.
- When an OFFICE message is deleted, its displayed reactions disappear while the event history is retained.
- Participants may react to other participants' reactions.
- Reaction-to-reaction interaction has a maximum of two levels; second-level reactions are displayed on a separate line.
- Multiple different reactions may be attached to one reaction. Chronology is preserved at both levels.
- The nickname of the author of the original reaction is displayed beside it.
- A participant may react to their own reaction.
- If an original reaction disappears, its second-level reactions also disappear from the visible interface; the event history is retained.
- Reaction lists are collapsed by default: the first three are shown, followed by “Show more”. Expanded lists offer “Collapse”. If there are three or fewer reactions, all are shown.
- Selecting a reaction opens a profile pop-up for its author. It shows the same public information as the profile of a message author.
- Reaction events do not generate the topic-subscription notifications defined in Search & Notifications.

### 10.6. Personal Space — approved personal tools

Personal Space is the participant's private workspace. Its objects do not alter the original messages. Personal information is private and synchronized across the participant's devices where the feature specifies synchronization. The earlier rule that saved drafts are created only by explicit participant command remains in force for ordinary message drafts; the separately approved autosaving of in-progress attachment-group drafts and message-editing temporary states is limited to those explicitly defined workflows and does not establish universal automatic draft saving.

#### 10.6.1. Personal message collection

- A participant can save any message available to them, individually or in groups.
- The original remains unchanged. The saved item retains author, date, text, original link and available relationships, including attachments, quotations and replies.
- Participants can open the original. Removing an item from the personal collection does not delete the original.
- The collection is private to its owner.
- Entire reply chains, selected branches and multiple branches can be saved with chronology, authors and relationships. They can be viewed as a whole and linked back to their originals.
- A chain or branch can be removed from the collection independently.
- Personal folders support unlimited nesting. One item may be referenced in multiple folders without duplication; removing one folder reference does not remove the item from other folders.
- Deleting a folder does not delete its materials; items remain in the general list or can be moved to another location.
- The collection supports favorites, personal tags and color labels. Several tags may be assigned to one item; tags can be shared across items, edited and deleted, and filtered in combination.
- Several personal notes may be attached to one item. Notes do not change the original and support search, creation/editing/deletion, date/time, revision history, comparison and restoration. Restoring a previous note version creates a new revision.
- Export/import supports all or selected messages, chains, branches and folders. It preserves text, authors, dates, quotations, files, links, folder structure, favorites, tags, colors, notes and note history. Import includes preview, selective restoration, integrity/compatibility checks and duplicate handling: skip, replace or copy.
- The shared CHAT CORE export/import mechanism and operation log are used; “Personal collection” is a distinct operation category. The log records date/time, type, result, counts, errors/compatibility and file reference, but not private message or note content.
- Deleted collection items enter a trash. Individual and bulk restoration preserve folders, favorites, tags, colors, notes and history. Permanent deletion requires confirmation. Automatic cleanup occurs 30 days after deletion; the remaining period is displayed and earlier deletion is possible.
- The collection has a separate archive. Archiving does not trigger the 30-day trash cleanup. It supports search, view, restore, sorting, filters, nested archive folders, multiple-folder references without duplication, independent favorites, tags, colors and bulk operations.
- Archive export/import uses the shared mechanism, separately or together with the active collection. Pre-import checking covers structure, messages, chains, attachments, relationships, folders, tags, favorites, colors, metadata, duplicates, incompatibilities and corruption.
- Previously imported archives can be rechecked wholly or selectively. Results are compared with earlier reports; history records date/time, resolved, persistent and new problems and provides navigation to affected items.
- Structural relationships and missing attachments may be restored only through controlled procedures: locate likely source by identifiers, checksums and metadata; show a preview; require owner confirmation; leave ambiguous cases for manual decision; retain original state and history; allow restoration to be cancelled. No uncertain substitute is silently inserted.
- Archive integrity statuses are: **Check passed; Check passed with remarks; Recovery required; Recovery impossible.** Status is assigned to the archive and individual items, recalculated after recovery or recheck, and prior results remain in history.

#### 10.6.2. Personal collection reminders

- Multiple independent reminders may be attached to one message, chain or branch.
- Each reminder has its own date, exact time and explanatory text; it can be edited, cancelled or marked complete.
- Notifications provide a link to the associated material. Reminders synchronize between devices.
- Reminders support daily, weekly and monthly recurrence, selected days/times, an end date or occurrence count, pause/resume, changes to future occurrences, and cancellation of one occurrence or the whole schedule.
- A calendar supports day, week and month views, status display, filters and search. Reminders can be created, edited, cancelled or moved from the calendar. For recurring reminders, the participant chooses whether a change affects one occurrence, future occurrences or the whole schedule.
- Reminders can be grouped by folders, tags or personal categories; multiple categories may apply to one reminder. Overdue reminders are separately accessible.
- Bulk operations support moving, categorizing, tagging, completing and cancelling selected reminders, with confirmation where needed and a recorded result.
- Reminders can be exported/imported alone or with the collection through the common mechanism, preserving dates, schedules, explanatory text, categories, tags and links.
- If the linked material becomes unavailable, the reminder remains active and retains its schedule and original information. The link state and reason are shown. When possible, the link can be restored or reassigned to another material without erasing the original association or history.
- A separate list identifies reminders with problematic links and supports filtering, search and controlled restoration/reassignment. Resolved items leave this list; history is retained.

#### 10.6.3. Personal thematic collections

Personal thematic collections are independent named groupings of saved messages and chains. They are not substitutes for folders in the personal collection or its archive.

- A participant can create named collections and add individual messages, whole chains, selected branches or several materials at once.
- One material may belong to several collections without copies. Links to originals are retained.
- Removing a material from a collection does not remove it from the personal message collection. Deleting a collection does not delete its materials.
- Collections are private to their owner and synchronize across devices.
- Each collection has its own manual material order, including drag-and-drop. Automatic ordering may use save date, author or material type; the participant can switch between manual and automatic order. Settings synchronize.
- Each material may have an individual comment in the context of that collection. Such comments are separate from general collection notes and support editing, deletion, search, dates and revision history.
- A collection may have its own description, separate from its cover, notes and material comments. Description supports editing, deletion, search, revision history and dates.
- A collection may have an optional cover selected from available files or uploaded, previewed, replaced or removed. The original image is not modified.
- Collections have their own tags and color labels, independent of tags on materials. Tags can be shared across collections, edited, deleted and filtered in combination; bulk assignment/removal is supported.
- Collections support unlimited nesting and restructuring. A child collection may belong to multiple parent collections without duplication. It remains one shared object; removing one parent relationship does not delete it. Cycles are prohibited.
- Deleting a parent collection preserves child collections and their materials and offers a new location. Collections may also exist outside the hierarchy.
- Collections have a separate favorites list, independent of hierarchy and material favorites.
- Multiple private notes may be attached directly to a collection. They are separate from its description and comments on individual materials. Notes support creation, editing, deletion, search, date/time, revision history, comparison and restoration.
- Export/import supports all or selected collections and their nested structure, preserving links without duplication, covers, descriptions, materials, order, comments, tags, colors, favorites, notes and note history. Export allows selection of data. Import supports preview, selective restoration, integrity/compatibility checks and duplicate handling: skip, replace or copy.
- The common CHAT CORE export/import infrastructure and operation log are used, with a separate “Personal thematic collections” category.
- Deleted collections enter a separate trash. Their hierarchy, materials, order, comments, descriptions, covers, tags, colors, favorites, notes and histories are preserved. Individual and bulk restoration are supported. Permanent deletion requires confirmation. Automatic cleanup occurs 30 days after deletion, with remaining time shown and earlier permanent deletion available.
- A separate archive supports individual/group archiving, search, restoration and bulk operations. Archiving does not trigger the trash retention period.
- The archive has independent nested folders. One archived collection may be referenced from multiple folders without copies; removing one folder reference does not delete the collection.
- The archive has its own favorites, tags and color labels, independent of active collections.
- Archived collections support bulk move, tag assignment/removal, favorite changes, restoration to the active structure and deletion to trash.
- Archive export/import uses the common CHAT CORE mechanism and preserves archive folders, hierarchy, links, favorites, tags, colors and collection data. The separate operation category is “Personal thematic collection archive”.
- Imported archives can be rechecked. Verification covers structure, collections, materials, files, comments, notes, relationships and metadata; results are compared with previous checks and retain history.
- Structural links and missing files are restored only after matching, preview and owner confirmation. Ambiguous cases require manual decision; no substitution is made without verified correspondence.
- The same four integrity statuses apply: **Check passed; Check passed with remarks; Recovery required; Recovery impossible.**

### 10.7. Search & Notifications — expanded search and subscription model

**Search**
- Search is available across all topics accessible to the participant and, separately, within the currently open topic.
- Search is distinct from topic and nickname navigation.
- Search supports message text, author nicknames and quoted fragments linked to the source message. Results distinguish a match in the author field from a match in message content.
- Search can include extracted text from documents when available; otherwise it searches the file name.
- Indexing and search respect access rights; rights are checked again when a result is opened.
- Opening a result highlights the matching phrase, scrolls to the message and briefly highlights it.
- Filters include author and time period: today, last 7 days, last 30 days or a custom range.
- Results can be sorted newest-to-oldest or oldest-to-newest.
- Search history is retained for 90 days and synchronized. Clearing it on one device synchronizes the deletion.
- A previous query can be repeated with its original filters and search mode; permissions are checked again.
- Favorite searches support custom names and folders, manual sorting and library search. Folder and query names are limited to 60 characters; these folders are not nested. Deleting a folder with confirmation moves its saved searches to the general list.
- Search export/import uses JSON and preserves folder structure, names, filters, modes and sorting. Import supports preview, selective import, renewed permission checks and duplicate handling: skip, replace or copy.
- The search-operation log records date/time, result and counts of added, replaced and skipped entries, but does not store the search query content. It is private to the owner, synchronized and retained for 90 days.

**Topic subscriptions and in-club notifications**
- Participants subscribe to topics manually. Creating a topic or publishing a message does not create an automatic subscription.
- Participants can manually subscribe or unsubscribe.
- A notification is created for each new message in a subscribed topic, except the participant's own messages.
- Reactions do not generate subscription notifications.
- An in-club notification appears next to the relevant message. A separate global unread-notification indicator is not required.
- The notification contains the author's nickname and a short message excerpt. Selecting it opens the topic and message and briefly highlights the message.
- Unopened notifications remain until opened. Each notification is removed 30 days after its creation.
- Opening a notification marks it as read. A “Mark all as read” action is not provided.
- Notifications show the date and exact time.
- A participant can pause a subscription for 1 hour, 8 hours, 24 hours, 7 days or until manually resumed. Its status and end time are visible. A subscription can be deleted while paused.
- Subscription and notification state synchronize between devices.

**Compatibility with the earlier push-notification rule**
- The previously approved push-notification privacy rule remains applicable to push delivery: a push contains only the author's nickname and topic title, not message text.
- The richer nickname-plus-excerpt notification described above is the in-club notification opened from within the chat. The two presentation channels must not be conflated.
- Search & Notifications defines the event, recipient and permitted content. Core Services provides shared delivery, bounded retries and duplicate prevention.
- Failure of push delivery does not remove the underlying message or unread state.

### 10.8. AI & Moderation — expanded common CHAT CORE requirements

The previously approved human-authority and case-scoped access rules in Section 3.9 remain in force. The following requirements expand the component's detection, participant-reporting, file-safety coordination and quality-control scope.

**AI authority**
- AI autonomously performs only explicitly pre-authorized, safe and bounded actions.
- AI may detect, analyze, explain, forecast and recommend.
- Decisions affecting participant access, sanctions or disputed cases remain with authorized people in OFFICE.
- Suspicion is not proof of a violation.
- AI recommendations identify their grounds and confidence. OFFICE may change a priority; the history is retained.
- Priorities are low, normal, high and critical. A priority is a handling level, not a finding of guilt.

**Detection and warnings**
- Detection covers mass spam/advertising, suspicious publication frequency, repeated patterns or possible coordinated accounts, manipulation of reactions or subscriptions, serial account creation, circumvention of restrictions and unwanted mass private messages where that feature exists.
- AI may identify phishing, fraud and attempts to obtain money, passwords, verification codes or personal data.
- Where technically possible, a warning is shown before a participant follows a dangerous link.
- Such warnings are preliminary. Participants can indicate that a warning was useful or mistaken; OFFICE reviews relevant cases.

**Participant reports**
- A participant can report a suspicious message, link or behavior.
- A report may contain an explanation, link to the message or profile, screenshots and files.
- A report submitted from chat retains a link to the original content.
- Submitted files undergo the applicable security checks.
- Report statuses are: **Accepted; Under review; Additional information required; Reviewed.**
- The participant receives status updates and can see the report history.
- After review, the participant receives a short outcome and explanation. Confidential information, internal investigation material and OFFICE service information are not disclosed.
- Detailed appeal and general administrative procedures are not specified here; they belong to the separate **“USER AGREEMENT — GENERAL RULES AND PROCEDURES”** block.

**Suspicious files and quarantine**
- File safety checking is a shared Club mechanism, not a duplicate local CHAT CORE antivirus implementation.
- Suspicious files are isolated in quarantine; the original is retained in isolated storage with reasons, dates and results.
- File-check states include: **Check completed — safe; Check not completed; Awaiting recheck.**
- After a protection service is restored, a new check may be scheduled automatically.
- Retry intervals and attempt limits are controlled; OFFICE receives a queue item with the reason, time, last attempt and state of the protection service.
- Technical failures and retries are diagnosable and recorded in the relevant technical event log.
- Quarantine, antivirus infrastructure and common file-protection procedures are specified in the shared Launch Complex architecture.

**OFFICE review and escalation**
- AI detection/referral is an internal workflow event; a participant is not notified merely because AI flagged a message or referred a case.
- Critical notices are subject to deadline control and escalation through the OFFICE governance architecture.
- A missed deadline at the highest authority level results in the status **“Requires decision of the highest governing body”**. Such a notice cannot be closed without a recorded decision of that body and a reasoned justification.
- Original case records remain immutable. Corrections are separate entries with author, time and reason.
- Access is limited to authorized personnel with a need to review the assigned matter. Access attempts, including unsuccessful attempts, are logged; repeated failures may trigger an OFFICE security notification. Exact thresholds belong to the common OFFICE security design.
- Detailed review deadlines, assignment and escalation workflow are governed by OFFICE architecture, not duplicated as local chat policy.

**AI quality and learning**
- Quality control includes false positives, false negatives and model improvement.
- Retrospective AI access to closed case records remains explicitly authorized, purpose-bound, time-bounded and case-scoped as specified in Section 3.9.
- AI may recommend workflow or safeguard improvements, but recommendations are advisory. Human approval is required for changes to rules, permissions, procedures, policy or AI authority.
- Approved improvements and implementation outcomes are tracked through OFFICE and contribute to shared Club operating experience, without exposing underlying case records beyond authorized access.

**Architectural separation**
- CHAT CORE AI & Moderation is not the Club-wide “Клуб — ИИ” architecture.
- The Club-wide relationship between AI and GY-GY Club remains a separate architecture topic.
- Translation support must not replace original message text; the original remains available alongside any translation.
- General multilingual infrastructure belongs to **GY-GY MULTILINGUAL INTELLIGENCE CORE**, not a duplicated local CHAT CORE translation engine.

### 10.9. Common mechanisms and matters deliberately outside CHAT CORE

The following mechanisms are centralized and must not be independently reimplemented by each component:
- synchronization and conflict handling;
- export/import, preview, integrity/compatibility checking and duplicate handling;
- shared operation logging with component-specific categories;
- shared scheduling and recurring-operation mechanisms;
- file storage, upload, integrity, antivirus and quarantine infrastructure;
- notification delivery, retry and duplicate prevention;
- access control, audit and technical diagnostics.

The following matters are deliberately transferred to broader architecture or governance documents:
- shared GY-GY Club storage, Supabase Storage deployment details, storage-area separation, backup strategy, disaster recovery, and operational thresholds;
- shared file security, antivirus, quarantine and protection-service architecture;
- shared preview/thumbnail infrastructure;
- GY-GY MULTILINGUAL INTELLIGENCE CORE;
- Club-wide “Клуб — ИИ” architecture and AI/Club coexistence;
- OFFICE structure, authority, deadlines, escalation and staff workflows;
- general participant appeals and administrative procedures, which belong to **“USER AGREEMENT — GENERAL RULES AND PROCEDURES”**;
- integration of De-Stress Studio, Atelier «Horse in a Coat» and Lunar Base and the associated OFFICE collaboration architecture.

These transfers do not mean that the requirements are abandoned. They mean that their common implementation or governance must be designed once in the appropriate wider document and referenced by CHAT CORE.

### 10.10. Updated maturity and superseded open items

The following items that appeared as open in version 0.1.47 have since received approved decisions and must no longer be treated as wholly unresolved:
- participant editing of their own messages and message revision history;
- participant deletion, trash and personal archiving of sent messages;
- detailed chain, branch, quotation and favorite-chain behavior;
- reaction interaction rules;
- personal collection, reminders, thematic collections, their archives and recovery mechanisms;
- all-topic and current-topic search modes, search history and saved searches;
- manual topic subscriptions and in-club notification behavior;
- participant reporting and its status/outcome communication;
- the expanded AI detection, review-support and quality-control boundaries.

The following remain open or deferred because they belong to broader architecture or require a separate decision:
- topic deletion policy;
- implementation-level interfaces and data models between components;
- exact supported media formats, size limits and technical storage layout;
- which video-upload recovery guarantees can be provided in the first deployment;
- exact implementation thresholds, retry intervals and resource quotas;
- detailed OFFICE workflow, staff authority and deadline values;
- general participant appeals and administrative procedures under the User Agreement;
- shared file storage, antivirus, quarantine, backup and disaster recovery architecture;
- detailed acceptance tests and measurable thresholds;
- the persistence boundary for a collapsed unfinished interface operation versus explicit-command-only ordinary message drafts. The specific autosaving rules approved for message-editing temporary states and attachment-group drafts do not resolve this separate cross-component question.

The earlier maturity statements and open-item list in this document must be read subject to these updates. No item is considered approved beyond the exact scope stated above.

**Version 0.1.48 update:** Incorporates the subsequent approved CHAT CORE decisions through 2026-11-22, preserves the original ten-component architecture and Launch Complex 1 staging, updates previously open component details, and transfers common or governance-level matters to their appropriate wider architecture documents.
