<?php
/**
 * Main View File
 * 
 * New clean design template for the Admin UI.
 */

if (!defined('ABSPATH')) {
    exit;
}
?>
<div id="gsm-root" class="gsm-app">

    <aside id="gsm-sidebar" class="gsm-sidebar">
        <div class="gsm-brand">
            <div class="gsm-brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>
            <span>GSM 5</span>
        </div>

        <nav class="gsm-nav">
            <button class="gsm-nav-item active" data-tab="colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v8"></path>
                    <path d="M8 12h8"></path>
                </svg>
                Colors
            </button>
            <button class="gsm-nav-item" data-tab="fonts">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 7V4h16v3"></path>
                    <path d="M9 20h6"></path>
                    <path d="M12 4v16"></path>
                </svg>
                Typography
            </button>
            <button class="gsm-nav-item" data-tab="json">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                Code Editor
            </button>
            <button class="gsm-nav-item" data-tab="import">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Variables Importer
            </button>
            <button class="gsm-nav-item" data-tab="css">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                CSS Variables
            </button>
            <button class="gsm-nav-item" data-tab="debug">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                Debug
            </button>
        </nav>

        <div class="gsm-sidebar-footer">
            <div class="gsm-status-chips">
                <?php if ($has_el): ?>
                    <div class="gsm-badge gsm-badge--success">Elementor
                        <?= esc_html($el_ver) ?>
                    </div>
                    <?php if ($has_pro): ?>
                        <div class="gsm-badge gsm-badge--primary">Pro</div>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="gsm-badge gsm-badge--error">Missing Elementor</div>
                <?php endif; ?>
                <div class="gsm-badge gsm-badge--neutral">Kit:
                    <?= $kid ?: 'Not Found' ?>
                </div>
            </div>

            <?php if ($kid): ?>
                <a class="gsm-action-link" href="<?= esc_url(admin_url("post.php?post={$kid}&action=elementor")) ?>"
                    target="_blank">
                    Open Elementor ↗
                </a>
            <?php endif; ?>
        </div>
    </aside>

    <main id="gsm-main" class="gsm-main-content">
        <!-- Header -->
        <header id="gsm-topbar" class="gsm-topbar">
            <div class="gsm-topbar-title-section">
                <h1 id="gsm-topbar-title">Global Colors</h1>
                <p id="gsm-topbar-subtitle">Manage elementor's system and custom color palette.</p>
            </div>
            <div class="gsm-topbar-actions">
                <button id="btn-export" class="gsm-btn gsm-btn--ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export
                </button>
                <label class="gsm-btn gsm-btn--ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Import
                    <input type="file" id="btn-import-file" accept=".json" style="display:none">
                </label>
                <button id="btn-save-all" class="gsm-btn gsm-btn--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Publish Changes
                </button>
            </div>
        </header>

        <!-- Notification Bar initially hidden -->
        <div id="gsm-notice" class="gsm-toast" style="display:none"></div>

        <!-- Scrollable Content -->
        <div class="gsm-content-scroll">

            <!-- PANEL: Colors -->
            <div class="gsm-panel active" id="panel-colors" data-title="Global Colors"
                data-subtitle="Define your theme's custom and system color palette">
                <div class="gsm-panel-header">
                    <h2>Custom Palette</h2>
                    <button id="btn-add-color" class="gsm-btn gsm-btn--secondary">Add Color</button>
                </div>

                <div id="colors-grid" class="gsm-grid-colors"></div>

                <details class="gsm-accordion" id="sys-colors-wrap" style="display:none">
                    <summary class="gsm-accordion-header">
                        <span>Read-only System Colors</span>
                        <svg class="gsm-icon-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </summary>
                    <div class="gsm-accordion-content">
                        <div id="sys-colors-grid" class="gsm-grid-sys-colors"></div>
                    </div>
                </details>
            </div>

            <!-- PANEL: Fonts -->
            <div class="gsm-panel" id="panel-fonts" data-title="Typography"
                data-subtitle="Configure global responsive typography settings">
                <div class="gsm-panel-header">
                    <h2>Global Fonts</h2>
                    <button id="btn-add-font" class="gsm-btn gsm-btn--secondary">Add Font Style</button>
                </div>

                <div id="fonts-list" class="gsm-list-fonts"></div>

                <details class="gsm-accordion" id="sys-fonts-wrap" style="display:none">
                    <summary class="gsm-accordion-header">
                        <span>Read-only System Fonts</span>
                        <svg class="gsm-icon-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </summary>
                    <div class="gsm-accordion-content">
                        <div id="sys-fonts-list" class="gsm-list-sys-fonts"></div>
                    </div>
                </details>
            </div>

            <!-- PANEL: JSON -->
            <div class="gsm-panel" id="panel-json" data-title="Code Editor"
                data-subtitle="Advanced editing via raw JSON format">
                <div class="gsm-panel-header">
                    <div class="gsm-tab-group" id="json-tabs">
                        <button class="gsm-tab active" data-jt="colors">Colors</button>
                        <button class="gsm-tab" data-jt="fonts">Typography</button>
                        <button class="gsm-tab" data-jt="both">Full Blueprint</button>
                    </div>
                    <div class="gsm-header-actions">
                        <button id="json-apply" class="gsm-btn gsm-btn--secondary">Apply to UI</button>
                        <button id="json-save" class="gsm-btn gsm-btn--primary">Commit to Elementor</button>
                    </div>
                </div>

                <div class="gsm-editor-wrapper">
                    <textarea id="json-editor" class="gsm-code-textarea" spellcheck="false"></textarea>
                    <div id="json-status" class="gsm-editor-status">Ready</div>
                </div>
            </div>

            <!-- PANEL: CSS -->
            <div class="gsm-panel" id="panel-css" data-title="CSS Variables"
                data-subtitle="Auto-generated CSS variables for frontend usage">
                <div class="gsm-panel-header">
                    <h2>Registered Variables</h2>
                    <button id="btn-copy-css" class="gsm-btn gsm-btn--secondary">Copy Snippet</button>
                </div>
                <div class="gsm-editor-wrapper gsm-editor--readonly">
                    <pre id="css-output" class="gsm-code-block"></pre>
                </div>
            </div>

            <!-- PANEL: Import -->
            <div class="gsm-panel" id="panel-import" data-title="Variables Importer"
                data-subtitle="Import custom CSS variables, colors or typography from JSON">
                <div class="gsm-panel-header">
                    <div class="gsm-tab-group" id="import-tabs">
                        <button class="gsm-tab active" data-it="colors">Colors</button>
                        <button class="gsm-tab" data-it="fonts">Typography</button>
                    </div>
                    <div class="gsm-header-actions">
                        <button id="btn-run-import" class="gsm-btn gsm-btn--secondary">Import Data</button>
                    </div>
                </div>

                <div id="import-hint-colors"
                    style="background:var(--gsm-bg-mute); padding:1rem; border-radius:6px; margin-bottom:1rem; font-size:13px; color:var(--gsm-fg-mute);">
                    <strong>Colors Format (Key-Value):</strong>
                    <pre
                        style="margin:0.5rem 0 0; background:transparent; padding:0; color:var(--gsm-text); font-family:monospace;">
{
  "Brand Primary": "#EF4444",
  "Secondary": "rgba(0,0,0,0.5)"
}</pre>
                    <p style="margin:0.5rem 0 0; font-size:12px;">Notes: Colors will automatically generate unique
                        Elementor IDs.</p>
                </div>

                <div id="import-hint-fonts"
                    style="display:none; background:var(--gsm-bg-mute); padding:1rem; border-radius:6px; margin-bottom:1rem; font-size:13px; color:var(--gsm-fg-mute);">
                    <strong>Typography Format (Array of Objects):</strong>
                    <pre
                        style="margin:0.5rem 0 0; background:transparent; padding:0; color:var(--gsm-text); font-family:monospace; font-size:11px; height:200px; overflow-y:auto;">
