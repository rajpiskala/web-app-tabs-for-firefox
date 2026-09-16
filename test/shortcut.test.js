"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  eventToShortcut,
  formatShortcut,
  normalizeKey
} = require("../src/shortcut.js");

function keyboardEvent(key, modifiers = {}) {
  return {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...modifiers
  };
}

test("normalizes Firefox-supported command keys", () => {
  assert.equal(normalizeKey("g"), "G");
  assert.equal(normalizeKey("7"), "7");
  assert.equal(normalizeKey("F14"), "F14");
  assert.equal(normalizeKey("ArrowLeft"), "Left");
  assert.equal(normalizeKey(","), "Comma");
  assert.equal(normalizeKey("Shift"), null);
  assert.equal(normalizeKey("?"), null);
});

test("records the default Alt+Shift shortcut", () => {
  assert.deepEqual(
    eventToShortcut(keyboardEvent("g", { altKey: true, shiftKey: true })),
    { shortcut: "Alt+Shift+G", error: null }
  );
});

test("records two primary modifiers in Firefox order", () => {
  assert.deepEqual(
    eventToShortcut(keyboardEvent("k", { ctrlKey: true, altKey: true })),
    { shortcut: "Ctrl+Alt+K", error: null }
  );
});

test("allows bare function keys", () => {
  assert.deepEqual(
    eventToShortcut(keyboardEvent("F13")),
    { shortcut: "F13", error: null }
  );
});

test("rejects unmodified characters and too many modifiers", () => {
  assert.match(eventToShortcut(keyboardEvent("g")).error, /Ctrl or Alt/);
  assert.match(
    eventToShortcut(keyboardEvent("g", {
      ctrlKey: true,
      altKey: true,
      shiftKey: true
    })).error,
    /at most two/
  );
});

test("formats stored command shortcuts for display", () => {
  assert.equal(formatShortcut("Alt+Shift+G"), "Alt + Shift + G");
  assert.equal(formatShortcut(""), "Not set");
});
