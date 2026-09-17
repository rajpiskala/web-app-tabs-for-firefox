import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import yauzl from "yauzl";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const runtimeFiles = JSON.parse(
  await readFile("tools/runtime-files.json", "utf8")
);
const expectedFiles = runtimeFiles
  .map(file => file.startsWith("src/") ? file.slice(4) : file)
  .sort();

function readZip(filename) {
  return new Promise((resolve, reject) => {
    yauzl.open(
      filename,
      { lazyEntries: true, validateEntrySizes: true },
      (openError, zipFile) => {
        if (openError) {
          reject(openError);
          return;
        }

        const entries = new Map();
        zipFile.on("error", reject);
        zipFile.on("end", () => resolve(entries));
        zipFile.on("entry", entry => {
          const normalized = path.posix.normalize(entry.fileName);
          if (
            path.posix.isAbsolute(entry.fileName)
            || entry.fileName.includes("\\")
            || normalized === ".."
            || normalized.startsWith("../")
          ) {
            reject(new Error(`Unsafe ZIP entry: ${entry.fileName}`));
            return;
          }
          if (entries.has(entry.fileName)) {
            reject(new Error(`Duplicate ZIP entry: ${entry.fileName}`));
            return;
          }
          if (entry.fileName.endsWith("/")) {
            zipFile.readEntry();
            return;
          }

          zipFile.openReadStream(entry, (streamError, stream) => {
            if (streamError) {
              reject(streamError);
              return;
            }
            const chunks = [];
            stream.on("error", reject);
            stream.on("data", chunk => chunks.push(chunk));
            stream.on("end", () => {
              entries.set(entry.fileName, Buffer.concat(chunks));
              zipFile.readEntry();
            });
          });
        });
        zipFile.readEntry();
      }
    );
  });
}

async function listFiles(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true
  });
  const files = [];

  for (const entry of entries) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listFiles(directory, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files.sort();
}

assert.equal(packageJson.license, "MPL-2.0");
assert.equal(new Set(expectedFiles).size, expectedFiles.length);

const manifest = JSON.parse(await readFile("dist/firefox/manifest.json", "utf8"));
assert.equal(manifest.name, "Web App Tabs for Firefox");
assert.equal(manifest.version, packageJson.version);
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, "143.0");
assert.deepEqual(
  manifest.browser_specific_settings.gecko.data_collection_permissions,
  { required: ["none"] }
);
assert.deepEqual(manifest.permissions, ["activeTab", "menus"]);
assert.equal("host_permissions" in manifest, false);
assert.equal(manifest.action.default_popup, "popup.html");

const unpackedFiles = await listFiles("dist/firefox");
assert.deepEqual(unpackedFiles, expectedFiles);

const zipPath = `dist/packages/web-app-tabs-for-firefox-${packageJson.version}.zip`;
const archivedFiles = await readZip(zipPath);
assert.deepEqual([...archivedFiles.keys()].sort(), expectedFiles);

for (const file of expectedFiles) {
  const unpackedFile = await readFile(path.join("dist/firefox", file));
  assert.equal(
    archivedFiles.get(file).equals(unpackedFile),
    true,
    `${file} must be byte-identical in the ZIP and unpacked build`
  );
}

for (const file of [
  "background.js",
  "lib.js",
  "popup.js",
  "shortcut.js",
  "theme.js"
]) {
  const contents = archivedFiles.get(file).toString("utf8");
  assert.doesNotMatch(contents, /\b(?:eval|Function|importScripts)\s*\(/);
}

assert.doesNotMatch(
  archivedFiles.get("popup.html").toString("utf8"),
  /<script[^>]+src=["']https?:\/\//i
);

console.log(
  "Verified manifest policy fields, exact package allowlist, and ZIP/unpacked parity."
);
