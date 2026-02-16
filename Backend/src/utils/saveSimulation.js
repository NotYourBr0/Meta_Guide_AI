import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const saveSimulationFile = (topicId, htmlContent) => {
  const simulationsDir = path.join(__dirname, "../../public/simulations")

  if (!fs.existsSync(simulationsDir)) {
    fs.mkdirSync(simulationsDir, { recursive: true })
  }

  const filePath = path.join(simulationsDir, `${topicId}.html`)

  fs.writeFileSync(filePath, htmlContent, "utf-8")

  return `/simulations/${topicId}.html`
}
