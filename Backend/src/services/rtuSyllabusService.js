import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APP_ROOT = path.join(__dirname, "../../..")

const MAX_CONTEXT_CHARS = 9000

export const RTU_BRANCHES = [
  "Computer Science & Engineering",
  "Artificial Intelligence",
  "Civil Engineering",
  "Electrical & Electronic Engineering",
  "Mechanical Engineering"
]

const createLookupError = (message, statusCode = 400, suggestions = []) => {
  const error = new Error(message)
  error.statusCode = statusCode
  error.suggestions = suggestions
  return error
}

const COMMON_FIRST_YEAR_FILE = path.join(APP_ROOT, "Backend/public/RTU Syllabus/1st & 2nd Sem.md")
const COMMON_FOURTH_YEAR_FILE = path.join(APP_ROOT, "7th & 8th Sem.md")

const FILE_MAP = {
  "Computer Science & Engineering": {
    1: COMMON_FIRST_YEAR_FILE,
    2: COMMON_FIRST_YEAR_FILE,
    3: path.join(APP_ROOT, "Backend/public/RTU Syllabus/3rd & 4th Sem.md"),
    4: path.join(APP_ROOT, "Backend/public/RTU Syllabus/3rd & 4th Sem.md"),
    5: path.join(APP_ROOT, "Backend/public/RTU Syllabus/5th & 6th Sem.md"),
    6: path.join(APP_ROOT, "Backend/public/RTU Syllabus/5th & 6th Sem.md"),
    7: COMMON_FOURTH_YEAR_FILE,
    8: COMMON_FOURTH_YEAR_FILE
  },
  "Artificial Intelligence": {
    1: COMMON_FIRST_YEAR_FILE,
    2: COMMON_FIRST_YEAR_FILE,
    3: path.join(APP_ROOT, "AI/2nd year 3 sem.md"),
    4: path.join(APP_ROOT, "AI/2nd year 4 sem.md"),
    5: path.join(APP_ROOT, "AI/3year 5 or 6 sem.md"),
    6: path.join(APP_ROOT, "AI/3year 5 or 6 sem.md"),
    7: COMMON_FOURTH_YEAR_FILE,
    8: COMMON_FOURTH_YEAR_FILE
  },
  "Civil Engineering": {
    1: COMMON_FIRST_YEAR_FILE,
    2: COMMON_FIRST_YEAR_FILE,
    3: path.join(APP_ROOT, "Civil Engineering/2nd year 3sem.md"),
    4: path.join(APP_ROOT, "Civil Engineering/2nd year 4sem.md"),
    5: path.join(APP_ROOT, "Civil Engineering/CE 3rd year 5th & 6th Sem.md"),
    6: path.join(APP_ROOT, "Civil Engineering/CE 3rd year 5th & 6th Sem.md"),
    7: COMMON_FOURTH_YEAR_FILE,
    8: COMMON_FOURTH_YEAR_FILE
  },
  "Electrical & Electronic Engineering": {
    1: COMMON_FIRST_YEAR_FILE,
    2: COMMON_FIRST_YEAR_FILE,
    3: path.join(APP_ROOT, "Electrical & Electronic Engineering/EEE 3rd Sem.md"),
    4: path.join(APP_ROOT, "Electrical & Electronic Engineering/EEE 4th sem.md"),
    5: path.join(APP_ROOT, "Electrical & Electronic Engineering/EEE 5th & 6th Sem.md"),
    6: path.join(APP_ROOT, "Electrical & Electronic Engineering/EEE 5th & 6th Sem.md"),
    7: COMMON_FOURTH_YEAR_FILE,
    8: COMMON_FOURTH_YEAR_FILE
  },
  "Mechanical Engineering": {
    1: COMMON_FIRST_YEAR_FILE,
    2: COMMON_FIRST_YEAR_FILE,
    3: path.join(APP_ROOT, "Mechanical Engineering/2nd year 3sem.md"),
    4: path.join(APP_ROOT, "Mechanical Engineering/2nd year 4sem .md"),
    5: path.join(APP_ROOT, "Mechanical Engineering/3 rd year.md"),
    6: path.join(APP_ROOT, "Mechanical Engineering/3 rd year.md"),
    7: COMMON_FOURTH_YEAR_FILE,
    8: COMMON_FOURTH_YEAR_FILE
  }
}

