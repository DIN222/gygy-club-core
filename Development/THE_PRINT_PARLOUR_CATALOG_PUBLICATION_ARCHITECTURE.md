# THE PRINT PARLOUR — CATALOG & PUBLICATION ARCHITECTURE

**Version:** Draft 0.1  
**Status:** Architectural Draft — For Review  
**Project:** GY-GY Club

---

## 1. PURPOSE AND ARCHITECTURAL ROLE

### 1.1. Purpose of This Document

This document defines the architecture of THE PRINT PARLOUR — the exhibition space, gallery, and catalogue for creative works within GY-GY Club.

It establishes the principles for presenting PRINT objects, organizing the catalogue, accepting participant submissions, reviewing and publishing works, enabling visitor interaction with published works, and integrating the location with shared club systems.

### 1.2. Role of THE PRINT PARLOUR

THE PRINT PARLOUR is a public exhibition space within GY-GY Club, intended for:

- presenting participants' creative works;
- browsing and exploring published PRINT objects;
- organizing a gallery and catalogue;
- discovering works by category, topic, and other attributes;
- learning about authors and their creative work;
- submitting personal works for publication review;
- creating collections and thematic exhibitions;
- interacting with published works under the club's common rules.

THE PRINT PARLOUR is a showcase and exhibition space. It is not a universal graphics editor, production system, or owner of the PRINT objects themselves.

### 1.3. Position Within the Club Architecture

THE PRINT PARLOUR uses the shared PRINT architecture and related club-wide services.

The primary responsibility boundaries are:

- **PRINT CORE** — creation, editing, and management of the creative workflow;
- **THE PRINT PARLOUR** — cataloguing, presentation, browsing, submission, and publication of works;
- **GY-GY CLUB COMMON DATA ARCHITECTURE** — shared rules for data organization, identity, storage, history, provenance, and rights;
- **OFFICE** — administrative, operational, financial, and production processes;
- **ATELIER** — product configuration and preparation of works for potential physical production.

These systems interact through defined shared objects and interfaces, but do not replace one another's responsibilities.

---

## 2. CORE PRINCIPLES

THE PRINT PARLOUR is based on the following principles:

1. **One PRINT object.** A work retains its identity regardless of where it is created, published, or used.
2. **Authorship and provenance.** The author, co-authors, source, and history of a work must be preserved.
3. **Versioning.** A new revision must not destroy previous versions.
4. **Voluntary publication.** Creating a work does not automatically place it in the public gallery.
5. **Review before publication.** Public listing follows an established review process.
6. **Separate rights.** Permission to publish does not imply permission for commercial use.
7. **Shared club-wide mechanisms.** The location must not create duplicate local systems for identity, bookmarks, storage, notifications, or rights management.
8. **Human governance.** Decisions about publication, unpublishing, and changes to official status remain under authorized human control and are not delegated to autonomous AI.
9. **Extensibility.** The catalogue must support growth in the number of authors, works, topics, and exhibition formats.

---

## 3. GALLERY AND CATALOGUE STRUCTURE

### 3.1. Overall Structure

THE PRINT PARLOUR is an organized exhibition space where visitors can:

- browse the main gallery;
- navigate thematic sections;
- open individual works;
- discover authors;
- find works using selected criteria;
- explore thematic collections and curated selections.

The catalogue must support both casual browsing and targeted discovery.

### 3.2. Main Gallery

The main gallery is the primary entry point for discovering published works.

It may include:

- recent publications;
- featured works;
- thematic selections;
- participant works;
- special exhibitions;
- editorial and curated selections.

The order in which works are presented may vary according to the selected browsing mode.

### 3.3. Thematic Sections

The catalogue must support the organization of works by topic and creative direction.

The final set of categories is not fixed by this document. It may evolve as the club develops.

Categories must not become rigid constraints on creative works. A single PRINT may belong to multiple topics.

### 3.4. Collections and Exhibitions

The following concepts must be distinguished:

- **Categories** — persistent classification attributes;
- **Tags** — additional descriptive and discovery attributes;
- **Collections** — thematic groups of works;
- **Exhibitions** — specially curated presentations of works united by an idea, topic, or curatorial concept.

A collection or exhibition does not create new PRINT objects and does not change the authorship of the works it contains.

---

## 4. PRINT CARD AND WORK DETAIL PAGE

### 4.1. Catalogue Card

Each published work is represented in the catalogue by a card.

The card should allow visitors to quickly understand:

- what the work is;
- its title;
- who created it;
- which topic or category it belongs to;
- whether a detailed view is available.

