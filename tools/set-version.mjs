import { readFile, writeFile } from "node:fs/promises";

const nextVersion = process.argv[2];
if (!nextVersion || !/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  throw new Error("Usage: npm run version:set -- <major.minor.patch>");
}

async function updateJson(filename, update) {
  const value = JSON.parse(await readFile(filename, "utf8"));
  update(value);
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

await updateJson("package.json", value => {
  value.version = nextVersion;
});
await updateJson("src/manifest.json", value => {
  value.version = nextVersion;
});

try {
  await updateJson("package-lock.json", value => {
    value.version = nextVersion;
    if (value.packages?.[""]) {
      value.packages[""].version = nextVersion;
    }
  });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log(`Set package and extension version to ${nextVersion}.`);
