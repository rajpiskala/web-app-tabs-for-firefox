<div align="center">
  <img src="src/icons/icon.svg" alt="" width="96" height="96">
  <h1>Web App Tabs for Firefox</h1>
  <p>Multiple tabs, one native Firefox web-app window.</p>
</div>

Firefox web apps intentionally hide their tab strip and send normal new-tab
actions to the main browser window. This small Firefox-only extension opens a
tab against the focused window's exact `windowId`, which makes Firefox reveal
its existing tab strip inside the web-app window.

It works with any HTTP or HTTPS site added using Firefox's **Add tab to
taskbar** feature, including sites commonly described as PWAs. ChatGPT gets a
small convenience override so every new tab starts a fresh chat; other sites
duplicate the current page URL because Firefox does not expose a web app's
registered start URL to extensions.

In an ordinary Firefox window, that same URL behavior is also a convenient way
to reopen the current page in a new tab. This is a fresh page load, not a clone
of the original tab's history, scroll position, or unsaved form state. ChatGPT
keeps its fresh-chat override in both window types.

## Use it

Focus a native Firefox web-app window, then either:

- Press **Alt+Shift+G**.
- Click the extension button and choose **Open another tab**.
- Right-click the page and choose **Open another tab in this window**.

The button and shortcut also work in ordinary HTTP or HTTPS tabs, where they
reopen the current page in another tab.

Click the extension button to record a different shortcut, clear it, reset the
default, open Firefox's full extension-shortcut settings, or switch the popup
between light and dark mode. Firefox will not activate a combination already
reserved by Firefox or another extension.

Not sure whether you are in the right window? A Firefox web app is a site you
added with **Add tab to taskbar** and launched from that site's standalone icon
on the Windows taskbar. The popup includes a **What counts as a web app?**
explanation. The extension adds tabs to that app-style window; it does not turn
a regular Firefox tab into a web app. In a regular window, it simply provides
the page-reopening shortcut described above.

Firefox's built-in **Ctrl+T** still targets the main browser window. The
extension cannot replace that browser-owned behavior.

## Compatibility

- Firefox 143 or newer.
- Windows, because native Firefox web apps are currently a Windows-only
  feature.
- Regular HTTP and HTTPS tabs are supported as a convenient reopen-this-page
  shortcut. Firefox does not expose a reliable web-app-window flag, so the
  extension uses the appropriate same-window behavior in either context.

This relies on current Firefox behavior rather than a documented web-app tabs
feature. A future Firefox release could change it. See the
[policy and platform review](docs/policy-review.md) for the technical details.

## Privacy and permissions

The extension stores only the popup's light/dark preference locally. It contains
no analytics or content scripts and sends no network requests of its own. See
[PRIVACY.md](PRIVACY.md).

- `activeTab` lets it read the current page URL after an explicit user action.
- `menus` adds the page context-menu fallback.

It does not request site-wide access, browsing history, cookies, or the broad
`tabs` permission.

## Local development

```text
npm ci
npm run check
npm run release
```

`npm run release` lints the extension with Mozilla's official tooling, runs
the tests, builds the exact reviewed runtime files, and verifies the package.
The AMO-ready ZIP is written to `dist/packages/` and the unpacked build to
`dist/firefox/`.

For temporary installation, open `about:debugging#/runtime/this-firefox`,
choose **Load Temporary Add-on**, and select `src/manifest.json` (or the
manifest in `dist/firefox/` after a build).

See [docs/publishing.md](docs/publishing.md) for the one-time AMO setup and
one-command release flow.

## Independence

Web App Tabs for Firefox is an independent extension and is not produced,
sponsored, or endorsed by Mozilla. Firefox is a trademark of the Mozilla
Foundation in the U.S. and other countries.

## License

[Mozilla Public License 2.0](LICENSE)
