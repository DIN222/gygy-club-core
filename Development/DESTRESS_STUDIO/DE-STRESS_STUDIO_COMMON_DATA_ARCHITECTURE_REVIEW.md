# DE-STRESS STUDIO — COMMON DATA ARCHITECTURE COMPLIANCE & INTEGRATION REVIEW

**Document:** `DE-STRESS_STUDIO_COMMON_DATA_ARCHITECTURE_REVIEW.md`  
**Version:** Draft 0.1  
**Status:** Architectural draft — for review  
**Scope:** De-Stress Studio and its integration into GY-GY Club  
**Related document:** `GY-GY_CLUB_COMMON_DATA_ARCHITECTURE.md`  
**Functional baseline:** `DE-STRESS_STUDIO_ARCHITECTURE.md`

---

# 1. PURPOSE & SCOPE

## 1.1. Document purpose

This document defines how the De-Stress Studio architecture aligns with the GY-GY Club Common Data Architecture and establishes requirements for integrating the Studio with shared Club mechanisms.

The objective is to ensure that De-Stress Studio operates as an independent functional venue while remaining part of the unified GY-GY Club digital ecosystem.

## 1.2. Primary objective

De-Stress Studio must use shared Club mechanisms wherever they are provided for by the Common Data Architecture, without creating parallel local systems for the same responsibilities.

At the same time, the Studio retains its own functional logic, internal scenarios, attractions, and specialized user tools.

## 1.3. Review boundaries

This review covers:

- member identification and references to shared Club profiles;
- projects, content, and digital assets;
- images, audio, and other media;
- content history, versions, and provenance;
- rights, permissions, and access;
- Archive and Bookmarks;
- events and notifications;
- integration with CHAT CORE;
- preservation of user state;
- interaction with other Club functional systems.

## 1.4. What this document does not replace

This document does not replace:

- the De-Stress Studio architecture;
- the GY-GY CLUB — COMMON DATA ARCHITECTURE;
- the GY-GY CHAT CORE architecture;
- the PRINT CORE architecture;
- the Club-wide interface and navigation architecture;
- separate rules governing rights and content use.

It establishes the relationships between these documents within the scope of De-Stress Studio.

## 1.5. Authority boundary

This document defines architectural requirements and integration directions.

By itself, it does not authorize changes to the database, SQL, RLS, Storage, application code, triggers, functions, or live production processes.

---

# 2. ARCHITECTURAL BASELINE

## 2.1. Position of De-Stress Studio within GY-GY Club

De-Stress Studio is an independent thematic venue within GY-GY Club.

It has its own structure, user scenarios, visual identity, and set of functional tools.

Its independence does not mean technical or informational isolation from the Club.

## 2.2. Studio structure

De-Stress Studio is built around four equal venues:

1. **ABSURDITY LAB** — creative tools for working with words, random combinations, and playful scenarios.
2. **HEAVY CASE** — a space for working with unpleasant events and emotional tension.
3. **THE PRINT PARLOUR** — a gallery of Club prints, designs, and creative works.
4. **THE CHAT ROOM** — a thematic space for member communication and discussion.

These venues are independent functional areas within the Studio.

The architecture must allow additional venues to be introduced without requiring the entire navigation system to be rewritten.

## 2.3. Shared interface and navigation

De-Stress Studio follows the shared GY-GY Club interface and navigation principles.

Its main elements include:

- unified GY-GY Club visual identity;
- Charlie and the De-Stress Studio title;
- shared member identification and Passport;
- standard navigation transitions;
- a common visual transition mechanism;
- preservation of state when moving between venues.

A single arrow means going back one step.

A double arrow means returning to the Studio entrance.

## 2.4. Preservation of functional independence

The Common Data Architecture must not turn all four venues into one universal functional system.

Each venue retains its own data, scenarios, and internal states within its area of responsibility.

Shared mechanisms provide identity, references, assets, rights, history, and relationships, but do not replace the specialized logic of the attractions.

---