const ROMAN_BY_SEMESTER = {
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

const normalizeCourseCode = (value = "") =>
  value
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .trim()

const isLikelyCourseCode = (value = "") =>
  /^\d[A-Z0-9]*(?:-\d+)?(?:\s*\/\s*\d[A-Z0-9]*(?:-\d+)?)*$/i.test(
    normalizeCourseCode(value)
  )

const cleanCourseName = (value = "") =>
  value
    .replace(/^[A-Z0-9][A-Z0-9/ -]*[A-Z0-9]\s*[-—–:]\s*/i, "")
    .replace(/\s*\(UNIT[- ]WISE\)\s*$/i, "")
    .replace(/\s*[—-]\s*Credit:.*$/i, "")
    .trim()

const resolveCourseName = (value = "") =>
  value
    .replace(/^\d[A-Z0-9/ -]*[A-Z0-9]\s*[-—–:]\s*/i, "")
    .replace(/\s*\(UNIT[- ]WISE\)\s*$/i, "")
    .replace(/\s*[-—–]\s*Credit:.*$/i, "")
    .trim()

export const normalizeBranchName = (value = "") => {
  const normalizedValue = normalizeText(value)

  const aliases = new Map([
    ["computer science engineering", "Computer Science & Engineering"],
    ["computer science and engineering", "Computer Science & Engineering"],
    ["cse", "Computer Science & Engineering"],
    ["artificial intelligence", "Artificial Intelligence"],
    ["ai", "Artificial Intelligence"],
    ["civil engineering", "Civil Engineering"],
    ["mechanical engineering", "Mechanical Engineering"],
    ["electrical and electronic engineering", "Electrical & Electronic Engineering"],
    ["electrical and electronics engineering", "Electrical & Electronic Engineering"],
    ["electrical electronic engineering", "Electrical & Electronic Engineering"],
    ["electrical electronics engineering", "Electrical & Electronic Engineering"],
    ["eee", "Electrical & Electronic Engineering"]
  ])

  return aliases.get(normalizedValue) || null
}

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
    /Course Code:\**\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])/i,
    /- Course code:\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])/i,
    /^## COURSE:\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s*[-—–:]/im,
    /^###\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s*:/im,
    /^\d+\.\s+\*\*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s+[-—–]/im,
    /^-\s*([0-9][0-9A-Z/ -]*[A-Z0-9]):\s+/im
  ]

  for (const pattern of patterns) {
    const match = blockText.match(pattern)
    if (match) {
      const candidate = normalizeCourseCode(match[1])
      if (isLikelyCourseCode(candidate)) {
        return candidate
      }
    }
  }

  return ""
}

const extractCourseName = (blockText = "") => {
  const patterns = [
    /- \*\*Course Name:\*\*\s*(.+)/i,
    /- Course name:\s*(.+)/i,
    /^## COURSE:\s*[A-Z0-9][A-Z0-9/ -]*[A-Z0-9]\s*[-—–:]\s*(.+)$/im,
    /^###\s*[A-Z0-9][A-Z0-9/ -]*[A-Z0-9]\s*:\s*(.+)$/im,
    /^\d+\.\s+\*\*[A-Z0-9][A-Z0-9/ -]*[A-Z0-9]\s+[-—–]\s*(.+?)\*\*/im,
    /^-\s*[0-9][0-9A-Z/ -]*[A-Z0-9]:\s*(.+)$/im
  ]

  for (const pattern of patterns) {
    const match = blockText.match(pattern)
    if (match) {
      return resolveCourseName(match[1].trim())
    }
  }

  return ""
}

