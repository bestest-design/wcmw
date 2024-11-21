import { glob } from "glob"
import fs from "fs"
import path from "path"

// Define the build directory and target output
const buildDir = "_site/assets"
const targetFileName = "styles.css"
const targetPath = path.join(buildDir, targetFileName)

// Find the generated CSS file (assuming there's only one CSS file)
const cssFiles = glob.sync(`${buildDir}/*.css`)

if (cssFiles.length === 0) {
  console.error("No CSS file found in the build directory.")
  process.exit(0) // Exit the script
}

const sourceFile = cssFiles[0] // Take the first CSS file found

// Copy and rename the CSS file
fs.copyFileSync(sourceFile, targetPath)
console.log(`CSS file '${sourceFile}' copied to: '${targetPath}'`)