Depending on the catalogue format, a card may contain an image, title, author name, short description, and other approved attributes.

### 4.2. Individual Work Page

Opening a card takes the visitor to the PRINT detail page.

It may include:

- the primary image of the work;
- title;
- description;
- author and co-author information;
- creation and publication dates, where available;
- version information;
- category and tags;
- publication history, to the extent available for viewing;
- permitted interaction options;
- links to related collections and other works by the author.

The information displayed depends on access rights and privacy settings.

### 4.3. Separation of Object and Presentation

The catalogue card and detail page are representations of a PRINT object.

They do not create an independent copy of the work and must not become a separate source of truth for its authorship, version, or rights.

---

## 5. CATEGORIES, TAGS, AND SEARCH

### 5.1. Categories

Categories are used to organize the catalogue.

The category system must allow expansion and revision without changing the identity of the PRINT objects themselves.

### 5.2. Tags

Tags provide more flexible classification.

They may describe:

- topic;
- style;
- visual character;
- mood;
- technique or creation method;
- other attributes useful for discovery.

### 5.3. Search

The catalogue must provide search across available metadata, including:

- work title;
- author name;
- categories;
- tags;
- thematic collections;
- other supported attributes.

Search must respect access rights. Private, unpublished, or otherwise restricted materials must not become publicly discoverable through search results.

### 5.4. Filtering and Sorting

Visitors should have practical ways to filter and sort the catalogue.

Possible modes include:

- recent publications;
- recently updated works;
- thematic browsing;
- browsing by author;
- browsing by collection.

The exact set of modes will be determined during interface design.

---

## 6. AUTHORS AND THEIR WORKS

### 6.1. Author Presentation

THE PRINT PARLOUR may provide a dedicated view of a participant's creative activity.

It should allow visitors to explore the author's published works and open individual PRINT objects.

### 6.2. Authorship

Authorship is determined by the shared PRINT object data, not by local gallery records.

THE PRINT PARLOUR is not authorized to independently change the author, co-authors, or provenance of a work.

### 6.3. Privacy

Public presentation of an author depends on the participant's privacy settings and the club-wide access rules.

Not all profile information should automatically become part of the public author page.

---

## 7. SUBMITTING WORKS FOR PUBLICATION

### 7.1. Right to Submit

A GY-GY Club participant must be able to propose their own work for publication in THE PRINT PARLOUR.

Creating a PRINT and submitting it for publication remain two separate actions.

### 7.2. Source of the Work

A work may be created in PRINT CORE using:

- AI tools;
- manual graphic editing;
- a combination of manual work and AI;
- other permitted creative methods.

The use of AI is not a mandatory condition for creating or publishing a PRINT.

### 7.3. Submission Handoff

When a work is submitted, the review process must receive:

- the PRINT identifier;
- the version selected for review;
- the required digital assets;
- authorship and provenance information;
- description and metadata;
- confirmation of the required permissions;
- any additional information required by the submission rules.

The handoff must not create an independent copy of the PRINT that loses its connection to the original object.

### 7.4. Submission Confirmation

The participant must receive clear confirmation that the work has been submitted for review.

The participant must also be able to view the current review status, subject to the applicable rules.

---

## 8. REVIEW AND MODERATION

### 8.1. Purpose of Review

Review ensures that the public gallery complies with GY-GY Club rules and the established publication requirements.

### 8.2. Scope of Review

Review may cover:

- compliance with club rules;
- availability of required rights and permissions;
- correctness of authorship information;
- content suitability and permissibility;
- technical suitability of files;
- correctness of descriptions and metadata;
- potential conflicts or disputed circumstances.

### 8.3. Review Outcomes

Following review, a work may be:

- approved for publication;
- returned to the author for revision;
- rejected with a reason;
- temporarily placed on hold pending clarification.

The exact statuses and transitions must follow the common PRINT Object & Lifecycle Architecture.

### 8.4. AI Assistance

AI may assist with review by:

- identifying potential violations;
- analyzing content;
- detecting incomplete metadata;
- preparing recommendations;
- drafting explanations for moderators.

AI does not make the final publication decision and does not replace an authorized human reviewer.

### 8.5. Transparency

The author should receive clear information about the review outcome.

If a work is returned or rejected, the reason should be provided and, where possible, guidance on how to address the issue.

---

## 9. PUBLICATION AND UNPUBLISHING

### 9.1. Publication

Publication means listing a specific version of a PRINT in the public THE PRINT PARLOUR catalogue.

The published version is the one that has passed the established review process.

### 9.2. Updating a Published Work

