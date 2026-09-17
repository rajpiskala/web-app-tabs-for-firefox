(function exposeTheme(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.WebAppTabsTheme = api;
  }

  if (typeof document !== "undefined") {
    api.initializeTheme();
  }
})(typeof globalThis === "object" ? globalThis : this, function createThemeApi() {
  "use strict";

  const STORAGE_KEY = "web-app-tabs-theme";
  const THEMES = new Set(["light", "dark"]);

  function getStoredTheme(storageRef) {
    try {
      const value = storageRef?.getItem(STORAGE_KEY);
      return THEMES.has(value) ? value : null;
    } catch {
      return null;
    }
  }

  function getPreferredTheme(matchMediaRef) {
    try {
      return matchMediaRef?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  }

  function applyTheme(documentRef, theme) {
    documentRef.documentElement.setAttribute("data-theme", theme);
    return theme;
  }

  function initializeTheme({
    documentRef = document,
    storageRef = globalThis.localStorage,
    matchMediaRef = globalThis.matchMedia?.bind(globalThis)
  } = {}) {
    const theme = getStoredTheme(storageRef) || getPreferredTheme(matchMediaRef);
    return applyTheme(documentRef, theme);
  }

  function toggleTheme({
    documentRef = document,
    storageRef = globalThis.localStorage,
    matchMediaRef = globalThis.matchMedia?.bind(globalThis)
  } = {}) {
    const current = documentRef.documentElement.getAttribute("data-theme")
      || getPreferredTheme(matchMediaRef);
    const next = current === "dark" ? "light" : "dark";

    try {
      storageRef?.setItem(STORAGE_KEY, next);
    } catch {
      // The popup can still switch themes for this session if storage is blocked.
    }

    return applyTheme(documentRef, next);
  }

  return {
    STORAGE_KEY,
    getPreferredTheme,
    getStoredTheme,
    initializeTheme,
    toggleTheme
  };
});
