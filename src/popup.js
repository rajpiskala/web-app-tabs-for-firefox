(function exposePopup(root, factory) {
  const shortcutTools = typeof module === "object" && module.exports
    ? require("./shortcut.js")
    : root.WebAppTabsShortcut;
  const themeTools = typeof module === "object" && module.exports
    ? require("./theme.js")
    : root.WebAppTabsTheme;
  const api = factory(shortcutTools, themeTools);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.WebAppTabsPopup = api;
  }
})(typeof globalThis === "object" ? globalThis : this, function createPopupApi(
  shortcutTools,
  themeTools
) {
  "use strict";

  const COMMAND_NAME = "open-web-app-tab";
  const MESSAGE_TYPE = "open-web-app-tab";

  async function initializePopup({
    documentRef = document,
    browserApi = browser,
    closePopup = () => window.close(),
    storageRef = globalThis.localStorage,
    matchMediaRef = globalThis.matchMedia?.bind(globalThis)
  } = {}) {
    const openButton = documentRef.getElementById("openTab");
    const themeButton = documentRef.getElementById("themeToggle");
    const themeIcon = documentRef.getElementById("themeIcon");
    const themeLabel = documentRef.getElementById("themeLabel");
    const shortcutButton = documentRef.getElementById("shortcut");
    const clearButton = documentRef.getElementById("clearShortcut");
    const resetButton = documentRef.getElementById("resetShortcut");
    const manageButton = documentRef.getElementById("manageShortcuts");
    const status = documentRef.getElementById("status");
    let shortcut = "";
    let recording = false;
    let pending = false;
    let theme = themeTools.initializeTheme({
      documentRef,
      storageRef,
      matchMediaRef
    });

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle("error", isError);
    }

    function render() {
      const nextTheme = theme === "dark" ? "light" : "dark";
      themeIcon.textContent = nextTheme === "light" ? "☀" : "☾";
      themeLabel.textContent = nextTheme === "light" ? "Light" : "Dark";
      themeButton.setAttribute("aria-label", `Use ${nextTheme} mode`);
      themeButton.setAttribute("title", `Use ${nextTheme} mode`);

      shortcutButton.textContent = recording
        ? "Press a key combination…"
        : shortcutTools.formatShortcut(shortcut);
      shortcutButton.classList.toggle("recording", recording);
      shortcutButton.setAttribute("aria-pressed", String(recording));

      for (const button of [
        openButton,
        shortcutButton,
        clearButton,
        resetButton,
        manageButton
      ]) {
        button.disabled = pending;
      }

      clearButton.disabled = pending || !shortcut;
    }

    async function loadShortcut() {
      const commands = await browserApi.commands.getAll();
      const command = commands.find(item => item.name === COMMAND_NAME);
      if (!command) {
        throw new Error("The web app tab command is unavailable.");
      }
      shortcut = command.shortcut || "";
    }

    async function saveShortcut(nextShortcut, successMessage) {
      pending = true;
      recording = false;
      render();

      try {
        await browserApi.commands.update({
          name: COMMAND_NAME,
          shortcut: nextShortcut
        });
        await loadShortcut();
        setStatus(successMessage);
      } catch (error) {
        setStatus(`Could not save shortcut: ${error.message}`, true);
      } finally {
        pending = false;
        render();
      }
    }

    async function openTab() {
      if (pending) return;
      pending = true;
      render();
      setStatus("Opening another tab…");

      try {
        const response = await browserApi.runtime.sendMessage({
          type: MESSAGE_TYPE
        });
        if (!response || !response.ok) {
          throw new Error(response?.error || "Firefox did not open the tab.");
        }
        closePopup();
      } catch (error) {
        pending = false;
        render();
        setStatus(error.message, true);
      }
    }

    function startRecording() {
      if (pending) return;
      recording = true;
      render();
      setStatus("Press Escape to cancel.");
    }

    async function handleKeydown(event) {
      if (!recording || pending) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        recording = false;
        render();
        setStatus("Shortcut change cancelled.");
        return;
      }

      const result = shortcutTools.eventToShortcut(event);
      if (result.error) {
        setStatus(result.error, true);
        return;
      }
      if (!result.shortcut) return;

      await saveShortcut(
        result.shortcut,
        `Saved ${shortcutTools.formatShortcut(result.shortcut)}.`
      );
    }

    function toggleTheme() {
      theme = themeTools.toggleTheme({
        documentRef,
        storageRef,
        matchMediaRef
      });
      render();
    }

    async function clearShortcut() {
      if (pending) return;
      await saveShortcut("", "Shortcut cleared.");
    }

    async function resetShortcut() {
      if (pending) return;
      pending = true;
      recording = false;
      render();

      try {
        await browserApi.commands.reset(COMMAND_NAME);
        await loadShortcut();
        setStatus("Reset to the default shortcut.");
      } catch (error) {
        setStatus(`Could not reset shortcut: ${error.message}`, true);
      } finally {
        pending = false;
        render();
      }
    }

    async function manageShortcuts() {
      try {
        await browserApi.commands.openShortcutSettings();
        closePopup();
      } catch (error) {
        setStatus(`Could not open Firefox shortcut settings: ${error.message}`, true);
      }
    }

    openButton.addEventListener("click", openTab);
    themeButton.addEventListener("click", toggleTheme);
    shortcutButton.addEventListener("click", startRecording);
    clearButton.addEventListener("click", clearShortcut);
    resetButton.addEventListener("click", resetShortcut);
    manageButton.addEventListener("click", manageShortcuts);
    documentRef.addEventListener("keydown", handleKeydown);

    try {
      await loadShortcut();
    } catch (error) {
      setStatus(`Could not load shortcut: ${error.message}`, true);
    }
    render();
  }

  return { COMMAND_NAME, MESSAGE_TYPE, initializePopup };
});

if (typeof document !== "undefined" && typeof browser !== "undefined") {
  void globalThis.WebAppTabsPopup.initializePopup();
}
