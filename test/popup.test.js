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

  async dispatch(type, event = {}) {
    return this.listeners.get(type)?.(event);
  }
}

class FakeDocument {
  constructor() {
    this.elements = new Map([
      "openTab",
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