# 3. COMMON DATA ARCHITECTURE ALIGNMENT

## 3.1. General principle

De-Stress Studio must align with the principles of the GY-GY CLUB — COMMON DATA ARCHITECTURE.

This means using shared identifiers, references, digital asset management mechanisms, history, rights, and user-data mechanisms wherever applicable.

## 3.2. Member identity

The Studio must not create an independent member identification system.

Identification must rely on the shared GY-GY IDENTITY mechanisms and their associated references to the Passport.

Internal Studio records should use stable member references rather than relying solely on display names.

## 3.3. Content and creative objects

The architecture must distinguish between:

- a project;
- an independent content object;
- a digital asset;
- a version of a content object.

For example, a print-creation project, the design itself, an uploaded image, and a saved design version must not automatically be treated as one and the same object.

Specific data models are defined by the relevant functional architectures.

## 3.4. Digital assets

The Studio must follow the Club-wide principles for digital asset management.

The same digital asset may be used in different functional areas, subject to rights, permissions, and access rules.

Independent image and audio catalogues should not be created for each attraction when an asset belongs to the shared Club collection.

## 3.5. History and content provenance

For creative works, the system must preserve the ability to identify:

- the original author;
- the source of the material;
- the fact of upload;
- subsequent modifications;
- the relationship between derivative materials and the original;
- available versions.

Change history does not replace authorship and usage-rights rules.

## 3.6. Ownership and responsibility

De-Stress Studio is responsible for its own functional data.

Shared mechanisms are responsible for common identifiers, references, and infrastructure rules within their respective areas of responsibility.

The existence of shared infrastructure does not transfer responsibility for Studio functional processes to that infrastructure.

---

# 4. SHARED SERVICES & INTEGRATION

## 4.1. GY-GY CLUB INTERFACE

The Studio uses the shared Club interface principles and visual identity.

Local interface elements are permitted provided they do not violate common navigation, identity, and interaction rules.

## 4.2. GY-GY IDENTITY INTERFACE and Passport

The Studio must use the shared Club member identification mechanism.

Local Passport visual elements must not become a separate account system.

## 4.3. GY-GY PRESENCE SERVICE

If the Studio displays member presence or related statuses, it must use the shared presence mechanism.

Local presence displays must not create an independent source of truth about a member's status.

## 4.4. GY-GY MULTILINGUAL INTELLIGENCE CORE

The Studio's multilingual support must be provided through the shared Club language mechanism.

Interface text, content, and dynamic elements must follow common localization rules.

The Studio must not create a separate, incompatible language-switching system.

## 4.5. GY-GY SOUND SYSTEM

The Studio's soundscape must use the shared Club sound system.

This includes common principles for cataloguing, connecting, configuring, replacing, and playing sound assets.

## 4.6. Shared image and visual asset system

Images, backgrounds, illustrations, and other visual assets used by the Studio must be compatible with the shared Club image-management system.

Local presentation methods are permitted, but must not create separate, incompatible storage and cataloguing infrastructure.

## 4.7. Shared navigation and transitions

The Studio uses the common GY-GY Club navigation principles.

Transitions between venues must not result in the loss of user progress.

## 4.8. Shared notifications and events

If the Studio generates notifications or events related to members, publications, discussions, or interactions, they must be compatible with the shared events and notifications architecture.

The functional records of the Studio remain the responsibility of the relevant system.

---

# 5. STUDIO-OWNED DATA & FUNCTIONAL LOGIC

## 5.1. Functional responsibility principle

De-Stress Studio retains responsibility for data and processes that belong directly to its attractions.

The Common Data Architecture must not become a universal system that absorbs all functional records of the Club.

## 5.2. ABSURDITY LAB

The Studio is responsible for:

- internal word-based tools;
- random combinations and game modes;
- user-session parameters;
- the state of individual tools;
- results of creative actions, where they are saved.

The random phrase roulette is a tool within the overall creative environment, not a separate venue.

## 5.3. HEAVY CASE

The Studio is responsible for:

