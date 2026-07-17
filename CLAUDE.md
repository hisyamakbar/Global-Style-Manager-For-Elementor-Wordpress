# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GSM (Global Style Manager) is a WordPress plugin that gives Elementor sites a single admin page for managing the colors and fonts stored in Elementor's "Active Kit". No build step: PHP/JS/CSS are hand-written and served directly by WordPress.

```
global-style-manager.php   # bootstrap; defines GSM_VER/GSM_DIR/GSM_URL
includes/class-gsm-core.php   # reads/writes Elementor Active Kit meta, font normalization
includes/class-gsm-admin.php  # admin menu, asset enqueue, admin-bar node
includes/class-gsm-ajax.php   # wp_ajax_gsm_get / gsm_save / gsm_raw_kit handlers
views/admin-page.php          # the single admin page template
assets/css/admin.css          # hand-written, CSS custom properties (--gsm-*)
assets/js/admin.js            # vanilla jQuery, IIFE + State object, no bundler
```

## No build/test tooling

There is no build config, formatter, or test suite in this repo. Edit `assets/js/admin.js` and `assets/css/admin.css` directly — nothing compiles them. Don't propose adding a build step unless asked.

## Linting

`npm run lint` runs ESLint (flat config in `eslint.config.js`) against `assets/js/admin.js`. There is no PHP linter set up — this machine has no local PHP/Composer to run WordPress Coding Standards, so PHP style is still maintained by convention only (see existing code for patterns: 4-space indent, `snake_case` methods, `ABSPATH` guard at the top of every file).

## Packaging for WordPress install

`npm run package` (`scripts/package.sh`) builds `dist/global-style-manager-<version>.zip` containing only runtime files (`global-style-manager.php`, `includes/`, `views/`, `assets/`, `README.md`) — no `node_modules`, `.claude`, `CLAUDE.md`, `package.json`, or other dev tooling. Always use this script instead of zipping the repo root directly, since the repo now has dev-only files that must not ship to a live WordPress site.

## Releases

`.github/workflows/release.yml` auto-publishes a GitHub Release whenever a commit that changes `global-style-manager.php` is pushed to `main`. It reads the version from `GSM_VER`, skips if a release for that version already exists (so unrelated edits to that file don't spam releases), then runs `scripts/package.sh` and attaches the resulting clean zip to the release. This means: bump `Version:` + `GSM_VER` together, merge to `main`, and the release + zip happen automatically — no manual `npm run package` + upload needed for distribution.

## Testing changes

There's no local WordPress environment for this project. Changes are tested against the connected `novamira-unnamed-experime` MCP WordPress site (WordPress 7.0.1, PHP 8.3.31, Elementor active), which runs this same plugin. See the `test-on-novamira` skill for the sync-and-verify workflow.

## Version number

`Version:` in the plugin header docblock (`global-style-manager.php`) and the `GSM_VER` constant defined a few lines below it must be bumped together. Only `GSM_VER` is actually used for cache-busting on enqueued assets — updating just the header comment has no functional effect.

## AJAX handlers

This plugin uses classic `admin-ajax.php` actions, not the REST API (despite what the README says). Every handler in `includes/class-gsm-ajax.php` starts with:
```php
check_ajax_referer('gsm', 'nonce');
if (!current_user_can('manage_options')) { wp_die(); }
```
Follow this pattern for any new AJAX action. The nonce action name is the literal string `'gsm'`.

## Color/font save rules

- `ajax_save()` writes `custom_colors` / `custom_typography`, and also `system_colors` when the payload carries a non-empty array of them (system colors are editable in the UI as of v1.2.x; their `_id`s stay locked because Elementor references primary/secondary/text/accent by id). System typography (`system_typography`) must still never be written from the save handler.
- Colors are normalized without the `#` prefix internally, then re-added on save unless the value is `rgba()`/`hsla()` (see the regex check in `build_colors()`). Handle hex and rgba cases separately when touching color code.

## Elementor Active Kit dependency

Nearly all core logic depends on `get_option('elementor_active_kit')`. On a site where Elementor's editor has never been opened, this is empty and the admin page shows "Elementor Active Kit not found" — expected behavior, not a bug.

## Git workflow

Use feature branches and PRs for changes (not direct commits to `main`).
