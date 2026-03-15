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
## Resume Checklist

When resuming work:

1. Read this file first.
2. Verify current syllabus source files before changing branch mappings.
3. Sanity-check `findRtuSubjectMatch()` with real subject names from each branch.
4. Run frontend build and backend startup after backend/parser edits.
5. Do not assume syllabus filenames are truthful; validate the semester content inside them.
