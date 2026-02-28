/**
 * Global Style Manager V5 - Main Scripts
 */

(function ($) {
    'use strict';

    if (typeof gsmCfg === 'undefined') return;

    const GFONTS = gsmCfg.gfonts || [];
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
            mkFont('Primary Headline', 'Plus Jakarta Sans', '700', 48, 36, 28, 1.2, 1.2, 1.2, null, null, null, null, null, null, 'em', 'px', 'px'),
            mkFont('Body Text', 'Plus Jakarta Sans', '400', 16, 15, 14, 1.6, 1.6, 1.6, null, null, null, null, null, null, 'em', 'px', 'px'),
        ];
    }

    function mkFont(title, fam, wt, szD, szT, szM, lhD, lhT, lhM, lsD, lsT, lsM, wsD, wsT, wsM, lhU, lsU, wsU) {
        return {
            _id: generateId(), title,
            typography_font_family: fam,
            typography_font_weight: wt,
            typography_font_style: '',
            typography_text_transform: 'none',
            typography_text_decoration: 'none',
            size_desktop: szD, size_tablet: szT, size_mobile: szM,
            lh_desktop: lhD, lh_tablet: lhT, lh_mobile: lhM, lh_unit: lhU,
            ls_desktop: lsD, ls_tablet: lsT, ls_mobile: lsM, ls_unit: lsU,
            ws_desktop: wsD, ws_tablet: wsT, ws_mobile: wsM, ws_unit: wsU,
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

        // Separate and display only non-system colors in the main grid
        const systemNames = ['primary', 'secondary', 'text', 'accent'];
        const customItems = State.custom_colors.filter(c => {
            const id = (c._id || '').toLowerCase();
            const title = (c.title || '').toLowerCase();
            return !systemNames.some(name => id === name || title === name);
        });

        customItems.forEach((col) => {
            const idx = State.custom_colors.indexOf(col);
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

        // Combine real system colors with default-named custom colors for categorization
        const systemNames = ['primary', 'secondary', 'text', 'accent'];
        const defaults = State.custom_colors.filter(c => {
            const id = (c._id || '').toLowerCase();
            const title = (c.title || '').toLowerCase();
            return systemNames.some(name => id === name || title === name);
        });

        const allSys = [...defaults, ...State.system_colors];
        if (!allSys.length) { $wrap.hide(); return; }

        $wrap.show();
        const $grid = $('#sys-colors-grid').empty();

        allSys.forEach(c => {
            let colorStr = (c.color || '000000').trim();
            let isFunc = /^(rgba?|hsla?)\(/i.test(colorStr);
            let hex = isFunc ? colorStr : '#' + colorStr.replace('#', '');
            $grid.append(`
                <div class="gsm-sys-color-item" data-color="${hex}">
                    <div class="gsm-sys-swatch" style="background:${hex}"></div>
                    <div class="gsm-sys-info">
                        <div class="gsm-sys-name">${esc(c.title)}</div>
                        <div class="gsm-sys-hex">${hex} · ${esc(c._id)}</div>
                    </div>
                </div>
            `);
        });
    }

    /* --- UI Rendering: Typography --- */
    function renderFonts() {
        const $list = $('#fonts-list').empty();

        const systemNames = ['primary', 'secondary', 'text', 'accent'];
        const customItems = State.custom_fonts.filter(f => {
            const id = (f._id || '').toLowerCase();
            const title = (f.title || '').toLowerCase();
            return !systemNames.some(name => id === name || title === name);
        });

        customItems.forEach((f) => {
            const idx = State.custom_fonts.indexOf(f);
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

    function appendFontCard($container, f, idx, isSys) {
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

        const cardHtml = `
            <div class="gsm-font-card ${isSys ? 'gsm-font-card--readonly' : ''}" data-idx="${idx}">
                <div class="gsm-font-header">
                    ${!isSys ? `
                    <span class="gsm-drag-handle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                    </span>` : ''}
                    <input class="gsm-font-title-input js-title" type="text" value="${esc(f.title)}" placeholder="Style Name" ${isSys ? 'disabled' : ''}>
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
                                <input type="text" class="gsm-input js-family" value="${esc(fam)}" placeholder="Search Google Fonts..." ${isSys ? 'disabled' : ''}>
                                <div class="gsm-ac-list js-ac-list"></div>
                            </div>
                        </div>
                    </div>

                    <div class="gsm-font-grid-styles">
                        <div class="gsm-field">
                            <label>Weight</label>
                            <select class="gsm-select js-wt" ${isSys ? 'disabled' : ''}>${wOpts}</select>
                        </div>
                        <div class="gsm-field">
                            <label>Transform</label>
                            <select class="gsm-select js-tt" ${isSys ? 'disabled' : ''}>${ttOpts}</select>
                        </div>
                        <div class="gsm-field">
                            <label>Style</label>
                            <select class="gsm-select js-fs" ${isSys ? 'disabled' : ''}>${fsOpts}</select>
                        </div>
                        <div class="gsm-field">
                            <label>Decoration</label>
                            <select class="gsm-select js-td" ${isSys ? 'disabled' : ''}>${tdOpts}</select>
                        </div>
                    </div>

                    <!-- Responsive Table -->
                    <table class="gsm-font-responsive-table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Unit</th>
                                <th>Desktop</th>
                                <th>Tablet</th>
                                <th>Mobile</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Size -->
                            <tr>
                                <td><label style="font-size:12px;color:#0f172a;">Font Size</label></td>
                                <td><select class="gsm-select js-sz-unit" style="height:30px;" ${isSys ? 'disabled' : ''}>${mkUnit(f.size_unit || 'px')}</select></td>
                                <td><input type="number" class="gsm-input js-sz" data-bp="desktop" value="${f.size_desktop || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                                <td><input type="number" class="gsm-input js-sz" data-bp="tablet" value="${f.size_tablet || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                                <td><input type="number" class="gsm-input js-sz" data-bp="mobile" value="${f.size_mobile || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                            </tr>
                            <!-- Line Height -->
                            <tr>
                                <td><label style="font-size:12px;color:#0f172a;">Line Height</label></td>
                                <td><select class="gsm-select js-lh-unit" style="height:30px;" ${isSys ? 'disabled' : ''}>${mkUnit(f.lh_unit || 'em')}</select></td>
                                <td><input type="number" step="0.1" class="gsm-input js-lh" data-bp="desktop" value="${f.lh_desktop || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                                <td><input type="number" step="0.1" class="gsm-input js-lh" data-bp="tablet" value="${f.lh_tablet || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                                <td><input type="number" step="0.1" class="gsm-input js-lh" data-bp="mobile" value="${f.lh_mobile || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                            </tr>
                            <!-- Letter Spacing -->
                            <tr>
                                <td><label style="font-size:12px;color:#0f172a;">Letter Spacing</label></td>
                                <td><select class="gsm-select js-ls-unit" style="height:30px;" ${isSys ? 'disabled' : ''}>${mkUnit(f.ls_unit || 'px')}</select></td>
                                <td><input type="number" step="0.1" class="gsm-input js-ls" data-bp="desktop" value="${f.ls_desktop || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                                <td><input type="number" step="0.1" class="gsm-input js-ls" data-bp="tablet" value="${f.ls_tablet || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                                <td><input type="number" step="0.1" class="gsm-input js-ls" data-bp="mobile" value="${f.ls_mobile || ''}" placeholder="-" style="height:30px;" ${isSys ? 'disabled' : ''}></td>
                            </tr>
                        </tbody>
                    </table>

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

        if (isSys) return; // Only bind inputs for non-system fonts

        $card.find('.js-title').on('input', function () { State.custom_fonts[idx].title = this.value; syncJsonEditor(); });
        $card.find('.js-id').on('input', function () {
            const safeVal = this.value.replace(/[^a-z0-9-]/g, '').toLowerCase().slice(0, 15);
            this.value = safeVal; State.custom_fonts[idx]._id = safeVal;
            renderCSSVariables(); syncJsonEditor();
        });

        // Autocomplete & other bindings remain for custom fonts...
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
            State.custom_fonts[idx].typography_font_family = v;
            $card.find('.js-preview').css('font-family', `'${v}'`);
            renderCSSVariables(); syncJsonEditor();
        });

        $card.find('.js-wt').on('change', function () { State.custom_fonts[idx].typography_font_weight = this.value; $card.find('.js-preview').css('font-weight', this.value); renderCSSVariables(); syncJsonEditor(); });
        $card.find('.js-tt').on('change', function () { State.custom_fonts[idx].typography_text_transform = this.value; syncJsonEditor(); });
        $card.find('.js-fs').on('change', function () { State.custom_fonts[idx].typography_font_style = this.value; syncJsonEditor(); });
        $card.find('.js-td').on('change', function () { State.custom_fonts[idx].typography_text_decoration = this.value; syncJsonEditor(); });

        const syncProp = (cls, prop) => {
            $card.find(cls).on('input', function () {
                const bp = $(this).data('bp');
                State.custom_fonts[idx][`${prop}_${bp}`] = this.value !== '' ? parseFloat(this.value) : null;
                if (prop === 'size') renderCSSVariables();
                syncJsonEditor();
            });
        };
        syncProp('.js-sz', 'size');
        syncProp('.js-lh', 'lh');
        syncProp('.js-ls', 'ls');

        $card.find('.js-sz-unit').on('change', function () { State.custom_fonts[idx].size_unit = this.value; renderCSSVariables(); syncJsonEditor(); });
        $card.find('.js-lh-unit').on('change', function () { State.custom_fonts[idx].lh_unit = this.value; syncJsonEditor(); });
        $card.find('.js-ls-unit').on('change', function () { State.custom_fonts[idx].ls_unit = this.value; syncJsonEditor(); });

        $card.find('.js-delete').on('click', () => {
            State.custom_fonts.splice(idx, 1);
            renderFonts();
            renderCSSVariables();
            syncJsonEditor();
        });
    }

    function renderSysFonts() {
        const $wrap = $('#sys-fonts-wrap');

        const systemNames = ['primary', 'secondary', 'text', 'accent'];
        const defaults = State.custom_fonts.filter(f => {
            const id = (f._id || '').toLowerCase();
            const title = (f.title || '').toLowerCase();
            return systemNames.some(name => id === name || title === name);
        });

        const allSys = [...defaults, ...State.system_fonts];
        if (!allSys.length) { $wrap.hide(); return; }

        $wrap.show();
        const $grid = $('#sys-fonts-list').empty();

        allSys.forEach((f) => {
            const fam = f.typography_font_family || 'Inherit';
            const wt = f.typography_font_weight || '400';
            const size = f.size_desktop ? `${f.size_desktop}${f.size_unit || 'px'}` : '-';
            const lh = f.lh_desktop ? `${f.lh_desktop}${f.lh_unit || 'em'}` : '-';

            $grid.append(`
                <div class="gsm-sys-font-item">
                    <div class="gsm-sys-font-name">
                        <span>${esc(f.title)}</span>
                        <span class="gsm-sys-font-id">${esc(f._id)}</span>
                    </div>
                    <div class="gsm-sys-font-meta">
                        Size: ${size} · LH: ${lh} · WT: ${wt}
                    </div>
                    <div class="gsm-sys-font-preview" style="font-family:'${fam}'; font-weight:${wt}; font-size: 16px; margin-top: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--gsm-text-base);">
                        The quick brown fox jumps over the lazy dog.
                    </div>
                </div>
            `);
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
            saveToElementor('both', { custom_colors: State.custom_colors, custom_fonts: State.custom_fonts }, $(this));
        });

        $('#btn-export').on('click', function () {
            const data = {
                version: "5.0.0",
                exported_at: new Date().toISOString(),
                custom_colors: State.custom_colors,
                custom_fonts: State.custom_fonts
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
        const data = t === 'colors' ? State.custom_colors : t === 'fonts' ? State.custom_fonts : { custom_colors: State.custom_colors, custom_fonts: State.custom_fonts };
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
                    if (!Array.isArray(d)) throw new Error('Root must be an array for Colors');
                    State.custom_colors = d;
                } else if (type === 'fonts') {
                    if (!Array.isArray(d)) throw new Error('Root must be an array for Typography');
                    State.custom_fonts = d;
                } else {
                    if (d.custom_colors) State.custom_colors = d.custom_colors;
                    if (d.custom_fonts) State.custom_fonts = d.custom_fonts;
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

                        State.custom_fonts.push({
                            _id: f._id || generateId(),
                            title: f.title || 'Imported Font',
                            typography_font_family: f.typography_font_family || '',
                            typography_font_weight: f.typography_font_weight || '400',
                            typography_font_style: f.typography_font_style || '',
                            typography_text_transform: f.typography_text_transform || 'none',
                            typography_text_decoration: f.typography_text_decoration || 'none',
                            size_desktop: (f.size_desktop !== undefined) ? f.size_desktop : null,
                            size_tablet: (f.size_tablet !== undefined) ? f.size_tablet : null,
                            size_mobile: (f.size_mobile !== undefined) ? f.size_mobile : null,
                            lh_desktop: (f.lh_desktop !== undefined) ? f.lh_desktop : null,
                            lh_tablet: (f.lh_tablet !== undefined) ? f.lh_tablet : null,
                            lh_mobile: (f.lh_mobile !== undefined) ? f.lh_mobile : null,
                            lh_unit: f.lh_unit || 'em',
                            ls_desktop: (f.ls_desktop !== undefined) ? f.ls_desktop : null,
                            ls_tablet: (f.ls_tablet !== undefined) ? f.ls_tablet : null,
                            ls_mobile: (f.ls_mobile !== undefined) ? f.ls_mobile : null,
                            ls_unit: f.ls_unit || 'px',
                            ws_desktop: (f.ws_desktop !== undefined) ? f.ws_desktop : null,
                            ws_tablet: (f.ws_tablet !== undefined) ? f.ws_tablet : null,
                            ws_mobile: (f.ws_mobile !== undefined) ? f.ws_mobile : null,
                            ws_unit: f.ws_unit || 'px',
                        });
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
        return `< option value = "${esc(val)}"${sel ? ' selected' : ''}> ${esc(text || val)}</option > `;
    }

    function esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

})(jQuery);