[
  {
    "title": "Heading 1",
    "typography_font_family": "Poppins",
    "typography_font_weight": "700",
    "size_desktop": 48,
    "size_tablet": 36,
    "size_mobile": 28,
    "lh_desktop": 1.2,
    "lh_unit": "em"
  },
  {
    "title": "Body Text",
    "typography_font_family": "Inter",
    "size_desktop": 16
  }
]</pre>
                    <p style="margin:0.5rem 0 0; font-size:12px;">Notes: System will preserve existing ID or
                        auto-generate if missing.</p>
                </div>

                <div class="gsm-editor-wrapper">
                    <textarea id="import-editor" class="gsm-code-textarea" spellcheck="false"
                        placeholder="Paste your JSON here..."></textarea>
                    <div id="import-status" class="gsm-editor-status">Ready</div>
                </div>
            </div>

            <!-- PANEL: Debug -->
            <div class="gsm-panel" id="panel-debug" data-title="Debug Inspector"
                data-subtitle="Inspect raw Elementor POST meta data">
                <div class="gsm-panel-header">
                    <div class="gsm-tab-group" id="debug-tabs">
                        <button class="gsm-tab active" data-df="custom_colors">C. Colors</button>
                        <button class="gsm-tab" data-df="system_colors">S. Colors</button>
                        <button class="gsm-tab" data-df="custom_typography">C. Fonts</button>
                        <button class="gsm-tab" data-df="system_typography">S. Fonts</button>
                        <button class="gsm-tab" data-df="all">Master Page Settings</button>
                    </div>
                    <button id="btn-load-debug" class="gsm-btn gsm-btn--secondary">Fetch Fresh Data</button>
                </div>
                <div class="gsm-editor-wrapper gsm-editor--readonly">
                    <pre id="debug-output" class="gsm-code-block">Awaiting fetch action...</pre>
                </div>
            </div>

        </div>
    </main>
</div>