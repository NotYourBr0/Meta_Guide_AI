import fetch from "node-fetch"

export const generateExplanationFromAI = async ({
  subjectName,
  subjectLevel,
  topicName,
  topicLevel,
  language
}) => {

  const prompt =` Generate a structured, well-formatted explanation for the topic.

Subject: ${subjectName}
Subject Level: ${subjectLevel}
Topic: ${topicName}
Difficulty: ${topicLevel}
Language: ${language}

You are an expert ${subjectName} educator.

Write a clear, complete, and well-organized explanation for "${topicName}" in ${subjectName}, adapted to the given subject level and difficulty.

STRUCTURE RULES:

Do NOT use a fixed template.

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

Adjust structure and depth automatically:

For Beginner Level:

Simple overview

Basic concepts

Examples

Visual or intuitive explanations

Simple practice questions

For Intermediate Level:

Deeper explanations

Formulas

Step-by-step methods

Applications

Common mistakes

Practice problems

For Advanced Level:

Theoretical background

Derivations

Advanced models

Edge cases

Proofs or reasoning

Complex examples

Challenging exercises

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

OUTPUT GOAL:

Produce a well-structured, attractive, level-appropriate explanation that feels custom-designed for this topic and learner level.
`

  const apiKey = process.env.EXPLANATION_API_KEY
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 4096
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // Extract text from Gemini API response
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!generatedText) {
    throw new Error("No content generated from AI")
  }

  return generatedText
}
