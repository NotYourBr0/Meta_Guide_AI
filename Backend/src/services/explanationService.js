import { generateGroqTextWithFailover } from "./groqKeyPool.js"

const EXPLANATION_MODEL = "openai/gpt-oss-120b"
const EXPLANATION_MAX_TOKENS = 8000

export const generateExplanationFromAI = async ({
  subjectName,
  subjectBranch,
  subjectUniversity,
  subjectSemester,
  subjectCode,
  syllabusContext,
  topicName,
  topicLevel,
  language
}) => {
  const trimmedSyllabusContext = syllabusContext
    ? syllabusContext.slice(0, 6000)
    : ""

  const prompt = `Generate a structured, syllabus-faithful explanation for the topic.

Subject: ${subjectName}
Branch: ${subjectBranch || "Unknown"}
University: ${subjectUniversity || "Unknown"}
Semester: ${subjectSemester || "Unknown"}
Course Code: ${subjectCode || "Unknown"}
Topic: ${topicName}
Difficulty: ${topicLevel}
Language: ${language}

You are an expert ${subjectName} educator for RTU engineering students.

SYLLABUS CONTEXT:
${trimmedSyllabusContext || "No syllabus context available."}

Write a clear, complete, and well-organized explanation for "${topicName}" in ${subjectName}, adapted to the official syllabus, branch, and difficulty.

STRUCTURE RULES:

Do NOT use a fixed template.
Do NOT invent units, modules, experiments, formulas, or terminology that are not supported by the syllabus context or direct prerequisite knowledge.
Difficulty level controls content length and coverage depth, not language complexity.
Keep the language easy, direct, and student-friendly at every level.
Do not make advanced explanations sound academically inflated or unnecessarily technical.

Dynamically design the section structure based on:

Subject level

Topic complexity

Difficulty level

Use more sections for advanced topics.

Use simpler sections for beginner topics.

Choose headings that best fit the topic.

FORMATTING RULES:

Output GitHub-Flavored Markdown only.

Do NOT use code blocks or backticks.

Use # for main title.

Use ## and ### for sections.

Leave one blank line after each heading.

Leave one blank line between sections.

Use "-" for bullet points.

Use "1." for numbered steps.

Keep paragraphs short.

Do NOT merge everything into one block.

CONTENT GUIDELINES:

Adjust structure and depth automatically, but keep the language easy and readable:

For Beginner Level:

Use a normal full explanation in very easy language

Explain every idea in the simplest clear form

Use friendly examples from study or daily life where relevant

Define technical terms immediately in plain words

Keep this as the baseline explanation length

For Intermediate Level:

Keep the same easy language as beginner level

Make the content about 30% longer than beginner level

Add a little more detail, more examples, and more applications

Expand steps, common mistakes, and practice questions without increasing wording difficulty

For Advanced Level:

Keep the same easy, student-friendly language

Make the content about 60% longer than beginner level

Add broader coverage, more worked reasoning, more edge cases, and more practice

Do not use difficult wording just because the level is advanced

MANDATORY ELEMENTS (adapt quantity and depth to level):

Include where appropriate:

Introduction / Overview

Core Concepts

Definitions

Formulas or Rules

Worked Examples

Procedures or Methods

Applications

Misconceptions

Practice Questions

Answers or Hints

Summary

You may rename, merge, split, or expand sections as needed.

DESIGN & READABILITY:

Make layout visually clean.

Use logical flow from basic to advanced.

Use consistent heading hierarchy.

Balance text and bullet points.

Avoid dense paragraphs.

Make it pleasant to read.

TONE:

Clear and direct.

Student-focused.

No unnecessary filler.

Match depth to: ${topicLevel}.

Maintain professional and engaging style.
Use short sentences and simple wording.
If a textbook or exam definition is important, write the accurate definition first and then explain it in easy words immediately after.
Do not replace proper technical definitions with vague casual language.

OUTPUT GOAL:

Produce a well-structured, attractive, level-appropriate explanation that feels custom-designed for this topic and learner level.

STRICT SYLLABUS ALIGNMENT:
- Treat the syllabus context above as the course ground truth.
- Keep the explanation aligned with the official course scope, terminology, and unit structure where relevant.
- Do not drift into unrelated topics unless clearly marked as optional enrichment.
- If the syllabus block includes lab work, experiments, design exercises, or practical applications relevant to the topic, include them in the explanation.
- If a concept is outside the matched syllabus block, do not present it as part of the core explanation.
- Prefer the exact course terminology and naming used in the syllabus when available.
- When formulas are needed, format inline formulas as $...$ and important formulas as $$...$$ using readable LaTeX.
- After each important formula, define every symbol in simple bullet points.
- Keep formulas readable and never dump raw ASCII-style expressions when proper LaTeX can express them clearly.
`

  return generateGroqTextWithFailover({
    envVarName: "EXPLANATION_API_KEY",
    model: EXPLANATION_MODEL,
    maxTokens: EXPLANATION_MAX_TOKENS,
    temperature: 0.5,
    topP: 0.9,
    systemPrompt: "You generate syllabus-faithful engineering explanations in clean GitHub-Flavored Markdown.",
    userPrompt: prompt
  })
}
