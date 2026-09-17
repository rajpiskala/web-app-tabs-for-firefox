(function registerWebAppTabs(root) {
  "use strict";

  const browserApi = root.browser;
  const api = root.WebAppTabs;
  const COMMAND_NAME = "open-web-app-tab";
  const MENU_ID = "open-web-app-tab-in-current-window";
  const MESSAGE_TYPE = "open-web-app-tab";

  async function openFrom(tab) {
    return api.openWebAppTab(browserApi, tab);
  }

  function report(error) {
    console.error("[Web App Tabs for Firefox]", error);
  }

  browserApi.runtime.onInstalled.addListener(() => {
    void browserApi.menus.removeAll()
      .then(() => browserApi.menus.create({
        id: MENU_ID,
        title: "Open another tab in this window",
        contexts: ["page"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
      }))
      .catch(report);
  });

  browserApi.commands.onCommand.addListener(command => {
    if (command === COMMAND_NAME) {
      void openFrom().catch(report);
    }
  });

  browserApi.menus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ID) {
      void openFrom(tab).catch(report);
    }
  });

  browserApi.runtime.onMessage.addListener(message => {
    if (!message || message.type !== MESSAGE_TYPE) {
      return undefined;
    }

    return openFrom()
      .then(() => ({ ok: true }))
      .catch(error => {
        report(error);
        return { ok: false, error: error.message };
      });
  });
})(globalThis);