const extractSemesterLabel = (blockText = "", fallback = "") => {
  const patterns = [
    /- \*\*Semester:\*\*\s*(.+)/i,
    /- Semester:\s*(.+)/i,
    /^#+\s*(SEMESTER\s+[IVX]+.*?)$/im,
    /^#+\s*(.*?[IVX]+\s+Semester.*?)$/im,
    /^#+\s*(.*?I\s*&\s*II.*?)$/im,
    /^#+\s*(.*?V\s*&\s*VI.*?)$/im,
    /^#+\s*(.*?VII\s*&\s*VIII.*?)$/im
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
    const bestTokenSimilarity = courseTokens.reduce(
      (best, courseToken) => Math.max(best, similarityScore(token, courseToken)),
      0
    )

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
  const courseCodeSemesters = Array.from(
    (entry.courseCode || "").matchAll(/(?:^|\/\s*)([1-8])(?=[A-Z])/g),
    (match) => Number(match[1])
  )

  if (courseCodeSemesters.includes(semester)) {
    return true
  }

  if (!entry.semesterLabel) {
    return true
  }

  const semesterText = normalizeText(entry.semesterLabel)
  const roman = normalizeText(ROMAN_BY_SEMESTER[semester])
  const numeric = String(semester)

  if (!roman) {
    return false
  }

  if (
    semesterText.includes(`semester ${roman}`) ||
    semesterText.includes(`${roman} semester`) ||
    semesterText.includes(`semester ${numeric}`) ||
    semesterText.includes(`${numeric} semester`) ||
    semesterText === roman ||
    new RegExp(`^${roman}(\\b|\\s)`).test(semesterText) ||
    new RegExp(`^${numeric}(\\b|\\s)`).test(semesterText) ||
    semesterText.endsWith(` ${roman}`) ||
    semesterText.includes(`${roman} and`) ||
    semesterText.includes(`and ${roman}`) ||
    semesterText.includes(`year ${roman}`) ||
    semesterText.includes(`${roman} year`)
  ) {
    return true
  }

  if (semester === 1 || semester === 2) {
    return semesterText.includes("i and ii")
  }

  if (semester === 3 || semester === 4) {
    return semesterText.includes("iii and iv")
  }

  if (semester === 5 || semester === 6) {
    return semesterText.includes("v and vi")
  }

  if (semester === 7 || semester === 8) {
    return semesterText.includes("vii and viii")
  }

  return false
}

const getHeadingMatch = (line) => {
  const patterns = [
    {
      pattern: /^# SUBJECT \d+$/i,
      parse: () => ({ courseName: "", courseCode: "" })
    },
    {
      pattern: /^# SUBJECT \d+:\s*(.+)$/i,
      parse: (match) => ({ courseName: match[1].trim(), courseCode: "" })
    },
    {
      pattern: /^## COURSE \d+$/i,
      parse: () => ({ courseName: "", courseCode: "" })
    },
    {
      pattern: /^## COURSE \d+:\s*(.+)$/i,
      parse: (match) => ({ courseName: match[1].trim(), courseCode: "" })
    },
    {
      pattern: /^## COURSE \d+\s*\([^)]*\)$/i,
      parse: () => ({ courseName: "", courseCode: "" })
    },
    {
      pattern: /^## COURSE \d+\s*\([^)]*\):\s*(.+)$/i,
      parse: (match) => ({ courseName: match[1].trim(), courseCode: "" })
    },
    {
      pattern: /^## Course:\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s*:\s*(.+)$/i,
      parse: (match) => ({
        courseCode: normalizeCourseCode(match[1]),
        courseName: match[2].trim()
      })
    },
    {
      pattern: /^## Course:\s*(?![A-Z0-9][A-Z0-9/ -]*[A-Z0-9]\s*[-—–:])(.+)$/i,
      parse: (match) => ({ courseName: match[1].trim(), courseCode: "" })
    },
    {
      pattern: /^### Course:\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s*:\s*(.+)$/i,
      parse: (match) => ({
        courseCode: normalizeCourseCode(match[1]),
        courseName: match[2].trim()
      })
    },
    {
      pattern: /^### Course:\s*(?![A-Z0-9][A-Z0-9/ -]*[A-Z0-9]\s*[-—–:])(.+)$/i,
      parse: (match) => ({ courseName: match[1].trim(), courseCode: "" })
    },
    {
      pattern: /^###\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s*:\s*(.+)$/i,
      parse: (match) => ({
        courseCode: normalizeCourseCode(match[1]),
        courseName: match[2].trim()
      })
    },
    {
      pattern: /^## COURSE:\s*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s*[-—–]\s*(.+)$/i,
      parse: (match) => ({
        courseCode: normalizeCourseCode(match[1]),
        courseName: match[2].trim()
      })
    },
    {
      pattern: /^\d+\.\s+\*\*([A-Z0-9][A-Z0-9/ -]*[A-Z0-9])\s+[-—–]\s*(.+?)\*\*/i,
      parse: (match) => ({
        courseCode: normalizeCourseCode(match[1]),
        courseName: match[2].trim()
      })
    },
    {
      pattern: /^-\s*([0-9][0-9A-Z/ -]*[A-Z0-9]):\s*(.+)$/i,
      parse: (match) => ({
        courseCode: normalizeCourseCode(match[1]),
        courseName: match[2].trim()
      })
    }
  ]

  for (const { pattern, parse } of patterns) {
    const match = line.match(pattern)
    if (match) {
      return parse(match)
    }
  }

  return null
}

const parseSemesterFile = (filePath) => {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath)
  }

  if (!fs.existsSync(filePath)) {
    throw createLookupError(`Configured syllabus file is missing: ${path.basename(filePath)}`, 500)
  }

  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split(/\r?\n/)
  const headings = []
  let activeSemesterLabel = ""

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (/^#+ .*semester/i.test(trimmed)) {
      activeSemesterLabel = trimmed
    } else {
      const semesterLine = trimmed.match(/^- \*\*Semester:\*\*\s*(.+)$/i) || trimmed.match(/^- Semester:\s*(.+)$/i)
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

  const parsedEntries = headings.map((heading, index) => {
    const nextIndex = headings[index + 1]?.index ?? lines.length
    const blockText = lines.slice(heading.index, nextIndex).join("\n").trim()
    const extractedCourseName = extractCourseName(blockText)
    const resolvedCourseName = resolveCourseName(extractedCourseName || heading.courseName)
    const resolvedCourseCode = isLikelyCourseCode(heading.courseCode)
      ? heading.courseCode
      : extractCourseCode(blockText)

    return {
      courseName: resolvedCourseName,
      courseCode: resolvedCourseCode,
      semesterLabel: extractSemesterLabel(blockText, heading.semesterLabel),
      sourceFile: path.basename(filePath),
      sourcePath: filePath,
      content: blockText,
      normalizedName: normalizeText(resolvedCourseName)
    }
  }).filter((entry) => entry.courseName && isLikelyCourseCode(entry.courseCode))

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
  fileCache.set(filePath, dedupedEntries)

  return dedupedEntries
}

