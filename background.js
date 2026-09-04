(function registerChatGptPwaTabs(root) {
  "use strict";

  const browserApi = root.browser;
  const api = root.ChatGptPwaTabs;
  const MENU_ID = "open-chatgpt-tab-in-current-window";

  async function openFrom(tab) {
    try {
      await api.openChatGptTab(browserApi, tab);
    } catch (error) {
      console.error("[ChatGPT PWA Tabs]", error);
    }
  }

  browserApi.runtime.onInstalled.addListener(() => {
    browserApi.menus.create({
      id: MENU_ID,
      title: "Open a new ChatGPT tab in this window",
      contexts: ["page"],
      documentUrlPatterns: ["https://chatgpt.com/*"]
    });
  });

  browserApi.commands.onCommand.addListener(command => {
    if (command === "open-chatgpt-tab") {
      void openFrom();
    }
  });

  browserApi.action.onClicked.addListener(tab => {
    void openFrom(tab);
  });

  browserApi.menus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ID) {
      void openFrom(tab);
    }
  });
})(globalThis);
