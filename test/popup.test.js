"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { initializePopup } = require("../src/popup.js");

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    if (force) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor() {
    this.classList = new FakeClassList();
    this.disabled = false;
    this.listeners = new Map();
    this.textContent = "";
    this.attributes = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  async dispatch(type, event = {}) {
    return this.listeners.get(type)?.(event);
  }
}

class FakeDocument {
  constructor() {
    this.documentElement = new FakeElement();
    this.elements = new Map([
      "openTab",
      "themeToggle",
      "themeIcon",
      "themeLabel",
      "shortcut",
      "clearShortcut",
      "resetShortcut",
      "manageShortcuts",
      "status"
    ].map(id => [id, new FakeElement()]));
    this.listeners = new Map();
  }

  getElementById(id) {
    return this.elements.get(id);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  async dispatch(type, event) {
    return this.listeners.get(type)?.(event);
  }
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

function makeBrowserApi() {
  let currentShortcut = "Alt+Shift+G";
  const calls = { reset: [], update: [], messages: [], manage: 0 };

  return {
    calls,
    commands: {
      async getAll() {
        return [{ name: "open-web-app-tab", shortcut: currentShortcut }];
      },
      async update(details) {
        calls.update.push(details);
        currentShortcut = details.shortcut;
      },
      async reset(name) {
        calls.reset.push(name);
        currentShortcut = "Alt+Shift+G";
      },
      async openShortcutSettings() {
        calls.manage += 1;
      }
    },
    runtime: {
      async sendMessage(message) {
        calls.messages.push(message);
        return { ok: true };
      }
    }
  };
}

test("loads and edits Firefox's real extension command shortcut", async () => {
  const documentRef = new FakeDocument();
  const browserApi = makeBrowserApi();

  await initializePopup({ documentRef, browserApi, closePopup() {} });
  assert.equal(
    documentRef.getElementById("shortcut").textContent,
    "Alt + Shift + G"
  );

  await documentRef.getElementById("shortcut").dispatch("click");
  assert.equal(
    documentRef.getElementById("shortcut").classList.contains("recording"),
    true
  );

  await documentRef.dispatch("keydown", {
    key: "k",
    ctrlKey: true,
    altKey: true,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {}
  });

  assert.deepEqual(browserApi.calls.update, [{
    name: "open-web-app-tab",
    shortcut: "Ctrl+Alt+K"
  }]);
  assert.equal(
    documentRef.getElementById("shortcut").textContent,
    "Ctrl + Alt + K"
  );
});

test("toggles and remembers the popup color theme", async () => {
  const documentRef = new FakeDocument();
  const browserApi = makeBrowserApi();
  const storageRef = makeStorage({ "web-app-tabs-theme": "dark" });

  await initializePopup({
    documentRef,
    browserApi,
    storageRef,
    matchMediaRef() {
      return { matches: false };
    },
    closePopup() {}
  });

  assert.equal(documentRef.documentElement.getAttribute("data-theme"), "dark");
  assert.equal(documentRef.getElementById("themeLabel").textContent, "Light");
  assert.equal(
    documentRef.getElementById("themeToggle").attributes.get("aria-label"),
    "Use light mode"
  );

  await documentRef.getElementById("themeToggle").dispatch("click");

  assert.equal(documentRef.documentElement.getAttribute("data-theme"), "light");
  assert.equal(documentRef.getElementById("themeLabel").textContent, "Dark");
  assert.equal(storageRef.getItem("web-app-tabs-theme"), "light");
});

test("opens a web-app tab from the popup", async () => {
  const documentRef = new FakeDocument();
  const browserApi = makeBrowserApi();
  let closed = false;

  await initializePopup({
    documentRef,
    browserApi,
    closePopup() {
      closed = true;
    }
  });
  await documentRef.getElementById("openTab").dispatch("click");

  assert.deepEqual(browserApi.calls.messages, [{ type: "open-web-app-tab" }]);
  assert.equal(closed, true);
});
