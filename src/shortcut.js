(function exposeShortcutTools(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.WebAppTabsShortcut = api;
  }
})(typeof globalThis === "object" ? globalThis : this, function createShortcutTools() {
  "use strict";

  const SPECIAL_KEYS = new Map([
    [",", "Comma"],
    [".", "Period"],
    [" ", "Space"],
    ["ArrowUp", "Up"],
    ["ArrowDown", "Down"],
    ["ArrowLeft", "Left"],
    ["ArrowRight", "Right"],
    ["PageUp", "PageUp"],
    ["PageDown", "PageDown"],
    ["Home", "Home"],
    ["End", "End"],
    ["Insert", "Insert"],
    ["Delete", "Delete"]
  ]);

  const MODIFIER_KEYS = new Set([
    "Alt",
    "AltGraph",
    "Control",
    "Meta",
    "Shift"
  ]);

  function normalizeKey(key) {
    if (typeof key !== "string" || MODIFIER_KEYS.has(key)) {
      return null;
    }

    if (/^[a-z]$/i.test(key)) {
      return key.toUpperCase();
    }

    if (/^[0-9]$/.test(key)) {
      return key;
    }

    if (/^F(?:[1-9]|1[0-9])$/.test(key)) {
      return key;
    }

    return SPECIAL_KEYS.get(key) || null;
  }

  function eventToShortcut(event) {
    const key = normalizeKey(event.key);
    if (!key) {
      return { shortcut: null, error: null };
    }

    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.metaKey) modifiers.push("Command");
    if (event.shiftKey) modifiers.push("Shift");

    const isFunctionKey = /^F(?:[1-9]|1[0-9])$/.test(key);
    if (modifiers.length === 0 && !isFunctionKey) {
      return {
        shortcut: null,
        error: "Include Ctrl or Alt with the key."
      };
    }

    if (modifiers.length > 2) {
      return {
        shortcut: null,
        error: "Firefox shortcuts support at most two modifier keys."
      };
    }

    if (
      modifiers.length > 0
      && !modifiers.some(modifier =>
        modifier === "Ctrl" || modifier === "Alt" || modifier === "Command"
      )
    ) {
      return {
        shortcut: null,
        error: "Shift cannot be the only modifier; include Ctrl or Alt."
      };
    }

    return {
      shortcut: [...modifiers, key].join("+"),
      error: null
    };
  }

  function formatShortcut(shortcut) {
    return shortcut ? shortcut.replaceAll("+", " + ") : "Not set";
  }

  return {
    eventToShortcut,
    formatShortcut,
    normalizeKey
  };
});
