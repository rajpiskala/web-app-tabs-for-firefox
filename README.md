# PWA Tabs for Firefox

A minimal Firefox WebExtension that opens another tab inside the currently
focused Firefox window. Its intended use is Firefox's native **Add tab to
taskbar** web-app windows.

Firefox normally routes new-tab actions away from native web-app windows. This
extension supplies the current window's exact `windowId` to the WebExtension
Tabs API, which allows Firefox to add the tab to that window and reveal its
normally hidden tab strip.

The approach was verified with a ChatGPT native web app on Firefox 154.0.1.

## Load temporarily in Firefox

1. Keep this folder on disk.
2. In a normal Firefox window, open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on...**.
4. Choose this folder's `manifest.json` file.
5. Open or focus any native Firefox web app created with **Add tab to taskbar**.
6. Press **Alt+Shift+G**.

Expected result: Firefox opens another tab beside the existing tab in the same
web-app window and reveals the tab strip. Use the shortcut again for every
additional tab.

Two alternative triggers are also included:

- Click the extension's toolbar button if Firefox shows it in the web-app
  window.
- Right-click the web-app page and choose **Open another PWA tab in this
  window**.

Firefox's built-in **Ctrl+T** still targets the main browser window. If the
suggested shortcut conflicts with another extension, open `about:addons`, click
the gear button, select **Manage Extension Shortcuts**, and assign another key.

## Which URL opens?

- ChatGPT always opens `https://chatgpt.com/`, producing a fresh chat.
- Other PWAs duplicate the current page URL. This is the safest generic
  behavior because Firefox does not expose the native web app's registered
  start URL through the WebExtension API.

Invoking the extension from a normal HTTP or HTTPS Firefox tab also opens the
new tab in that normal window. Firefox does not expose whether a window is a
native Taskbar-Tab window to extensions.

## What to report from a live test

- If a second tab appears in the web-app window, the experiment worked.
- If a new tab appears in the normal Firefox window, Firefox ignored the target
  web-app `windowId` in that Firefox build.
- If nothing happens, return to `about:debugging#/runtime/this-firefox`, find
  **PWA Tabs for Firefox**, click **Inspect**, and copy the line beginning with
  `[PWA Tabs for Firefox]` from the extension console.

## Temporary-extension limitation

Firefox removes temporary extensions when it exits. For a permanent
installation, package and sign the extension through Mozilla Add-ons as an
unlisted extension, or publish it publicly after completing broader testing.

## Permissions and privacy

- `activeTab`: lets the extension read the current tab's URL only when the user
  explicitly invokes the extension.
- `menus`: adds the page context-menu fallback.

The extension has no content script, stores no data, and sends no network
requests of its own.

## Development checks

With Node.js installed:

```text
npm test
npm run check
```