const getBranchSemesterEntries = (branch, semester) => {
  const filePath = FILE_MAP[branch]?.[semester]

  if (!filePath) {
    throw createLookupError(`No RTU syllabus source is configured for ${branch}, semester ${semester}.`)
  }

  const entries = parseSemesterFile(filePath).filter((entry) =>
    semesterMatches(entry, semester)
  )

  if (!entries.length) {
    throw createLookupError(
      `RTU syllabus source "${path.basename(filePath)}" does not contain valid semester ${semester} entries for ${branch}.`
    )
  }

  return entries
}

const buildSemesterCandidateMap = (branch, semestersToSearch) => {
  const candidateMap = new Map()

  semestersToSearch.forEach((semester) => {
    const entries = getBranchSemesterEntries(branch, semester)

    entries.forEach((entry) => {
      const key = `${entry.courseCode}::${entry.normalizedName}`
      const existing = candidateMap.get(key)

      if (existing) {
        existing.semesters.add(semester)
        if (entry.content.length > existing.entry.content.length) {
          existing.entry = entry
        }
        return
      }

      candidateMap.set(key, {
        entry,
        semesters: new Set([semester])
      })
    })
  })

  return candidateMap
}

const getSortedBranchMatches = ({ subjectName, semester, branch }) => {
  const hasExplicitSemester = semester !== undefined && semester !== null && semester !== ""
  const semesterNumber = hasExplicitSemester ? Number(semester) : null
  const normalizedBranch = normalizeBranchName(branch || "Computer Science & Engineering")

  if (!normalizedBranch) {
    throw createLookupError("Invalid RTU branch selection")
  }

  if (hasExplicitSemester && (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8)) {
    throw createLookupError("Invalid semester for RTU syllabus lookup")
  }

  const semestersToSearch = hasExplicitSemester
    ? [semesterNumber]
    : [1, 2, 3, 4, 5, 6, 7, 8]

  const candidates = Array.from(buildSemesterCandidateMap(normalizedBranch, semestersToSearch).values())

  const sortedMatches = candidates
    .map(({ entry, semesters }) => ({
      ...entry,
      semesters: Array.from(semesters).sort((left, right) => left - right),
      score: scoreMatch(subjectName, entry.courseName)
    }))
    .sort((left, right) => right.score - left.score)

  return {
    normalizedBranch,
    hasExplicitSemester,
    sortedMatches
  }
}

