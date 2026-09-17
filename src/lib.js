(function exposeWebAppTabs(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.WebAppTabs = api;
  }
})(typeof globalThis === "object" ? globalThis : this, function createApi() {
  "use strict";

  const START_URL_OVERRIDES = new Map([
    ["chatgpt.com", "https://chatgpt.com/"]
  ]);

  function parseWebUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url : null;
    } catch {
      return null;
    }
  }

  function isWebUrl(value) {
    return parseWebUrl(value) !== null;
  }

  function getNewTabUrl(value) {
    const url = parseWebUrl(value);
    if (!url) {
      return null;
    }

    return START_URL_OVERRIDES.get(url.hostname) || url.href;
  }

  function requireWebTab(tab) {
    if (!tab || !Number.isInteger(tab.id) || !Number.isInteger(tab.windowId)) {
      throw new Error("Firefox did not provide an active browser tab.");
    }

    if (!isWebUrl(tab.url)) {
      throw new Error(
        "Open an HTTP or HTTPS page first. Web App Tabs works in Firefox web-app windows and regular browser tabs, but not Firefox settings pages."
      );
    }

    return tab;
  }

  async function getActiveTab(browserApi) {
    const tabs = await browserApi.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    return requireWebTab(tabs[0]);
  }

  async function openWebAppTab(browserApi, candidateTab) {
    const sourceTab = candidateTab
      ? requireWebTab(candidateTab)
      : await getActiveTab(browserApi);
    const destinationUrl = getNewTabUrl(sourceTab.url);

    const createProperties = {
      windowId: sourceTab.windowId,
      url: destinationUrl,
      active: true,
      openerTabId: sourceTab.id
    };

    if (Number.isInteger(sourceTab.index)) {
      createProperties.index = sourceTab.index + 1;
    }

    const createdTab = await browserApi.tabs.create(createProperties);

    if (createdTab.windowId !== sourceTab.windowId) {
      throw new Error(
        "Firefox created the tab in a different window instead of the focused web-app window."
      );
    }

    return createdTab;
  }

  return {
    START_URL_OVERRIDES,
    getNewTabUrl,
    getActiveTab,
    isWebUrl,
    openWebAppTab,
    requireWebTab
  };
});