- interaction scenarios;
- the internal state of the workspace;
- material entered by the user;
- selected modes and parameters;
- results of the attraction, where they are saved.

AI integration does not grant AI the authority to independently modify user data or manage the Club.

## 5.4. THE PRINT PARLOUR

THE PRINT PARLOUR is a gallery and showcase of published prints, designs, and creative works.

It must use shared mechanisms for publication, digital assets, rights, and collections.

THE PRINT PARLOUR is not an independent print-creation editor.

Manual creation and editing functions belong to the separate PRINT CORE architecture.

## 5.5. THE CHAT ROOM

THE CHAT ROOM is the thematic communication venue of De-Stress Studio.

It uses the universal GY-GY CHAT CORE.

The Studio is responsible for the thematic organization of its venue and its user scenarios, while CHAT CORE is responsible for shared communication functionality, messages, replies, and related management mechanisms.

## 5.6. Attraction-specific states

Each attraction may have its own state.

This state must not be conflated with the member's general state, identity, or Club-wide history.

Shared mechanisms provide the necessary references and preservation capabilities, while the functional system defines the meaning and content of its own state.

---

# 6. DATA PRESERVATION & USER CONTINUITY

## 6.1. Core principle

Users must not lose their work when moving between the Studio entrance and its attractions.

State preservation is a mandatory architectural requirement.

## 6.2. Preservation of Studio state

The following must be preserved during navigation:

- the position and state of the main page;
- the state of each attraction;
- text entered by the user;
- selected modes and parameters;
- results of unfinished actions;
- scroll position;
- the active internal screen;
- the state of individual tools.

## 6.3. Venue-specific requirements

For ABSURDITY LAB, the state of individual windows and tools must be preserved.

For HEAVY CASE, entered material, selected modes, and workspace state must be preserved.

For THE PRINT PARLOUR, the browsing state and selected gallery elements must be preserved where required by the user scenario.

For THE CHAT ROOM, the active topic, viewing position, and unfinished message draft must be preserved where supported by CHAT CORE.

## 6.4. Transitions without loss of progress

Removing and recreating an interface element must not automatically mean deleting the user's state.

In particular, temporarily closing and reopening the chat interface must not cause the loss of the user's unfinished work.

## 6.5. Separation of state and history

The current interface state, a saved work result, and a historical content version are different concepts.

They must not be merged into one mechanism without a clear definition of responsibility and lifecycle.

## 6.6. Preservation verification

The implementation must be tested through real user scenarios.

The presence of relevant variables or functions in the code does not, by itself, confirm that the requirement has been met.

---

# 7. ASSETS, MEDIA & CONTENT MANAGEMENT

## 7.1. Shared asset catalogue

The Studio must use the Club-wide principles for cataloguing and managing images, audio, and other digital assets.

## 7.2. Asset reuse

The same asset may be used in multiple Club locations where rights, permissions, and access rules allow it.

Duplicate copies should not be created solely to connect the same asset to different attractions.

## 7.3. Distinction between an asset and a content object

An image file is not identical to the creative work it represents.

For example, a published print may reference several files and have its own version history.

## 7.4. Replacement and update management

Replacing an image, sound file, or other asset must not silently break historical relationships or published materials.

Versions, references, and dependencies must be taken into account.

## 7.5. Optimization

Asset integration must account for performance, file sizes, formats, responsive presentation, and loading behavior.

Specific technical solutions are defined by the Club-wide media-management specifications.

---

# 8. IDENTITY, RIGHTS & ACCESS

## 8.1. Shared identity

The Studio uses shared Club identifiers and authentication mechanisms.

A separate, independent local member-registration system must not be created.

## 8.2. Distinction between roles

The architecture must distinguish between:

- the owner of an object;
- the author or creator;
- the person who uploaded the material;
- the publisher;
- the rights holder;
- the person or system responsible for safeguarding the asset.

These roles may belong to the same person, but this must not be assumed automatically.

## 8.3. Rights to creative works

Publishing a work in THE PRINT PARLOUR does not automatically transfer rights to GY-GY Club.

