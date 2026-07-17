/**
 * Global Style Manager V5 - Main Scripts
 */

(function ($) {
    'use strict';

    if (typeof gsmCfg === 'undefined') return;

    const GFONTS = gsmCfg.gfonts || [];
    const BREAKPOINTS = gsmCfg.activeBreakpoints && gsmCfg.activeBreakpoints.length ? gsmCfg.activeBreakpoints : [
        { key: 'mobile', label: 'Mobile', suffix: '_mobile' },
        { key: 'tablet', label: 'Tablet', suffix: '_tablet' },
        { key: 'desktop', label: 'Desktop', suffix: '' },
    ];
    const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
    const TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'];
    const FONT_STYLES = ['', 'normal', 'italic', 'oblique'];
    const DECORATIONS = ['none', 'underline', 'overline', 'line-through'];

    // State Management
    const State = {
        custom_colors: [],
        custom_fonts: [],
        system_colors: [],
        system_fonts: [],
        jsonTab: 'colors',
        importTab: 'colors',
        debugFilter: 'custom_colors',
        rawKit: null,
    };

    // DOM Ready
    $(function () {
        initApp();
        bindNavigation();
        bindTopActions();
        bindJsonEditor();
        bindImportEditor();
        bindDebugInspector();
    });

    function initApp() {
        showToast('loading', 'Loading Elementor Kit...');
        $.post(gsmCfg.ajax, { action: 'gsm_get', nonce: gsmCfg.nonce })
            .done((r) => {
                if (!r.success) {
                    showToast('err', r.data || 'Failed to load data.');
                    loadDefaults();
                    return;
                }
                const d = r.data;
                State.custom_colors = d.custom_colors.length ? d.custom_colors : defColors();
                State.custom_fonts = d.custom_fonts.length ? d.custom_fonts : defFonts();
                State.system_colors = d.system_colors || [];
                State.system_fonts = d.system_fonts || [];

                renderAll();
                showToast('ok', `Connected to Kit #${d.kid}`);
            })
            .fail(() => {
                showToast('err', 'Network error while fetching Kit data.');
                loadDefaults();
            });
    }

    function loadDefaults() {
        State.custom_colors = defColors();
        State.custom_fonts = defFonts();
        renderAll();
    }

    function renderAll() {
        renderColors();
        renderSysColors();
        renderFonts();
        renderSysFonts();
        renderCSSVariables();
        syncJsonEditor();
    }

    // Default Generators
    function defColors() {
        return [
            { _id: generateId(), title: 'Primary', color: '18181B' },
            { _id: generateId(), title: 'Secondary', color: '3B82F6' },
            { _id: generateId(), title: 'Accent', color: '10B981' }
        ];
    }

    function defFonts() {
        return [
            mkFont('Primary Headline', 'Plus Jakarta Sans', '700', 48, 1.2),
            mkFont('Body Text', 'Plus Jakarta Sans', '400', 16, 1.6),
        ];
    }

    // Seeds only the desktop (base) values — other active breakpoints are
    // left unset until the user fills them in via the responsive table.
    function mkFont(title, fam, wt, szD, lhD) {
        return {
            _id: generateId(), title,
            typography_font_family: fam,
            typography_font_weight: wt,
            typography_font_style: '',
            typography_text_transform: 'none',
            typography_text_decoration: 'none',
            size_desktop: szD, size_unit: 'px',
            lh_desktop: lhD, lh_unit: 'em',
            ls_unit: 'px',
            ws_unit: 'px',
        };
    }

    function generateId() {
        return Math.random().toString(16).slice(2, 9);
    }

    function parseToRgba(str) {
        str = (str || '').trim();
        let r = 0, g = 0, b = 0, a = 1;
        if (str.startsWith('#')) {
            let hex = str.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (hex.length === 8) {
                a = parseInt(hex.substring(6, 8), 16) / 255;
                hex = hex.substring(0, 6);
            }
            if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        } else if (/^rgba?/.test(str)) {
            let parts = str.match(/[\d.]+/g);
            if (parts && parts.length >= 3) {
                r = parseInt(parts[0], 10); g = parseInt(parts[1], 10); b = parseInt(parts[2], 10);
                if (parts.length >= 4) a = parseFloat(parts[3]);
            }
        }
        return {
            r, g, b, a,
            hexBase: "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()
        };
    }

    /* --- UI Rendering: Colors --- */
    function renderColors() {
        const $grid = $('#colors-grid').empty();

        // All custom colors are editable, including the default-named ones
        // (primary/secondary/text/accent).
        State.custom_colors.forEach((col, idx) => {
            let colorStr = (col.color || '000000').trim();
            // Preserve rgba/rgb/hsl strings without adding '#' and toUpperCase
            let hex = /^(rgba?|hsla?)\(/i.test(colorStr) ? colorStr : '#' + colorStr.replace('#', '').toUpperCase();

            let parsed = parseToRgba(hex);

            const $card = $(`
                <div class="gsm-color-card" data-idx="${idx}">
                    <div class="gsm-color-card-header">
                        <span class="gsm-drag-handle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                        </span>
                        
                        <div class="gsm-color-swatch-wrap" style="position:relative;">
                            <button class="gsm-color-swatch-btn js-swatch" style="background:${hex}"></button>
                            <div class="gsm-color-popover js-popover" style="display:none;">
                                <div class="gsm-cp-row">
                                    <label>Base Color</label>
                                    <input type="color" class="gsm-cp-base js-cp-base" value="${parsed.hexBase}">
                                </div>
                                <div class="gsm-cp-row">
                                    <label>Opacity <span class="js-cp-alpha-text">${Math.round(parsed.a * 100)}%</span></label>
                                    <input type="range" class="gsm-cp-alpha js-cp-alpha" min="0" max="1" step="0.01" value="${parsed.a}">
                                </div>
                            </div>
                        </div>

                        <div class="gsm-color-info">
                            <input class="gsm-color-title js-title" type="text" value="${esc(col.title)}" placeholder="Color Name">
                            <input class="gsm-color-hex-input js-hex-input" type="text" value="${hex}">
                        </div>
                    </div>
                    
                    <div class="gsm-field">
                        <label>CSS Variable ID</label>
                        <div class="gsm-input-group">
                            <span class="gsm-input-group-addon">--e-global-color-</span>
                            <input class="gsm-input js-id" type="text" value="${esc(col._id)}" placeholder="e.g. primary">
                        </div>
                    </div>
                    
                    <div class="gsm-color-actions">
                        <button class="gsm-btn gsm-btn--danger js-delete">Delete</button>
                    </div>
                </div>
            `);

            $grid.append($card);

            // Custom Picker Logic
            const $popover = $card.find('.js-popover');
            const $baseInput = $card.find('.js-cp-base');
            const $alphaInput = $card.find('.js-cp-alpha');
            const $alphaFormat = $card.find('.js-cp-alpha-text');
            const $hexInput = $card.find('.js-hex-input');
            const $swatch = $card.find('.js-swatch');

            function applyColorInternal() {
                let a = parseFloat($alphaInput.val());
                let b = $baseInput.val();
                let p = parseToRgba(b);
                let outStr = b.toUpperCase();

                if (a < 1) {
                    outStr = `rgba(${p.r}, ${p.g}, ${p.b}, ${a})`;
                }

                $alphaFormat.text(Math.round(a * 100) + '%');
                $swatch.css('background', outStr);
                $hexInput.val(outStr);
                State.custom_colors[idx].color = outStr.replace('#', '');

                renderCSSVariables();
                syncJsonEditor();
            }

            $baseInput.on('input', applyColorInternal);
            $alphaInput.on('input', applyColorInternal);

            // Bindings
            $swatch.on('click', (e) => {
                e.stopPropagation();
                let isVis = $popover.is(':visible');
                $('.js-popover').hide();
                $('.gsm-color-card').css('z-index', '');
                if (!isVis) {
                    $card.css('z-index', '1000');
                    $popover.show();
                }
            });

            $hexInput.on('change', function () {
                let val = this.value.trim();
                if (val && !val.startsWith('#') && !/^(rgba?|hsla?)\(/i.test(val)) val = '#' + val;

                let p = parseToRgba(val);
                $baseInput.val(p.hexBase);
                $alphaInput.val(p.a);
                applyColorInternal();
            });
            $card.find('.js-title').on('input', function () {
                State.custom_colors[idx].title = this.value;
                syncJsonEditor();
            });
            $card.find('.js-id').on('input', function () {
                const safeVal = this.value.replace(/[^a-z0-9-]/g, '').toLowerCase().slice(0, 15);
                this.value = safeVal;
                State.custom_colors[idx]._id = safeVal;
                renderCSSVariables();
                syncJsonEditor();
            });
            $card.find('.js-delete').on('click', () => {
                State.custom_colors.splice(idx, 1);
                renderColors();
                renderCSSVariables();
                syncJsonEditor();
            });
        });

        // Initialize Sortable
        if ($grid.sortable) {
            $grid.sortable({
                handle: '.gsm-drag-handle',
                placeholder: 'gsm-color-card-placeholder',
                forcePlaceholderSize: true,
                opacity: 0.9,
                tolerance: 'pointer',
                start: (e, ui) => {
                    ui.placeholder.height(ui.helper.outerHeight());
                },
                update: () => {
                    const newArr = [];
                    $grid.find('.gsm-color-card').each(function () {
                        const idx = $(this).attr('data-idx');
                        newArr.push(State.custom_colors[idx]);
                    });
                    State.custom_colors = newArr;
                    // Don't full renderColors here, just sync state. 
                    // Actually, we must sync data-idx on others too.
                    // Let's do a quiet re-index.
                    $grid.find('.gsm-color-card').each(function (i) {
                        $(this).attr('data-idx', i);
                    });
                    renderCSSVariables();
                    syncJsonEditor();
                }
            });
        }

        $('#btn-add-color').off('click').on('click', () => {
            State.custom_colors.push({ _id: generateId(), title: 'New Color', color: 'A78BFA' });
            renderColors();
        });

        // Click outside to close pickers
        $(document).off('click.picker').on('click.picker', (e) => {
            if (!$(e.target).closest('.gsm-color-swatch-wrap').length) {
                $('.gsm-color-card').css('z-index', '');
                $('.js-popover').hide();
            }
        });
    }

    function renderSysColors() {
        const $wrap = $('#sys-colors-wrap');

        // Default-named custom colors now live in the main editable grid;
        // this section only shows Elementor's own system colors — editable
        // (color + title), but their _id stays locked since Elementor
        // references primary/secondary/text/accent by id.
        if (!State.system_colors.length) { $wrap.hide(); return; }

        $wrap.show();
        const $grid = $('#sys-colors-grid').empty();

        State.system_colors.forEach((c, i) => {
            let colorStr = (c.color || '000000').trim();
            let isFunc = /^(rgba?|hsla?)\(/i.test(colorStr);
            let disp = isFunc ? colorStr : '#' + colorStr.replace('#', '').toUpperCase();
            let parsed = parseToRgba(disp);

            const $item = $(`
                <div class="gsm-sys-color-item" data-color="${disp}">
                    <input type="color" class="gsm-sys-swatch js-sys-base" value="${parsed.hexBase}" style="padding:0;border:none;cursor:pointer;">
                    <div class="gsm-sys-info">
                        <input class="gsm-sys-name js-sys-title" type="text" value="${esc(c.title)}" style="border:none;background:transparent;padding:0;width:100%;font:inherit;color:inherit;">
                        <input class="gsm-sys-hex js-sys-hex" type="text" value="${disp}" style="border:none;background:transparent;padding:0;width:100%;font:inherit;color:inherit;">
                        <div class="gsm-sys-hex">${esc(c._id)}</div>
                    </div>
                </div>
            `);
            $grid.append($item);

            const $base = $item.find('.js-sys-base');
            const $hex = $item.find('.js-sys-hex');

            $base.on('input', function () {
                const val = this.value.toUpperCase();
                State.system_colors[i].color = val.replace('#', '');
                $hex.val(val);
                renderCSSVariables();
                syncJsonEditor();
            });
            $hex.on('change', function () {
                let val = this.value.trim();
                if (val && !val.startsWith('#') && !/^(rgba?|hsla?)\(/i.test(val)) val = '#' + val;
                const p = parseToRgba(val);
                $base.val(p.hexBase);
                State.system_colors[i].color = val.replace('#', '');
                renderCSSVariables();
                syncJsonEditor();
            });
            $item.find('.js-sys-title').on('input', function () {
                State.system_colors[i].title = this.value;
                syncJsonEditor();
            });
        });
    }

    /* --- UI Rendering: Typography --- */
    function renderFonts() {
        const $list = $('#fonts-list').empty();

        // All custom fonts are editable here, including default-named ones
        // (primary/secondary/text/accent) — the real Elementor defaults live
        // separately in State.system_fonts, rendered by renderSysFonts().
        State.custom_fonts.forEach((f, idx) => {
            appendFontCard($list, f, idx, false);
        });

        if ($list.sortable) {
            $list.sortable({
                handle: '.gsm-drag-handle',
                axis: 'y',
                placeholder: 'gsm-font-card-placeholder',
                forcePlaceholderSize: true,
                opacity: 0.9,
                update: () => {
                    const newArr = [];
                    $list.find('.gsm-font-card').each(function () {
                        const idx = $(this).attr('data-idx');
                        if (idx !== undefined) {
                            newArr.push(State.custom_fonts[idx]);
                        }
                    });
                    State.custom_fonts = newArr;
                    // Quiet re-index
                    $list.find('.gsm-font-card').each(function (i) {
                        $(this).attr('data-idx', i);
                    });
                    renderCSSVariables();
                    syncJsonEditor();
                }
            });
        }

        $('#btn-add-font').off('click').on('click', () => {
            State.custom_fonts.push({
                _id: 'new-style',
                title: 'New Style',
                typography_font_family: 'Plus Jakarta Sans',
                typography_font_weight: '400',
                size_desktop: 16,
                lh_desktop: 1.5,
                lh_unit: 'em',
                ls_unit: 'px',
                ws_unit: 'px'
            });
            renderFonts();
            $list.find('.gsm-font-card:last')[0]?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // isSys = true for the 4 default Elementor fonts (primary/secondary/text/accent):
    // everything is editable except the CSS Variable ID (Elementor references
    // those by fixed id) and reordering/deleting (fixed set of 4 slots).
    function appendFontCard($container, f, idx, isSys) {
        const target = isSys ? State.system_fonts : State.custom_fonts;
        const fam = f.typography_font_family || 'Inter';
        const wt = f.typography_font_weight || '400';

        const wOpts = WEIGHTS.map(w => opt(w, w === wt)).join('');
        const ttOpts = TRANSFORMS.map(t => opt(t, t === f.typography_text_transform)).join('');
        const fsOpts = FONT_STYLES.map(s => opt(s, s === f.typography_font_style, s || 'Normal')).join('');
        const tdOpts = DECORATIONS.map(s => opt(s, s === f.typography_text_decoration)).join('');

        function mkUnit(val) {
            const units = ['px', 'em', 'rem', 'vw', 'vh', ''];
            if (val && !units.includes(val)) units.push(val);
            return units.map(u => `<option value="${u}" ${u === val ? 'selected' : ''}>${u || '-'}</option>`).join('');
        }

        // shortClass drives the input's CSS class (js-sz/js-lh/js-ls/js-ws,
        // matching the write-back bindings below); statePrefix is the actual
        // State key prefix (size_*/lh_*/ls_*/ws_*) — they differ for size/sz.
        function responsiveRow(label, shortClass, statePrefix, unit, step) {
            const cells = BREAKPOINTS.map(bp => {
                const v = f[`${statePrefix}_${bp.key}`];
                return `<td><input type="number" ${step ? `step="${step}"` : ''} class="gsm-input js-${shortClass}" data-bp="${bp.key}" value="${v ?? ''}" placeholder="-" style="height:30px;"></td>`;
            }).join('');
            return `
                <tr>
                    <td class="gsm-rt-sticky-1"><label style="font-size:12px;color:#0f172a;">${label}</label></td>
                    <td class="gsm-rt-sticky-2"><select class="gsm-select js-${shortClass}-unit" style="height:30px;">${mkUnit(unit)}</select></td>
                    ${cells}
                </tr>`;
        }

        const bpHeaders = BREAKPOINTS.map(bp => `<th>${esc(bp.label)}</th>`).join('');

        const cardHtml = `
            <div class="gsm-font-card ${isSys ? 'gsm-font-card--system' : ''}" data-idx="${idx}">
                <div class="gsm-font-header">
                    ${!isSys ? `
                    <span class="gsm-drag-handle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                    </span>` : ''}
                    <input class="gsm-font-title-input js-title" type="text" value="${esc(f.title)}" placeholder="Style Name">
                    <div class="gsm-font-preview-text js-preview" style="font-family:'${fam}'; font-weight:${wt};">The quick brown fox jumps over the lazy dog.</div>
                    <svg class="gsm-icon-chevron js-toggle" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>

                <div class="gsm-font-body" style="display: none;">

                    <div class="gsm-font-grid-main">
                        <div class="gsm-field">
                            <label>CSS Variable ID</label>
                            <div class="gsm-input-group">
                                <span class="gsm-input-group-addon">--e-global-typography-</span>
                                <input class="gsm-input js-id" type="text" value="${esc(f._id)}" placeholder="e.g. heading" ${isSys ? 'disabled' : ''}>
                            </div>
                        </div>
                        <div class="gsm-field" style="grid-column: span 2;">
                            <label>Font Family</label>
                            <div class="gsm-ac-wrap">
                                <input type="text" class="gsm-input js-family" value="${esc(fam)}" placeholder="Search Google Fonts...">
                                <div class="gsm-ac-list js-ac-list"></div>
                            </div>
                        </div>
                    </div>

                    <div class="gsm-font-grid-styles">
                        <div class="gsm-field">
                            <label>Weight</label>
                            <select class="gsm-select js-wt">${wOpts}</select>
                        </div>
                        <div class="gsm-field">
                            <label>Transform</label>
                            <select class="gsm-select js-tt">${ttOpts}</select>
                        </div>
                        <div class="gsm-field">
                            <label>Style</label>
                            <select class="gsm-select js-fs">${fsOpts}</select>
                        </div>
                        <div class="gsm-field">
                            <label>Decoration</label>
                            <select class="gsm-select js-td">${tdOpts}</select>
                        </div>
                    </div>

                    <!-- Responsive Table -->
                    <div class="gsm-table-scroll">
                        <table class="gsm-font-responsive-table">
                            <thead>
                                <tr>
                                    <th class="gsm-rt-sticky-1">Property</th>
                                    <th class="gsm-rt-sticky-2">Unit</th>
                                    ${bpHeaders}
                                </tr>
                            </thead>
                            <tbody>
                                ${responsiveRow('Font Size', 'sz', 'size', f.size_unit || 'px')}
                                ${responsiveRow('Line Height', 'lh', 'lh', f.lh_unit || 'em', '0.1')}
                                ${responsiveRow('Letter Spacing', 'ls', 'ls', f.ls_unit || 'px', '0.1')}
                                ${responsiveRow('Word Spacing', 'ws', 'ws', f.ws_unit || 'px', '0.1')}
                            </tbody>
                        </table>
                    </div>

                </div>

                ${!isSys ? `
                <div class="gsm-font-footer">
                    <button class="gsm-btn gsm-btn--danger js-delete">Delete Style</button>
                </div>` : ''}
            </div>
        `;

        const $card = $(cardHtml);
        $container.append($card);

        // Toggle logic
        $card.find('.gsm-font-header').on('click', function (e) {
            if ($(e.target).closest('input, .gsm-drag-handle').length) return;
            $card.toggleClass('open');
            $card.find('.gsm-font-body').slideToggle(200);
        });

        $card.find('.js-title').on('input', function () { target[idx].title = this.value; syncJsonEditor(); });
        $card.find('.js-id').on('input', function () {
            if (isSys) return; // locked: Elementor references system fonts by fixed id
            const safeVal = this.value.replace(/[^a-z0-9-]/g, '').toLowerCase().slice(0, 15);
            this.value = safeVal; target[idx]._id = safeVal;
            renderCSSVariables(); syncJsonEditor();
        });

        // Autocomplete & other bindings
        const $fi = $card.find('.js-family');
        const $al = $card.find('.js-ac-list');
        $fi.on('input', function () {
            const q = this.value.trim().toLowerCase();
            if (!q) { $al.removeClass('open').empty(); return; }
            const m = GFONTS.filter(fn => fn.toLowerCase().includes(q)).slice(0, 6);
            if (!m.length) { $al.removeClass('open').empty(); return; }
            $al.html(m.map(fn => `<div class="gsm-ac-item" data-v="${fn}">${fn}</div>`).join('')).addClass('open');
        }).on('blur', () => { setTimeout(() => { $al.removeClass('open'); }, 200); });

        $al.on('click', '.gsm-ac-item', function () {
            const v = $(this).data('v');
            $fi.val(v);
            $al.removeClass('open').empty();
            target[idx].typography_font_family = v;
            $card.find('.js-preview').css('font-family', `'${v}'`);
            renderCSSVariables(); syncJsonEditor();
        });

        $card.find('.js-wt').on('change', function () { target[idx].typography_font_weight = this.value; $card.find('.js-preview').css('font-weight', this.value); renderCSSVariables(); syncJsonEditor(); });
        $card.find('.js-tt').on('change', function () { target[idx].typography_text_transform = this.value; syncJsonEditor(); });
        $card.find('.js-fs').on('change', function () { target[idx].typography_font_style = this.value; syncJsonEditor(); });
        $card.find('.js-td').on('change', function () { target[idx].typography_text_decoration = this.value; syncJsonEditor(); });

        const syncProp = (cls, prop) => {
            $card.find(cls).on('input', function () {
                const bp = $(this).data('bp');
                target[idx][`${prop}_${bp}`] = this.value !== '' ? parseFloat(this.value) : null;
                if (prop === 'size') renderCSSVariables();
                syncJsonEditor();
            });
        };
        syncProp('.js-sz', 'size');
        syncProp('.js-lh', 'lh');
        syncProp('.js-ls', 'ls');
        syncProp('.js-ws', 'ws');

        $card.find('.js-sz-unit').on('change', function () { target[idx].size_unit = this.value; renderCSSVariables(); syncJsonEditor(); });
        $card.find('.js-lh-unit').on('change', function () { target[idx].lh_unit = this.value; syncJsonEditor(); });
        $card.find('.js-ls-unit').on('change', function () { target[idx].ls_unit = this.value; syncJsonEditor(); });
        $card.find('.js-ws-unit').on('change', function () { target[idx].ws_unit = this.value; syncJsonEditor(); });

        if (isSys) return; // system fonts are a fixed set: not reorderable/deletable

        $card.find('.js-delete').on('click', () => {
            State.custom_fonts.splice(idx, 1);
            renderFonts();
            renderCSSVariables();
            syncJsonEditor();
        });
    }

    function renderSysFonts() {
        const $wrap = $('#sys-fonts-wrap');

        if (!State.system_fonts.length) { $wrap.hide(); return; }

        $wrap.show();
        const $grid = $('#sys-fonts-list').empty();

        State.system_fonts.forEach((f, i) => {
            appendFontCard($grid, f, i, true);
        });
    }

    /* --- UI Rendering: CSS Variables --- */
    function renderCSSVariables() {
        let out = ':root {\n\n  /* --- Custom Global Colors --- */\n';
        State.custom_colors.forEach(c => {
            if (c._id) {
                const isFunc = /^(rgba?|hsla?)\(/i.test(c.color);
                const colorVal = isFunc ? c.color : `#${c.color}`;
                out += `  --e-global-color-${c._id}: ${colorVal};\n`;
            }
        });

        if (State.system_colors.length) {
            out += '\n  /* --- System Colors --- */\n';
            State.system_colors.forEach(c => {
                if (c._id) {
                    const isFunc = /^(rgba?|hsla?)\(/i.test(c.color);
                    const colorVal = isFunc ? c.color : `#${c.color}`;
                    out += `  --e-global-color-${c._id}: ${colorVal};\n`;
                }
            });
        }

        out += '\n  /* --- Custom Typography --- */\n';
        State.custom_fonts.forEach(f => {
            if (f._id) {
                out += `  /* ${f.title} */\n`;
                out += `  --e-global-typography-${f._id}-font-family: "${f.typography_font_family || 'Inherit'}";\n`;
                out += `  --e-global-typography-${f._id}-font-weight: ${f.typography_font_weight || 400};\n`;
                if (f.size_desktop) out += `  --e-global-typography-${f._id}-font-size: ${f.size_desktop}px;\n`;
                out += '\n';
            }
        });

        if (State.system_fonts.length) {
            out += '\n  /* --- System Typography --- */\n';
            State.system_fonts.forEach(f => {
                if (f._id) {
                    out += `  /* ${f.title} */\n`;
                    out += `  --e-global-typography-${f._id}-font-family: "${f.typography_font_family || 'Inherit'}";\n`;
                    out += `  --e-global-typography-${f._id}-font-weight: ${f.typography_font_weight || 400};\n`;
                    if (f.size_desktop) out += `  --e-global-typography-${f._id}-font-size: ${f.size_desktop}px;\n`;
                    out += '\n';
                }
            });
        }
        out += '}';
        $('#css-output').text(out);
    }

    /* --- Navigation & Interactivity --- */
    function bindNavigation() {
        $('.gsm-nav-item').on('click', function () {
            const tab = $(this).data('tab');
            $('.gsm-nav-item').removeClass('active');
            $(this).addClass('active');

            $('.gsm-panel').removeClass('active');
            const $target = $('#panel-' + tab);
            $target.addClass('active');

            $('#gsm-topbar-title').text($target.data('title') || 'Global Style Manager');
            $('#gsm-topbar-subtitle').text($target.data('subtitle') || '');

            if (tab === 'css') renderCSSVariables();
            if (tab === 'json') syncJsonEditor();
            if (tab === 'debug') $('#btn-load-debug').trigger('click');
        });
    }

    function bindTopActions() {
        $('#btn-save-all').on('click', function () {
            saveToElementor('both', { custom_colors: State.custom_colors, custom_fonts: State.custom_fonts, system_colors: State.system_colors, system_fonts: State.system_fonts }, $(this));
        });

        $('#btn-export').on('click', function () {
            const data = {
                version: "5.0.0",
                exported_at: new Date().toISOString(),
                custom_colors: State.custom_colors,
                custom_fonts: State.custom_fonts,
                system_colors: State.system_colors,
                system_fonts: State.system_fonts
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `gsm -export -${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast('ok', 'Blueprint Exported Successfully!');
        });

        $('#btn-import-file').on('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const d = JSON.parse(ev.target.result);
                    if (d.custom_colors) State.custom_colors = d.custom_colors;
                    if (d.custom_fonts) State.custom_fonts = d.custom_fonts;
                    if (d.system_colors) State.system_colors = d.system_colors;
                    if (d.system_fonts) State.system_fonts = d.system_fonts;
                    renderAll();
                    showToast('ok', 'Blueprint Imported! Click "Publish" to save.');
                } catch (err) {
                    showToast('err', 'Invalid JSON file structure.');
                }
            };
            reader.readAsText(file);
            $(this).val('');
        });

        $('#btn-copy-css').on('click', function () {
            const t = $('#css-output').text();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(t).then(() => showToast('ok', 'CSS Snippet Copied!'));
            } else {
                const $ta = $('<textarea>').val(t).appendTo('body').select();
                document.execCommand('copy');
                $ta.remove();
                showToast('ok', 'CSS Snippet Copied!');
            }
        });
    }

    /* --- JSON Logic --- */
    function syncJsonEditor() {
        const t = State.jsonTab;
        const data = t === 'colors'
            ? { custom_colors: State.custom_colors, system_colors: State.system_colors }
            : t === 'fonts'
                ? { custom_fonts: State.custom_fonts, system_fonts: State.system_fonts }
                : { custom_colors: State.custom_colors, custom_fonts: State.custom_fonts, system_colors: State.system_colors, system_fonts: State.system_fonts };
        $('#json-editor').val(JSON.stringify(data, null, 2));
        validateJson();
    }

    function validateJson() {
        const $status = $('#json-status');
        try {
            JSON.parse($('#json-editor').val());
            $status.text('Syntax: Valid JSON').attr('class', 'gsm-editor-status ok');
        } catch (e) {
            $status.text('Syntax Error: ' + e.message).attr('class', 'gsm-editor-status err');
        }
    }

    function bindJsonEditor() {
        $('#json-tabs').on('click', '.gsm-tab', function () {
            $('#json-tabs .gsm-tab').removeClass('active');
            $(this).addClass('active');
            State.jsonTab = $(this).data('jt');
            syncJsonEditor();
        });

        $('#json-editor').on('input', validateJson).on('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = this.selectionStart;
                this.value = this.value.slice(0, s) + '  ' + this.value.slice(this.selectionEnd);
                this.selectionStart = this.selectionEnd = s + 2;
            }
        });

        $('#json-save').on('click', function () {
            try {
                const val = $('#json-editor').val();
                const d = JSON.parse(val);
                const type = State.jsonTab === 'both' ? 'both' : State.jsonTab;

                // First: Apply to UI State
                if (type === 'colors') {
                    if (Array.isArray(d)) {
                        // Backwards-compat: a flat array means custom colors only.
                        State.custom_colors = d;
                    } else if (d && typeof d === 'object') {
                        if (d.custom_colors) State.custom_colors = d.custom_colors;
                        if (d.system_colors) State.system_colors = d.system_colors;
                    } else {
                        throw new Error('Root must be an array or a {custom_colors, system_colors} object for Colors');
                    }
                } else if (type === 'fonts') {
                    if (Array.isArray(d)) {
                        // Backwards-compat: a flat array means custom fonts only.
                        State.custom_fonts = d;
                    } else if (d && typeof d === 'object') {
                        if (d.custom_fonts) State.custom_fonts = d.custom_fonts;
                        if (d.system_fonts) State.system_fonts = d.system_fonts;
                    } else {
                        throw new Error('Root must be an array or a {custom_fonts, system_fonts} object for Typography');
                    }
                } else {
                    if (d.custom_colors) State.custom_colors = d.custom_colors;
                    if (d.custom_fonts) State.custom_fonts = d.custom_fonts;
                    if (d.system_colors) State.system_colors = d.system_colors;
                    if (d.system_fonts) State.system_fonts = d.system_fonts;
                }

                renderAll(); // Refresh UI

                // Second: Commit to Elementor
                saveToElementor(type, d, $(this));

            } catch (e) {
                showToast('err', 'JSON Error: ' + e.message);
            }
        });
    }

    /* --- Import Logic --- */
    function bindImportEditor() {
        const $editor = $('#import-editor');
        const $status = $('#import-status');

        $('#import-tabs').on('click', '.gsm-tab', function () {
            $('#import-tabs .gsm-tab').removeClass('active');
            $(this).addClass('active');
            State.importTab = $(this).data('it');

            if (State.importTab === 'fonts') {
                $('#import-hint-colors').hide();
                $('#import-hint-fonts').show();
                $('#btn-run-import').text('Import Typography');
            } else {
                $('#import-hint-fonts').hide();
                $('#import-hint-colors').show();
                $('#btn-run-import').text('Import Colors');
            }
            $editor.val('').trigger('input');
            $editor.attr('placeholder', State.importTab === 'fonts' ? 'Paste your array of Typography JSON here...' : 'Paste your Colors JSON here...');
        });

        $editor.on('input', function () {
            try {
                const val = $editor.val().trim();
                if (!val) {
                    $status.text('Ready').attr('class', 'gsm-editor-status');
                    return;
                }
                JSON.parse(val);
                $status.text('Syntax: Valid JSON').attr('class', 'gsm-editor-status ok');
            } catch (e) {
                $status.text('Syntax Error: ' + e.message).attr('class', 'gsm-editor-status err');
            }
        });

        $('#btn-run-import').on('click', () => {
            const val = $editor.val().trim();
            if (!val) {
                showToast('err', 'Editor is empty.');
                return;
            }
            try {
                const d = JSON.parse(val);
                let count = 0;

                if (State.importTab === 'colors') {
                    if (typeof d !== 'object' || d === null || Array.isArray(d)) {
                        throw new Error('Please provide a flat JSON object (Key-Value pairs).');
                    }

                    for (const [title, colorVal] of Object.entries(d)) {
                        let hex = String(colorVal).trim();
                        if (hex.startsWith('#')) {
                            hex = hex.substring(1);
                        }
                        if (!hex) continue;

                        State.custom_colors.push({
                            _id: generateId(),
                            title: title,
                            color: hex
                        });
                        count++;
                    }
                } else if (State.importTab === 'fonts') {
                    if (!Array.isArray(d)) {
                        throw new Error('Please provide a valid JSON Array of Typography objects.');
                    }

                    d.forEach(f => {
                        if (typeof f !== 'object' || f === null) return;

                        const font = {
                            _id: f._id || generateId(),
                            title: f.title || 'Imported Font',
                            typography_font_family: f.typography_font_family || '',
                            typography_font_weight: f.typography_font_weight || '400',
                            typography_font_style: f.typography_font_style || '',
                            typography_text_transform: f.typography_text_transform || 'none',
                            typography_text_decoration: f.typography_text_decoration || 'none',
                            size_unit: f.size_unit || 'px',
                            lh_unit: f.lh_unit || 'em',
                            ls_unit: f.ls_unit || 'px',
                            ws_unit: f.ws_unit || 'px',
                        };
                        // Copy through responsive values for whichever breakpoints
                        // are present in the imported JSON (not just this site's
                        // currently active ones), so re-importing a blueprint
                        // exported from a site with more breakpoints doesn't
                        // silently drop data.
                        ['size', 'lh', 'ls', 'ws'].forEach(prop => {
                            Object.keys(f).forEach(k => {
                                if (k.indexOf(prop + '_') === 0 && k !== prop + '_unit') {
                                    font[k] = f[k];
                                }
                            });
                        });

                        State.custom_fonts.push(font);
                        count++;
                    });
                }

                if (count > 0) {
                    renderAll();
                    showToast('ok', `Successfully imported ${count} ${State.importTab}.`);
                    $editor.val('');
                    $status.text('Ready').attr('class', 'gsm-editor-status');
                } else {
                    showToast('err', `No data found to import.`);
                }
            } catch (e) {
                showToast('err', e.message);
            }
        });
    }

    /* --- Debug Logic --- */
    function bindDebugInspector() {
        $('#btn-load-debug').on('click', function () {
            const $btn = $(this);
            const orig = $btn.html();
            $btn.html('<span class="spin"></span> Fetching...').prop('disabled', true);

            $.post(gsmCfg.ajax, { action: 'gsm_raw_kit', nonce: gsmCfg.nonce })
                .done(r => {
                    $btn.html(orig).prop('disabled', false);
                    if (!r.success) { showToast('err', 'Failed fetching raw kit'); return; }
                    State.rawKit = r.data;
                    renderDebugView();
                })
                .fail(() => {
                    $btn.html(orig).prop('disabled', false);
                    showToast('err', 'Network error.');
                });
        });

        $('#debug-tabs').on('click', '.gsm-tab', function () {
            $('#debug-tabs .gsm-tab').removeClass('active');
            $(this).addClass('active');
            State.debugFilter = $(this).data('df');
            renderDebugView();
        });
    }

    function renderDebugView() {
        if (!State.rawKit) return;
        const filter = State.debugFilter;
        const data = filter === 'all' ? State.rawKit : (State.rawKit[filter] || null);
        $('#debug-output').text(JSON.stringify(data, null, 2));
    }

    /* --- Save Helpers --- */
    function saveToElementor(type, data, $btn) {
        const origHtml = $btn.html();
        $btn.html('<span class="spin"></span> Publishing...').prop('disabled', true);
        showToast('loading', 'Syncing payload to Elementor...');

        $.post(gsmCfg.ajax, {
            action: 'gsm_save',
            nonce: gsmCfg.nonce,
            type: type,
            payload: JSON.stringify(data)
        }).done(r => {
            $btn.html(origHtml).prop('disabled', false);
            if (r.success) {
                showToast('ok', 'Published successfully! Elementor CSS cached cleared.');
            } else {
                showToast('err', r.data || 'Failed to save.');
            }
        }).fail(() => {
            $btn.html(origHtml).prop('disabled', false);
            showToast('err', 'Network validation failed.');
        });
    }

    // Toast functionality
    let toastTimer;
    function showToast(type, msg) {
        clearTimeout(toastTimer);
        const $toast = $('#gsm-notice');

        let icon = '';
        if (type === 'ok') icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        if (type === 'err') icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        if (type === 'loading') icon = '<span class="spin"></span>';

        $toast.html(`${icon} <span>${esc(msg)}</span>`)
            .attr('class', `gsm-toast ${type}`)
            .show();

        if (type !== 'loading') {
            toastTimer = setTimeout(() => {
                $toast.fadeOut(300);
            }, 4000);
        }
    }

    function opt(val, sel, text) {
        return `<option value="${esc(val)}"${sel ? ' selected' : ''}>${esc(text || val)}</option>`;
    }

    function esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

})(jQuery);
