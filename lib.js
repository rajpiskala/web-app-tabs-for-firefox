(function exposeChatGptPwaTabs(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatGptPwaTabs = api;
  }
})(typeof globalThis === "object" ? globalThis : this, function createApi() {
  "use strict";

  const CHATGPT_HOME = "https://chatgpt.com/";

  function isChatGptUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "chatgpt.com";
    } catch {
      return false;
    }
  }

  function requireChatGptTab(tab) {
    if (!tab || !Number.isInteger(tab.id) || !Number.isInteger(tab.windowId)) {
      throw new Error("Firefox did not provide an active browser tab.");
    }

    if (!isChatGptUrl(tab.url)) {
      throw new Error(
        "Focus a chatgpt.com tab before using ChatGPT PWA Tabs."
      );
    }

    return tab;
  }

  async function getActiveTab(browserApi) {
    const tabs = await browserApi.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    return requireChatGptTab(tabs[0]);
  }

  async function openChatGptTab(browserApi, candidateTab) {
    const sourceTab = candidateTab
      ? requireChatGptTab(candidateTab)
      : await getActiveTab(browserApi);

    const createProperties = {
      windowId: sourceTab.windowId,
      url: CHATGPT_HOME,
      active: true,
      openerTabId: sourceTab.id
    };

    if (Number.isInteger(sourceTab.index)) {
      createProperties.index = sourceTab.index + 1;
    }

    const createdTab = await browserApi.tabs.create(createProperties);

    if (createdTab.windowId !== sourceTab.windowId) {
      throw new Error(
        "Firefox created the tab in a different window instead of the ChatGPT window."
      );
    }

    return createdTab;
  }

  return {
    CHATGPT_HOME,
    getActiveTab,
    isChatGptUrl,
    openChatGptTab,
    requireChatGptTab
  };
});