Storing material in Club infrastructure does not, by itself, grant the Club permission to use it.

## 8.4. Access and privacy

Personal materials, drafts, archive records, and messages must be handled in accordance with shared access and privacy rules.

The ability to see that an activity exists does not automatically grant the right to access its contents.

## 8.5. Authorization

Authentication confirms that a member has signed in to the system.

It does not automatically determine the member's role or permission to perform a specific operation.

Access checks must comply with the shared Club authorization model.

---

# 9. CHAT CORE & PERSONAL SPACE INTEGRATION

## 9.1. THE CHAT ROOM and GY-GY CHAT CORE

THE CHAT ROOM uses the universal GY-GY CHAT CORE.

An independent chat that duplicates the main CHAT CORE mechanisms must not be created.

## 9.2. Thematic independence

Using the shared CHAT CORE does not deprive THE CHAT ROOM of its own thematic identity.

The Studio retains the ability to define the organization of its venue, discussion topics, and related user scenarios.

## 9.3. Chat state preservation

Moving between venues and reopening THE CHAT ROOM must not result in the loss of the user's state.

The following must be checked for preservation:

- the selected topic;
- the viewing position;
- an unfinished draft;
- other states provided by CHAT CORE.

## 9.4. MY ARCHIVE

MY ARCHIVE is a shared Club user tool.

It is intended for storing a member's own works and materials.

De-Stress Studio materials may be added to the archive in accordance with common rules and supported object types.

A local archive implementation within the Studio must not become a separate, independent source of data.

## 9.5. BOOKMARKS

BOOKMARKS is a separate shared Club user tool.

It allows members to save links to their own and other people's materials for later access.

Bookmarks must not be conflated with the Archive: they serve different user needs.

## 9.6. Integration verification

It must be checked whether the current Studio implementations use shared services or still operate as local prototypes.

A local prototype must not be presented to users as full Club-wide synchronization.

---

# 10. IMPLEMENTATION GAPS & RISKS

## 10.1. General verification principle

An architectural requirement and its technical implementation must be evaluated separately.

The presence of a requirement in a document does not confirm that it has been implemented in the application.

## 10.2. State preservation

The actual behavior of transitions between the Studio and its attractions must be checked.

Particular attention must be paid to mechanisms that close and recreate interface elements.

## 10.3. Personal Space

The known local implementation of Archive and Bookmarks must be checked to determine whether it has been migrated to shared Club mechanisms.

Until integration is confirmed, it should be treated as a prototype rather than a completed shared Club implementation.

## 10.4. CHAT CORE

The actual connection of THE CHAT ROOM to the universal CHAT CORE must be verified.

A demonstration or local chat page must not be treated as a completed integration.

## 10.5. Media management

It must be checked whether the Studio and its attractions use shared mechanisms for cataloguing, storing, and connecting images and audio.

## 10.6. Identity and rights

The use of shared Club identifiers must be verified, as must the absence of local assumptions about ownership, authorship, and permissions.

## 10.7. Duplication risk

The principal architectural risk is the emergence of independent local mechanisms for responsibilities already covered by the GY-GY Club Common Data Architecture.

Such mechanisms may temporarily exist in prototypes, but their temporary status and integration plan must be explicitly documented.

---

# 11. INTEGRATION REQUIREMENTS

## 11.1. General requirements

De-Stress Studio integration must be carried out in stages.

Each integration must have clearly defined responsibility, an understandable interaction interface, and verifiable readiness criteria.

## 11.2. Mandatory integration areas

Integration must be provided for:

1. GY-GY CLUB INTERFACE;
2. GY-GY IDENTITY INTERFACE and Passport;
3. GY-GY PRESENCE SERVICE;
4. GY-GY MULTILINGUAL INTELLIGENCE CORE;
5. GY-GY SOUND SYSTEM;
6. the shared image and digital asset management system;
7. shared navigation and state-preservation mechanisms;
8. the shared events and notifications system;
9. GY-GY CHAT CORE;
10. shared Club Personal Space — MY ARCHIVE and BOOKMARKS;
11. rights, permissions, and access-management mechanisms;
12. PRINT CORE, within the scope of the necessary relationships between creative works and published materials.

