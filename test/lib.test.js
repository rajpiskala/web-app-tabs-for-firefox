"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getActiveTab,
  getNewTabUrl,
  isWebUrl,
  openWebAppTab,
  requireWebTab
} = require("../src/lib.js");

test("recognizes HTTP and HTTPS web-app pages", () => {
  assert.equal(isWebUrl("https://chatgpt.com/"), true);
  assert.equal(isWebUrl("https://example.com/app"), true);
  assert.equal(isWebUrl("http://localhost:3000/"), true);
  assert.equal(isWebUrl("about:config"), false);
  assert.equal(isWebUrl("file:///tmp/index.html"), false);
  assert.equal(isWebUrl("not a URL"), false);
});

test("opens a fresh home page for sites with a start-URL override", () => {
  assert.equal(
    getNewTabUrl("https://chatgpt.com/c/123?model=test#latest"),
    "https://chatgpt.com/"
  );
});

test("reuses the current page URL for a generic PWA", () => {
  assert.equal(
    getNewTabUrl("https://example.com/app/dashboard?view=today#card"),
    "https://example.com/app/dashboard?view=today#card"
  );
});

test("rejects missing and non-web tabs", () => {
  assert.throws(() => requireWebTab(), /active browser tab/);
  assert.throws(
    () => requireWebTab({ id: 1, windowId: 2, url: "about:addons" }),
    /works in Firefox web-app windows and regular browser tabs/
  );
});

test("queries the active tab in the last-focused window", async () => {
  const expected = {
    id: 7,
    windowId: 19,
    index: 0,
    url: "https://example.com/app"
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

test("creates another PWA tab beside the source tab in the same window", async () => {
  const source = {
    id: 7,
    windowId: 19,
    index: 2,
    url: "https://example.com/app/dashboard"
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

  const created = await openWebAppTab(browserApi, source);

  assert.equal(created.windowId, source.windowId);
  assert.deepEqual(receivedProperties, {
    windowId: 19,
    url: "https://example.com/app/dashboard",
    active: true,
    openerTabId: 7,
    index: 3
  });
});

test("keeps ChatGPT's new-tab behavior pointed at a fresh chat", async () => {
  const source = {
    id: 7,
    windowId: 19,
    index: 0,
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

  await openWebAppTab(browserApi, source);
  assert.equal(receivedProperties.url, "https://chatgpt.com/");
});

test("fails loudly if Firefox routes the new tab into another window", async () => {
  const source = {
    id: 7,
    windowId: 19,
    index: 0,
    url: "https://example.com/app"
  };
  const browserApi = {
    tabs: {
      async create() {
        return { id: 8, windowId: 20, index: 0 };
      }
    }
  };

  await assert.rejects(openWebAppTab(browserApi, source), /different window/);
});
