# Meta Guide AI

## Purpose

Meta Guide AI is an RTU-focused learning platform with:

- React/Vite frontend
- Express/MongoDB backend
- AI-generated explanations, tests, simulations, and assistant chat

The current product direction is syllabus-bound academic generation. Subject creation resolves against official RTU syllabus files, and topic content must stay inside the matched subject scope.

## Current Subject Flow

When creating a subject, the user provides:

- Subject name
- University (`RTU`)
- Branch

The backend then:

1. Searches the configured RTU syllabus sources for the chosen branch.
2. Infers the semester from the matched course entry.
3. Parses only the relevant syllabus sources, not every syllabus file into prompts.
4. Fuzzy-matches the entered subject name against the official course names.
5. Saves the canonical subject name, inferred semester, course code, syllabus source, syllabus excerpt, and full matched syllabus block.

This means topic explanations, tests, and simulations can be generated from the matched course block instead of generic subject assumptions.

## RTU Branch Mapping

Currently supported branches:

- Computer Science & Engineering
- Artificial Intelligence
- Civil Engineering
- Electrical & Electronic Engineering
- Mechanical Engineering

Current source mapping assumptions:

- Semester 1 and 2 use `Backend/public/RTU Syllabus/1st & 2nd Sem.md`
- Semester 7 and 8 use the shared root-level `7th & 8th Sem.md`
- CSE semester 3 to 6 use the existing RTU files in `Backend/public/RTU Syllabus`
- AI, Civil, EEE, and Mechanical semester 3 to 6 use their branch folders at repo root

## Known Risk

- First-year shared subjects still collapse to the lower semester as the canonical stored value when one syllabus entry covers both semesters.
- The extracted `.md` syllabi remain parser-dependent artifacts. The original PDFs should be treated as the source of truth if any future mismatch appears.

Confirmed by user:

- `7th & 8th Sem.md` is intentionally common across all branches.
- Original syllabus PDFs are available as source-of-truth backups.

## Generation Rules

Topic generation must remain aligned with:

- matched subject name
- branch
- semester
- course code
- syllabus content block

Explanation generation should:

- use official course terminology when available
- include lab/practical context if the syllabus supports it
- avoid outside concepts unless clearly prerequisite

Simulation generation should:

- stay inside the explanation and syllabus scope
- avoid undefined variables and unexplained values
- remain responsive and iframe-safe

Test generation should:

- stay inside the matched syllabus boundary
- reflect branch-specific terminology and coverage

## Session History

### 2026-03-12

Completed:

- Reworked RTU syllabus resolver to support multiple branches.
- Added `branch` and `syllabusContent` to the `Subject` model.
- Updated subject create/edit flows in backend to resolve canonical RTU subject metadata.
- Added fail-safe error handling for broken syllabus source mappings.
- Hardened course parsing so markdown labels cannot be mistaken for course codes.
- Fixed heading parsing for branch files that use headings like `## COURSE 6 (ELECTIVE): ...`.
- Threaded branch and full syllabus context into explanation, test, and simulation generation.
- Added branch selection to subject creation UI.
- Removed the syllabus button/modal from subject cards and admin subject listings.
- Switched subject creation/editing to automatic semester inference from matched syllabus data.
- Updated the shared 7th and 8th semester source to use the root-level syllabus file.
- Confirmed the fixed EEE semester 4 file can now be parsed instead of being rejected as bad input.
- Added fast branch-scoped subject suggestions for failed or ambiguous subject matches.
- Repaired the corrupted `Steam Engineering` subject record after the parser fix.

Pending verification and likely follow-up:

- Decide later whether first-year shared subjects should remain single-semester canonical entries or become semester-range entries.

## Files Touched For This Direction

Backend:

- `Backend/src/services/rtuSyllabusService.js`
- `Backend/src/models/Subject.js`
- `Backend/src/routes/subjectRoutes.js`
- `Backend/src/routes/adminRoutes.js`
- `Backend/src/routes/explanationRoutes.js`
- `Backend/src/routes/simulationRoutes.js`
- `Backend/src/routes/testRoutes.js`
- `Backend/src/services/explanationService.js`
- `Backend/src/services/simulationService.js`
- `Backend/src/services/testService.js`
- `Backend/src/services/topicGenerationService.js`

Frontend:

- `Frontend/src/components/ui/AddSubjectModal.jsx`
- `Frontend/src/pages/Subjects.jsx`
- `Frontend/src/pages/AdminDashboard.jsx`
- `Frontend/src/constants/rtu.js`

## Resume Checklist

When resuming work:

1. Read this file first.
2. Verify current syllabus source files before changing branch mappings.
3. Sanity-check `findRtuSubjectMatch()` with real subject names from each branch.
4. Run frontend build and backend startup after backend/parser edits.
5. Do not assume syllabus filenames are truthful; validate the semester content inside them.