## 11.3. When a shared service is not ready

If a shared Club service has not yet been implemented or does not have a ready integration interface, the Studio must not create a local imitation and present it as the final solution.

A temporary prototype is permitted provided that:

- its temporary status is clearly identified;
- its responsibility is limited;
- it does not create a false impression of Club-wide synchronization;
- a path to subsequent integration is defined.

## 11.4. Integration contracts

For each shared mechanism, the following must be defined:

- purpose;
- owner and responsible system;
- input and output data;
- identifiers used;
- access rules;
- error behavior;
- state-preservation requirements;
- verification criteria.

Specific technical contracts are to be defined during integration design.

## 11.5. Human oversight

AI may help analyze, explain, recommend, and process information.

AI must not independently perform critical changes to user data, access rights, publications, or administrative operations without the required authorization and human confirmation.

---

# 12. REVIEW STATUS & NEXT STEPS

## 12.1. Assessment statuses

One of the following statuses is assigned to each requirement:

- **CONFIRMED** — alignment is confirmed by a document or implementation review.
- **REQUIRED** — the requirement must be met, but its implementation has not yet been confirmed.
- **NOT YET VERIFIED** — available information is insufficient to confirm it.
- **OUT OF SCOPE** — the matter belongs to another architecture or system.

## 12.2. Preliminary status of the main areas

| Area | Preliminary status |
|---|---|
| Four Studio venues | CONFIRMED — at the level of the approved Studio architecture |
| Functional independence of attractions | CONFIRMED — at the level of the architectural principle |
| Shared identity and Passport | REQUIRED |
| Shared multilingual support | REQUIRED |
| Shared sound and image systems | REQUIRED |
| State preservation during navigation | REQUIRED — implementation must be verified |
| Archive and Bookmarks integration | NOT YET VERIFIED |
| THE CHAT ROOM connection to CHAT CORE | NOT YET VERIFIED |
| Shared rights and permissions | REQUIRED |
| Full PRINT CORE integration | OUT OF SCOPE for implementation of PRINT CORE itself; relationships to Studio publications must be defined |

These statuses refer to the available architectural information and do not replace technical verification of the current code.

## 12.3. Recommended sequence of further work

**Stage 1 — Architectural cross-check**

Compare this document with the complete GY-GY CLUB — COMMON DATA ARCHITECTURE and resolve any differences in terminology, references, and responsibility boundaries.

**Stage 2 — Existing implementation review**

Review the current Studio files, modules, navigation, state handling, Archive, Bookmarks, and chat.

**Stage 3 — Integration dependency map**

Determine which shared services already exist, which have ready interfaces, and which are still at the architectural design stage.

**Stage 4 — Integration plan**

Prepare a phased plan for connecting the Studio to shared Club infrastructure without losing existing functionality.

**Stage 5 — Implementation and testing**

Make changes incrementally, verifying real user scenarios and data preservation.

## 12.4. Readiness criteria

De-Stress Studio may be considered architecturally prepared for integration when:

- the responsibility boundaries between the Studio and shared services are defined;
- shared identifiers and references are agreed;
- storage and access mechanisms are defined;
- preservation of user state is ensured;
- CHAT CORE and Personal Space have defined integration interfaces;
- digital asset management is aligned with the Common Data Architecture;
- temporary prototypes are identified and have replacement plans;
- critical integration risks are documented.

Operational readiness can only be confirmed after technical implementation and testing.

## 12.5. Document status

This document is an architectural supplement to the De-Stress Studio architecture.

It does not modify or supersede the existing Studio architecture.

It does not authorize technical implementation or changes to existing systems.

Once approved, this document should be cross-referenced by the main De-Stress Studio architecture and the GY-GY Club Common Data Architecture.

---

**END OF DOCUMENT**
