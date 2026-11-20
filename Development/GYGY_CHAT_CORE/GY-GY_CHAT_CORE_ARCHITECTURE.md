# GY-GY CHAT CORE
## Unified Technical Architecture
**Document:** GY-GY_CHAT_CORE_ARCHITECTURE.md  
**Version:** 0.1.43  
**Status:** Consolidated architecture baseline — cross-component consistency review in progress  
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
- OFFICE collaboration architecture: the structure and relationship of OFFICE CHAT, live meetings and other organized working sessions, including whether chat spaces are shared or divided by departments and functions. This question is deliberately deferred until all three Launch Complex 1 locations — De-Stress Studio, Atelier «Horse in a Coat» and Lunar Base — are ready for integration; it will then be revisited as part of the broader discussion of their объединение and the corresponding OFFICE arrangements.

These open items should be resolved in the relevant component or Launch Complex design stage, then reflected in a revised version of this document.

## 9. Document status

This file consolidates the architecture currently recoverable from the approved discussions and the existing De-Stress Studio readiness record. Components 1–5 and Core Services have a number of explicit operational requirements recorded above. For components 6–9, only the scope and decisions explicitly available in the source record are stated; missing detail is deliberately marked open rather than fabricated.

**Status:** Consolidated architecture baseline — cross-component consistency review in progress.  
**Latest update:** Version 0.1.45 records AI's ability to proactively identify recurring problems and systemic patterns in OFFICE operations within its already authorized information scope, and report them to OFFICE for human consideration.  
**Next step:** Continue the integrated cross-check, resolve remaining open contracts and decisions where required, and only then consider approval for implementation planning.
