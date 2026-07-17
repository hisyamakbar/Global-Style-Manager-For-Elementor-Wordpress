---
name: test-on-novamira
description: Sync a local change to this GSM plugin onto the connected novamira-unnamed-experime WordPress site and verify it in the admin page. Use whenever a code change needs to be tested, since there is no local WordPress environment for this project.
---

There is no local WordPress/Elementor install for this repo. Testing happens against the connected `novamira-unnamed-experime` MCP WordPress site (WordPress 7.0.1, PHP 8.3.31, Elementor active, GSM plugin already installed there).

## Steps

1. **Locate the plugin on the site.** It's expected at `wp-content/plugins/global-style-manager/` under the site's `ABSPATH`. If unsure, use `novamira/list-directory` on `wp-content/plugins/` to confirm the folder name, and `novamira/read-file` to confirm the deployed version matches (or differs from) your local copy.

2. **Push the changed file(s).**
   - Non-PHP files (`assets/css/admin.css`, `assets/js/admin.js`, `views/admin-page.php` — note: `.php` counts as PHP even though it's a view) can go straight to their real path with `novamira/write-file` or `novamira/edit-file`.
   - **PHP files are restricted**: `novamira/write-file` can only write `*.php` files into the sandbox directory (`wp-content/novamira-sandbox/`), not into the live plugin folder. If a change touches a PHP file (`global-style-manager.php`, `includes/*.php`, `views/admin-page.php`), try `novamira/edit-file` on the live path first (it edits existing files by exact string match and may not carry the same sandbox restriction as writing a new file). If that's rejected, ask the user how PHP changes normally get deployed to this site (e.g. git pull on the server, SFTP, a deploy script) rather than assuming — don't silently fall back to the sandbox, since sandboxed PHP doesn't run as the actual plugin.

3. **Verify in the browser.** Call `novamira/create-admin-access-link` to get a one-time login URL, then use the `claude-in-chrome` tools to open the GSM admin page (Admin menu → GSM) and exercise the changed behavior — check colors/fonts render, save/reload round-trips correctly, and the browser console has no new errors.

4. **Report back** what was pushed, how it was verified, and any discrepancy between the local repo and the deployed site (e.g. if the site was already on a different version).
