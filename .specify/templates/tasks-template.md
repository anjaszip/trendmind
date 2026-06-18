---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize TypeScript project with strict mode enabled (Principle I)
- [ ] T003 [P] Configure ESLint and Prettier for TypeScript (Principle I)
- [ ] T004 [P] Setup testing framework (Jest/Vitest) with 80% coverage target (Principle II)
- [ ] T005 [P] Configure CI/CD pipeline with linting, type checking, and tests (Principles I & II)
- [ ] T006 [P] Setup performance monitoring for dashboard and API (Principle IV)
- [ ] T007 [P] Configure security: authentication, rate limiting, input validation (Principle VI)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T008 Setup database schema and migrations framework
- [ ] T009 [P] Implement authentication/authorization framework (Principle VI)
- [ ] T010 [P] Setup API routing and middleware with rate limiting (Principle VI)
- [ ] T011 [P] Implement pluggable signal provider architecture (Principle V)
- [ ] T012 [P] Implement pluggable AI provider architecture (Principle V)
- [ ] T013 [P] Implement extensible notification channel architecture (Principle V)
- [ ] T014 Create base models/entities following clean architecture (Principle I)
- [ ] T015 Configure error handling with user-friendly messages (Principle III)
- [ ] T016 Setup environment configuration for secrets (Principle VI)
- [ ] T017 [P] Implement consistent UI components library (Principle III)
- [ ] T018 [P] Setup caching infrastructure (Principle IV)
- [ ] T019 [P] Implement async background job queue (Principle IV)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (MANDATORY per Principle II) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**
> **Coverage target: 80% minimum**

- [ ] T020 [P] [US1] Unit tests for business logic in tests/unit/[name].test.ts
- [ ] T021 [P] [US1] Integration test for [critical workflow] in tests/integration/[name].test.ts
- [ ] T022 [P] [US1] Regression tests (if bug fix) in tests/regression/[name].test.ts

### Implementation for User Story 1

- [ ] T023 [P] [US1] Create [Entity] models following clean architecture in src/models/[entity].ts
- [ ] T024 [US1] Implement [Service] with caching in src/services/[service].ts (Principle IV)
- [ ] T025 [US1] Implement async background jobs (if needed) in src/jobs/[job].ts (Principle IV)
- [ ] T026 [US1] Implement API endpoints with auth and validation in src/api/[endpoint].ts (Principle VI)
- [ ] T027 [US1] Add user-friendly error handling for all states (Principle III)
- [ ] T028 [P] [US1] Implement UI components using consistent design (if UI) (Principle III)
- [ ] T029 [P] [US1] Ensure mobile-responsive layout (if UI) (Principle III)
- [ ] T030 [US1] Use consistent terminology (trends/signals/keywords/insights) (Principle III)
- [ ] T031 [US1] Document public APIs with usage examples (Principle I)
- [ ] T032 [US1] Avoid business logic duplication (Principle I)

### Quality Verification for User Story 1

- [ ] T033 [US1] Verify TypeScript strict mode compliance (Principle I)
- [ ] T034 [US1] Run ESLint and type checking - must pass (Principle I)
- [ ] T035 [US1] Verify test coverage ≥ 80% (Principle II)
- [ ] T036 [US1] Run performance benchmarks (dashboard < 2s, API < 500ms) (Principle IV)
- [ ] T037 [US1] Verify authentication and input validation (Principle VI)
- [ ] T038 [US1] Code review with constitutional compliance check

**Checkpoint**: At this point, User Story 1 should be fully functional, tested, and constitution-compliant

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