Creating a new version does not automatically replace the published version.

A new version must undergo the required review if its publication requires renewed approval.

### 9.3. Unpublishing

A work may be removed from public display on established grounds, including:

- a decision by the author, within the rights granted to them;
- a violation of club rules;
- discovery of a rights-related issue;
- a decision by an authorized club representative;
- technical or legal reasons.

Unpublishing does not automatically mean that the PRINT object and its history are destroyed.

### 9.4. Republishing

Returning a work to the catalogue must take into account the reason for its previous removal and the current state of its rights, version, and review.

### 9.5. Publication History

The system must preserve the history of significant publication and unpublishing events in accordance with the shared retention and audit rules.

---

## 10. VIEWING AND INTERACTION

### 10.1. Viewing

THE PRINT PARLOUR provides public viewing of works permitted for publication.

Display must account for asset formats, responsive interfaces, and the club-wide rules for image management.

### 10.2. Interaction With Works

Published works may support:

- reactions;
- comments;
- discussions;
- navigation to the author;
- navigation to related collections;
- saving to bookmarks;
- other shared club interaction mechanisms.

### 10.3. Shared Services

THE PRINT PARLOUR must not create separate local systems for comments, notifications, reactions, or user identity.

Relevant shared club services must be used, primarily GY-GY CHAT CORE and other mechanisms defined by the common club architecture.

### 10.4. Separation of Functions

Viewing a work does not grant the right to modify, reuse, commercially exploit, or manufacture it.

All such actions are governed by separate rights and permissions.

---

## 11. BOOKMARKS, COLLECTIONS, AND PERSONAL SPACE

### 11.1. Bookmarks

Visitors must be able to save interesting works to the shared club-wide **Bookmarks** tool.

Bookmarks are a user-owned tool, not a feature or data asset owned by THE PRINT PARLOUR.

### 11.2. My Archive

**My Archive** is intended for storing a participant's own works and materials.

It must not be conflated with Bookmarks: a user's own works and saved references to other people's works are different categories of personal data.

### 11.3. User Collections

If the common club architecture supports user-created collections, THE PRINT PARLOUR may allow published works to be added to them.

A collection does not acquire ownership rights over a PRINT and does not change its authorship.

### 11.4. Availability Changes

If a work is unpublished, removed from the public catalogue, or becomes unavailable for another reason, a saved bookmark must not turn into a nonexistent copy.

The system must correctly display the changed availability status.

---

## 12. INTEGRATION WITH PRINT CORE, ATELIER, AND OFFICE

### 12.1. PRINT CORE

PRINT CORE is responsible for creating and editing works.

THE PRINT PARLOUR accesses existing PRINT objects and their versions through the shared architecture and does not create its own editor.

If a participant wants to modify a published work, they return to the relevant creation and editing environment.

### 12.2. ATELIER

Published works may be used in ATELIER to prepare product variants.

However, the presence of a work in the gallery does not automatically grant permission to manufacture or sell it.

ATELIER must verify the relevant rights and permissions.

### 12.3. OFFICE

OFFICE is responsible for operational processes related to the further use of works, including the relevant administrative, financial, production, and accounting operations.

THE PRINT PARLOUR does not become an order management, inventory, production, or accounting system.

### 12.4. Cross-System Traceability

Integration must preserve the relationships between:

- the original PRINT;
- the published version;
- a derivative variant prepared for a product;
- the corresponding product;
- operational and production records.

Each system remains responsible for its own data and processes.

---

## 13. RIGHTS AND PERMISSIONS

### 13.1. General Principle

Publication of a work in the gallery and the right to use that work in other ways are separate matters.

THE PRINT PARLOUR must respect the rights defined in the common PRINT Object & Lifecycle Architecture.

### 13.2. Separate Permissions

At a minimum, the following permissions must be distinguished:

- permission to store a work;
- permission to edit a work;
- permission to display it privately;
- permission to submit it for review;
- permission to publish it in the gallery;
- permission to include it in collections and exhibitions;
- permission to distribute or share it;
- permission to use it as part of a product;
- permission to manufacture and sell products using it.

### 13.3. Commercial Use

Permission to publish in THE PRINT PARLOUR does not, by itself, grant permission for commercial use.

Any use of a work in ATELIER, manufacturing, sales, or other commercial processes must be based on separate permissions.

### 13.4. Changes to Rights

THE PRINT PARLOUR is not authorized to independently grant, expand, or revoke an author's rights.

It uses the shared club-wide rights management system and displays only the information intended for the relevant access level.

---

## 14. LOCATION GOVERNANCE

