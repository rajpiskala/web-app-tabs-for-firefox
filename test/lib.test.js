"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CHATGPT_HOME,
  getActiveTab,
  isChatGptUrl,
  openChatGptTab,
  requireChatGptTab
} = require("../lib.js");

test("recognizes only secure chatgpt.com pages", () => {
  assert.equal(isChatGptUrl("https://chatgpt.com/"), true);
  assert.equal(isChatGptUrl("https://chatgpt.com/c/123"), true);
  assert.equal(isChatGptUrl("http://chatgpt.com/"), false);
  assert.equal(isChatGptUrl("https://notchatgpt.com/"), false);
  assert.equal(isChatGptUrl("not a URL"), false);
});

test("rejects missing and non-ChatGPT tabs", () => {
  assert.throws(() => requireChatGptTab(), /active browser tab/);
  assert.throws(
    () => requireChatGptTab({ id: 1, windowId: 2, url: "https://example.com/" }),
    /Focus a chatgpt.com tab/
  );
});

test("queries the active tab in the last-focused window", async () => {
  const expected = {
    id: 7,
    windowId: 19,
    index: 0,
    url: "https://chatgpt.com/"
  };
  let receivedQuery;
  const browserApi = {
    tabs: {
      async query(query) {
        receivedQuery = query;
        return [expected];
      }
    }
  };

  assert.equal(await getActiveTab(browserApi), expected);
  assert.deepEqual(receivedQuery, {
    active: true,
    lastFocusedWindow: true
  });
});

test("creates a fresh ChatGPT tab beside the source tab in the same window", async () => {
  const source = {
    id: 7,
    windowId: 19,
    index: 2,
    url: "https://chatgpt.com/c/123"
  };
  let receivedProperties;
  const browserApi = {
    tabs: {
      async create(properties) {
        receivedProperties = properties;
        return { id: 8, windowId: properties.windowId, index: properties.index };
      }
    }
  };

  const created = await openChatGptTab(browserApi, source);

  assert.equal(created.windowId, source.windowId);
  assert.deepEqual(receivedProperties, {
    windowId: 19,
    url: CHATGPT_HOME,
    active: true,
    openerTabId: 7,
    index: 3
  });
});

test("fails loudly if Firefox routes the new tab into another window", async () => {
  const source = {
    id: 7,
    windowId: 19,
    index: 0,
    url: "https://chatgpt.com/"
  };
  const browserApi = {
    tabs: {
      async create() {
        return { id: 8, windowId: 20, index: 0 };
      }
    }
  };

  await assert.rejects(
    openChatGptTab(browserApi, source),
    /different window/
  );
});
