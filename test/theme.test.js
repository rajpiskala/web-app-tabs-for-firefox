"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STORAGE_KEY,
  getPreferredTheme,
  getStoredTheme,
  initializeTheme,
  toggleTheme
} = require("../src/theme.js");

function makeDocument() {
  const attributes = new Map();
  return {
    documentElement: {
      getAttribute(name) {
        return attributes.get(name) || null;
      },
      setAttribute(name, value) {
        attributes.set(name, value);
      }
    }
  };
}

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

test("uses the system preference until the user chooses a theme", () => {
  const documentRef = makeDocument();
  const storageRef = makeStorage();
  const theme = initializeTheme({
    documentRef,
    storageRef,
    matchMediaRef() {
      return { matches: true };
    }
  });

  assert.equal(theme, "dark");
  assert.equal(documentRef.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(getStoredTheme(storageRef), null);
});

test("persists an explicit light-mode choice locally", () => {
  const documentRef = makeDocument();
  const storageRef = makeStorage({ [STORAGE_KEY]: "dark" });

  initializeTheme({ documentRef, storageRef });
  assert.equal(toggleTheme({ documentRef, storageRef }), "light");
  assert.equal(getStoredTheme(storageRef), "light");
});

test("falls back to light mode if media-query access is unavailable", () => {
  assert.equal(getPreferredTheme(undefined), "light");
});