### 14.1. Human Control

Publication, moderation, and gallery content management must remain under the control of authorized club representatives.

### 14.2. Role of AI

AI may be used to:

- assist with classification;
- prepare descriptions and tags;
- find similar works;
- identify potential issues;
- recommend thematic selections;
- analyze catalogue activity.

AI must not autonomously:

- publish works without the required approval;
- change authorship;
- change rights;
- delete works or their history;
- make final decisions in disputed publication cases;
- alter official club records.

### 14.3. Administrative Functions

The location must provide managed tools for:

- viewing the incoming submission queue;
- reviewing submissions;
- managing publications;
- creating collections and exhibitions;
- managing categories and tags;
- handling reports and disputed cases;
- viewing the history of significant actions.

The specific implementation of the administrative interface is determined by OFFICE architecture and the club's shared administrative mechanisms.

---

## 15. SECURITY AND ACCESS

THE PRINT PARLOUR must use the club-wide mechanisms for identity, authentication, authorization, and access control.

The architecture must account for:

- public and private data;
- author rights;
- moderator and administrator permissions;
- access to works under review;
- protection of original files and derivative assets;
- download and reuse restrictions, where required by rights;
- preservation of the history of significant actions.

Public display of a work must not automatically expose all source files, internal metadata, or operational information.

---

## 16. EXTENSIBILITY

THE PRINT PARLOUR architecture must support future development without rebuilding the basic PRINT object model.

Potential areas of development include:

- thematic exhibitions;
- seasonal and special collections;
- author galleries;
- collaborative projects;
- curated selections;
- competitions and festival formats;
- integration with other GY-GY Club locations;
- additional ways to present works.

New features must use existing shared club mechanisms wherever those mechanisms are already defined by the club architecture.

---

## 17. IMPLEMENTATION PRINCIPLES

This document defines the logical architecture of the location.

It is not, by itself, a direct technical specification for creating a particular database, API, file storage system, or interface component.

Implementation should proceed in stages:

1. Approve the architectural boundaries and rules.
2. Define integration with PRINT CORE and the common PRINT architecture.
3. Design the catalogue and work cards.
4. Design submission and publication review workflows.
5. Connect shared club services.
6. Design administrative tools.
7. Implement and test user scenarios.
8. Add further capabilities as they become ready.

Parallel local mechanisms that conflict with approved club-wide decisions must not be introduced.

---

## 18. OPEN QUESTIONS

The following questions require separate decisions before their respective technical implementation:

1. The final structure of categories and thematic directions.
2. Rules for composing the main gallery and featured selections.
3. Moderation criteria and procedures.
4. Submission conditions and possible restrictions for new participants.
5. The set of reactions and comments available in the gallery.
6. Whether user-created collections will be supported and how their privacy will be configured.
7. Rules for displaying author pages.
8. Rules for downloading and providing source files.
9. An appeal mechanism for rejected submissions.
10. Additional integrations with other club locations and commercial areas.

The existence of these open questions does not invalidate the architectural principles and responsibility boundaries established in this document. They may be resolved progressively during construction, as concrete implementation needs arise, and recorded through controlled document updates.

---

## 19. RELATIONSHIP TO OTHER ARCHITECTURAL DOCUMENTS

This document should be considered together with the following materials:

- **GY-GY CLUB — PRINT OBJECT & LIFECYCLE ARCHITECTURE** — the common PRINT object model and its lifecycle;
- **GY-GY CLUB — COMMON DATA ARCHITECTURE** — shared rules for organizing club data;
- **GY-GY CLUB — COMMON ARCHITECTURE** — club-wide architectural principles and mechanisms;
- **PRINT CORE Architecture** — architecture for creating and editing works;
- **ATELIER Architecture** — architecture for product configuration;
- **OFFICE Architecture** — administrative, operational, and production processes;
- **GY-GY CLUB — CHAT CORE Architecture** — shared mechanisms for communication, comments, and moderation.

If conflicts arise, the responsibility boundaries and consistency of the documents must be reviewed rather than creating local exceptions without an architectural decision.

---

## 20. CHANGE CONTROL

Changes to THE PRINT PARLOUR architecture must be recorded in the document with:

- version;
- date;
- sections changed;
- reason for the change;
- relationship to other architectural decisions;
- approval status.

Changes affecting common PRINT objects, rights, authorship, history, storage, or shared club services must be coordinated with the relevant common architecture documents.

**Draft 0.1 — prepared for architectural review.**

This document does not authorize changes to live systems, databases, storage, or the GY-GY Club production environment.