const getSuggestionList = (sortedMatches, limit = 3) => {
  const suggestions = []

  sortedMatches.forEach((match) => {
    if (suggestions.length >= limit || match.score < 45) {
      return
    }

    const alreadyIncluded = suggestions.some((suggestion) =>
      suggestion.courseCode === match.courseCode || suggestion.courseName === match.courseName
    )

    if (alreadyIncluded) {
      return
    }

    suggestions.push({
      courseName: match.courseName,
      courseCode: match.courseCode,
      semester: match.semesters[0]
    })
  })

  return suggestions
}

const formatSuggestionsSuffix = (suggestions = []) => {
  if (!suggestions.length) {
    return ""
  }

  const formatted = suggestions
    .map((suggestion) => `${suggestion.courseName} (${suggestion.courseCode || "No code"}, Semester ${suggestion.semester})`)
    .join(", ")

  return ` Suggestions: ${formatted}.`
}

const isGenericSuggestion = (courseName = "") => {
  const normalizedName = normalizeText(courseName)

  return (
    normalizedName.length < 6 ||
    normalizedName === "project" ||
    normalizedName === "seminar" ||
    normalizedName.includes("open elective") ||
    normalizedName.includes("industrial training") ||
    normalizedName.includes("social outreach") ||
    normalizedName.includes("extra curricular")
  )
}

export const getRtuSubjectSuggestions = ({ subjectName, semester, branch, limit = 3 }) => {
  const { sortedMatches } = getSortedBranchMatches({ subjectName, semester, branch })
  return getSuggestionList(
    sortedMatches.filter((match) => !isGenericSuggestion(match.courseName) && match.score >= 55),
    limit
  )
}

export const findRtuSubjectMatch = ({ subjectName, semester, branch }) => {
  const { normalizedBranch, hasExplicitSemester, sortedMatches } = getSortedBranchMatches({
    subjectName,
    semester,
    branch
  })

  const bestMatch = sortedMatches[0]
  if (!bestMatch || bestMatch.score < 65) {
    return null
  }

  const competingMatch = sortedMatches[1]
  const suggestions = getSuggestionList(
    sortedMatches.filter((match) => !isGenericSuggestion(match.courseName) && match.score >= 55)
  )

  if (
    !hasExplicitSemester &&
    competingMatch &&
    bestMatch.score >= 80 &&
    competingMatch.score >= 80 &&
    bestMatch.score - competingMatch.score <= 2 &&
    bestMatch.normalizedName !== competingMatch.normalizedName
  ) {
    throw createLookupError(
      `Subject name "${subjectName}" is ambiguous in RTU ${normalizedBranch}. Use a more official subject name.${formatSuggestionsSuffix(suggestions)}`,
      400,
      suggestions
    )
  }

  const inferredSemester = bestMatch.semesters[0]

  return {
    university: "RTU",
    branch: normalizedBranch,
    semester: inferredSemester,
    courseName: bestMatch.courseName,
    courseCode: bestMatch.courseCode,
    syllabusContent: bestMatch.content,
    syllabusContext: bestMatch.content.slice(0, MAX_CONTEXT_CHARS),
    syllabusSourceFile: bestMatch.sourceFile
  }
}
