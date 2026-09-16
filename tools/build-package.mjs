import { createWriteStream } from "node:fs";
import { copyFile, lstat, mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import yazl from "yazl";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8")
);
const runtimeFiles = JSON.parse(
  await readFile(path.join(projectRoot, "tools/runtime-files.json"), "utf8")
);
const unpackedDirectory = path.join(projectRoot, "dist/firefox");
const packagesDirectory = path.join(projectRoot, "dist/packages");
const archivePath = path.join(
  packagesDirectory,
  `web-app-tabs-for-firefox-${packageJson.version}.zip`
);
const temporaryArchivePath = `${archivePath}.tmp`;
const fixedTimestamp = new Date("1980-01-01T00:00:00.000Z");

function archiveName(repositoryPath) {
  return repositoryPath.startsWith("src/")
    ? repositoryPath.slice("src/".length)
    : repositoryPath;
}

function validateFiles(files) {
  const repositoryPaths = new Set();
  const archivePaths = new Set();

  for (const file of files) {
    if (
      typeof file !== "string"
      || file.includes("\\")
      || path.isAbsolute(file)
      || path.posix.isAbsolute(file)
      || path.posix.normalize(file) !== file
      || file === ".."
      || file.startsWith("../")
    ) {
      throw new Error(`Unsafe runtime file path: ${String(file)}`);
    }
    if (repositoryPaths.has(file)) {
      throw new Error(`Duplicate runtime file path: ${file}`);
    }

    const outputPath = archiveName(file);
    if (archivePaths.has(outputPath)) {
      throw new Error(`Duplicate packaged file path: ${outputPath}`);
    }
    repositoryPaths.add(file);
    archivePaths.add(outputPath);
  }

  return [...repositoryPaths].sort();
}

const files = validateFiles(runtimeFiles);
await rm(unpackedDirectory, { force: true, recursive: true });
await mkdir(unpackedDirectory, { recursive: true });
await mkdir(packagesDirectory, { recursive: true });
await rm(temporaryArchivePath, { force: true });

const zipFile = new yazl.ZipFile();
const archiveCompleted = pipeline(
  zipFile.outputStream,
  createWriteStream(temporaryArchivePath, { flags: "wx" })
);
let zipEnded = false;

try {
  for (const file of files) {
    const absoluteSourcePath = path.resolve(projectRoot, file);
    const relativeOutputPath = archiveName(file);
    const absoluteOutputPath = path.join(unpackedDirectory, relativeOutputPath);

    if (!absoluteSourcePath.startsWith(`${projectRoot}${path.sep}`)) {
      throw new Error(`Runtime file escaped the project: ${file}`);
    }
    const details = await lstat(absoluteSourcePath);
    if (!details.isFile() || details.isSymbolicLink()) {
      throw new Error(`Runtime entry must be a regular file: ${file}`);
    }

    await mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await copyFile(absoluteSourcePath, absoluteOutputPath);
    zipFile.addFile(absoluteSourcePath, relativeOutputPath, {
      compress: true,
      mode: 0o100644,
      mtime: fixedTimestamp
    });
  }

  zipEnded = true;
  zipFile.end();
  await archiveCompleted;
  await rm(archivePath, { force: true });
  await rename(temporaryArchivePath, archivePath);
} catch (error) {
  if (!zipEnded) zipFile.end();
  await archiveCompleted.catch(() => {});
  await rm(temporaryArchivePath, { force: true });
  throw error;
}

console.log(
  `Built ${path.relative(projectRoot, archivePath)} from ${files.length} reviewed files.`
);
