import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SYLLABUS_DIR = path.join(__dirname, "../../public/RTU Syllabus")
const MAX_CONTEXT_CHARS = 7000

const SEMESTER_FILE_MAP = {
  1: "1st & 2nd Sem.txt",
  2: "1st & 2nd Sem.txt",
  3: "3rd & 4th Sem.txt",
  4: "3rd & 4th Sem.txt",
  5: "5th & 6th Sem.txt",
  6: "5th & 6th Sem.txt",
  7: "7th & 8th Sem.txt",
  8: "7th & 8th Sem.txt"
}

const SEMESTER_ROMAN = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII"
}

const fileCache = new Map()

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const levenshteinDistance = (left = "", right = "") => {
  if (left === right) {
    return 0
  }

  if (!left.length) {
    return right.length
  }

  if (!right.length) {
    return left.length
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = new Array(right.length + 1)

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i

    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      )
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j]
    }
  }

  return previous[right.length]
}

const similarityScore = (left = "", right = "") => {
  const maxLength = Math.max(left.length, right.length)

  if (!maxLength) {
    return 1
  }

  return 1 - (levenshteinDistance(left, right) / maxLength)
}

const extractCourseCode = (blockText = "") => {
  const patterns = [
    /Course Code:\**\s*([A-Z0-9/-]+)/i,
    /^## COURSE:\s*([A-Z0-9-]+)/im,
    /^###\s*([A-Z0-9/-]+):/im,
    /^\d+\.\s+\*\*([A-Z0-9-]+)\s+[—-]/im,
    /^-\s*([0-9A-Z/ -]+):\s+/im
  ]

  for (const pattern of patterns) {
    const match = blockText.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return ""
}

const extractSemesterLabel = (blockText = "", fallback = "") => {
  const patterns = [
    /- \*\*Semester:\*\*\s*(.+)/i,
    /- Semester:\s*(.+)/i,
    /## .*?([IVX]+ Semester.*?)$/im,
    /## .*?(I & II|III Semester|IV Semester|V|VI|VII Semester|VIII Semester)/im
  ]

  for (const pattern of patterns) {
    const match = blockText.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return fallback
}

const scoreMatch = (inputName, courseName) => {
  const normalizedInput = normalizeText(inputName)
  const normalizedCourse = normalizeText(courseName)

  if (!normalizedInput || !normalizedCourse) {
    return 0
  }

  if (normalizedInput === normalizedCourse) {
    return 100
  }

  if (
    normalizedCourse.includes(normalizedInput) ||
    normalizedInput.includes(normalizedCourse)
  ) {
    return 85
  }

  const inputTokens = normalizedInput.split(" ")
  const courseTokens = normalizedCourse.split(" ")

  const tokenSimilarityTotal = inputTokens.reduce((total, token) => {
    const bestTokenSimilarity = courseTokens.reduce((best, courseToken) => {
      return Math.max(best, similarityScore(token, courseToken))
    }, 0)

    if (bestTokenSimilarity < 0.82) {
      return total
    }

    return total + bestTokenSimilarity
  }, 0)

  const fuzzyTokenScore = Math.round(
    (tokenSimilarityTotal / Math.max(inputTokens.length, 1)) * 78
  )

  const fullStringScore = Math.round(
    similarityScore(normalizedInput, normalizedCourse) * 80
  )

  return Math.max(fuzzyTokenScore, fullStringScore)
}

const semesterMatches = (entry, semester) => {
  if (!entry.semesterLabel) {
    return true
  }

  const semesterText = entry.semesterLabel.toLowerCase()
  const roman = SEMESTER_ROMAN[semester]?.toLowerCase()

  if (!roman) {
    return false
  }

  if (semesterText.includes(`${roman} &`) || semesterText.includes(`& ${roman}`)) {
    return true
  }

  if (semesterText.includes(`${roman} semester`) || semesterText.includes(`semester ${roman}`)) {
    return true
  }

  if (semesterText === roman || semesterText.endsWith(` ${roman}`)) {
    return true
  }

  return false
}

const getHeadingMatch = (line) => {
  const patterns = [
    { pattern: /^### Course:\s*(.+)$/i, parse: (match) => ({ courseName: match[1].trim(), courseCode: "" }) },
    { pattern: /^###\s*([A-Z0-9/-]+):\s*(.+)$/i, parse: (match) => ({ courseCode: match[1].trim(), courseName: match[2].trim() }) },
    { pattern: /^## COURSE:\s*([A-Z0-9-]+)\s+[—-]\s*(.+)$/i, parse: (match) => ({ courseCode: match[1].trim(), courseName: match[2].trim() }) },
    { pattern: /^\d+\.\s+\*\*([A-Z0-9-]+)\s+[—-]\s*(.+?)\*\*/i, parse: (match) => ({ courseCode: match[1].trim(), courseName: match[2].trim() }) },
    { pattern: /^-\s*([0-9A-Z/ -]+):\s*(.+)$/i, parse: (match) => ({ courseCode: match[1].trim(), courseName: match[2].trim() }) }
  ]

  for (const { pattern, parse } of patterns) {
    const match = line.match(pattern)
    if (match) {
      return parse(match)
    }
  }

  return null
}

const parseSemesterFile = (fileName) => {
  if (fileCache.has(fileName)) {
    return fileCache.get(fileName)
  }

  const filePath = path.join(SYLLABUS_DIR, fileName)
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split(/\r?\n/)
  const headings = []
  let activeSemesterLabel = ""

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (/^## .*Semester/i.test(trimmed)) {
      activeSemesterLabel = trimmed
    } else {
      const semesterLine = trimmed.match(/^- \*\*Semester:\*\*\s*(.+)$/i)
      if (semesterLine) {
        activeSemesterLabel = semesterLine[1].trim()
      }
    }

    const heading = getHeadingMatch(trimmed)
    if (heading) {
      headings.push({
        ...heading,
        index,
        semesterLabel: activeSemesterLabel
      })
    }
  })

  const parsedEntries = headings.map((heading, idx) => {
    const nextIndex = headings[idx + 1]?.index ?? lines.length
    const blockText = lines.slice(heading.index, nextIndex).join("\n").trim()
    const semesterLabel = extractSemesterLabel(blockText, heading.semesterLabel)

    return {
      courseName: heading.courseName,
      courseCode: heading.courseCode || extractCourseCode(blockText),
      semesterLabel,
      sourceFile: fileName,
      content: blockText,
      normalizedName: normalizeText(heading.courseName)
    }
  })

  const dedupedEntries = []
  const seen = new Map()

  parsedEntries.forEach((entry) => {
    const key = `${entry.courseCode}::${entry.normalizedName}`
    const existing = seen.get(key)

    if (!existing || entry.content.length > existing.content.length) {
      seen.set(key, entry)
    }
  })

  seen.forEach((entry) => dedupedEntries.push(entry))
  fileCache.set(fileName, dedupedEntries)

  return dedupedEntries
}

export const findRtuSubjectMatch = ({ subjectName, semester }) => {
  const semesterNumber = Number(semester)
  const fileName = SEMESTER_FILE_MAP[semesterNumber]

  if (!fileName) {
    throw new Error("Invalid semester for RTU syllabus lookup")
  }

  const entries = parseSemesterFile(fileName).filter((entry) =>
    semesterMatches(entry, semesterNumber)
  )

  const bestMatch = entries
    .map((entry) => ({
      ...entry,
      score: scoreMatch(subjectName, entry.courseName)
    }))
    .sort((a, b) => b.score - a.score)[0]

  if (!bestMatch || bestMatch.score < 65) {
    return null
  }

  return {
    university: "RTU",
    semester: semesterNumber,
    courseName: bestMatch.courseName,
    courseCode: bestMatch.courseCode,
    syllabusContext: bestMatch.content.slice(0, MAX_CONTEXT_CHARS),
    syllabusSourceFile: bestMatch.sourceFile
  }
}
