# ChatGPT PWA Tabs

A minimal Firefox WebExtension that asks Firefox to open a fresh ChatGPT tab
inside the currently focused ChatGPT window. Its intended use is Firefox's
native **Add tab to taskbar** web-app window.

This is an experiment against behavior that Mozilla does not officially
support. Firefox's own Bugzilla history confirms that a native web-app window
can display a tab strip when a second tab exists, but Mozilla routes ordinary
new-tab actions away from those windows. This extension tests whether the
WebExtension Tabs API can deliberately create that second tab.

## Load temporarily in Firefox

1. Keep this folder on disk.
2. In a normal Firefox window, open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on...**.
4. Choose this folder's `manifest.json` file.
5. Open or focus the native ChatGPT web app created with **Add tab to taskbar**.
6. Press **Ctrl+Shift+Y**.

Expected result: Firefox opens `https://chatgpt.com/` beside the existing tab
in the same web-app window, and Firefox reveals the tab strip. Use the same
shortcut for every additional ChatGPT tab.

Two alternative triggers are also included:

- Click the extension's toolbar button if Firefox shows it in the web-app
  window.
- Right-click the ChatGPT page and choose **Open a new ChatGPT tab in this
  window**.

Firefox's built-in **Ctrl+T** still targets the main browser window. If the
suggested shortcut conflicts with another extension, open `about:addons`, click
the gear button, select **Manage Extension Shortcuts**, and assign another key.

## What to report from the first live test

- If a second tab appears in the ChatGPT web-app window, the experiment worked.
- If a new tab appears in the normal Firefox window, Firefox ignored the target
  web-app `windowId` and the native approach is blocked in that Firefox build.
- If nothing happens, return to `about:debugging#/runtime/this-firefox`, find
  **ChatGPT PWA Tabs**, click **Inspect**, and copy the line beginning with
  `[ChatGPT PWA Tabs]` from the extension console.

## Temporary-extension limitation

Firefox removes temporary extensions when it exits. If the experiment works,
the next step is to package and sign it through Mozilla Add-ons as an unlisted
extension so it can remain installed across restarts.

## Permissions and privacy

- `activeTab`: lets the extension verify that the user invoked it from
  `https://chatgpt.com/`.
- `menus`: adds the ChatGPT page context-menu fallback.

The extension has no content script, reads no ChatGPT page content, stores no
data, and sends no network requests of its own.

## Development checks

With Node.js installed:

```text
npm test
npm run check
```
