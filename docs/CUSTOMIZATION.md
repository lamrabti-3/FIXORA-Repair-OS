# FIXORA customization guide

## Branding

Change the visible brand in `index.html`, `manifest.webmanifest`, `capacitor.config.json`, and the privacy/store documents.

## Colors

CSS variables live at the top of `src/styles.css`:

- `--bg` background
- `--panel` panel surface
- `--line` borders
- `--text` primary text
- `--accent` main red
- `--good` positive state
- `--warn` warning state
- `--bad` destructive/error state

## Navigation

Edit `NAV` in `src/app.js`. Each item has `id`, `label`, `sub`, and `icon`.

Add a route by:
1. Adding the nav entry.
2. Adding the route to the `render()` mapping.
3. Creating a `renderYourPage()` function.
4. Adding action handlers to `onClick/onInput/onChange` if needed.

## Adding data fields

1. Add the input to the relevant modal.
2. Read it through `FormData`.
3. Store it on the object.
4. Update list/detail rendering.
5. Update export/import expectations if the field is required for migration.

## Native Android

The website is the source of truth. Capacitor wraps the same web files. If you add a native plugin, document why it is needed and what permission it introduces.

## Safe release practice

Increment `APP.version` and the package version before a production release. Never commit a production signing keystore or password.
