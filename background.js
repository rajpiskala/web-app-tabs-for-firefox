(function registerFirefoxPwaTabs(root) {
  "use strict";

  const browserApi = root.browser;
  const api = root.FirefoxPwaTabs;
  const MENU_ID = "open-pwa-tab-in-current-window";

  async function openFrom(tab) {
    try {
      await api.openPwaTab(browserApi, tab);
    } catch (error) {
      console.error("[PWA Tabs for Firefox]", error);
    }
  }

  browserApi.runtime.onInstalled.addListener(() => {
    browserApi.menus.create({
      id: MENU_ID,
      title: "Open another PWA tab in this window",
      contexts: ["page"],
      documentUrlPatterns: ["http://*/*", "https://*/*"]
    });
  });

  browserApi.commands.onCommand.addListener(command => {
    if (command === "open-pwa-tab") {
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
