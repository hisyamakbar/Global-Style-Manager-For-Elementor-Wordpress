<?php
/**
 * Core Methods (Elementor integration, reading/writing kit)
 *
 * @package GSM
 */

if (!defined('ABSPATH')) {
    exit;
}

class GSM_Core
{

    /**
     * Get the active Elementor Kit ID.
     */
    public function kit_id()
    {
        return (int) get_option('elementor_active_kit');
    }

    /**
     * Get the active Elementor Kit as a Document, so control defaults
     * (e.g. system_colors/system_typography that were never customised
     * and so were never saved to postmeta) are filled in the same way
     * Elementor's own editor fills them.
     */
    public function kit_document()
    {
        $kid = $this->kit_id();
        if (!$kid || !class_exists('\Elementor\Plugin')) {
            return null;
        }
        return \Elementor\Plugin::$instance->documents->get($kid);
    }

    /**
     * List the responsive breakpoints actually active on this site, ordered
     * smallest to largest screen size, with 'desktop' as the implicit base
     * breakpoint (no suffix) sitting between Laptop and Widescreen. Sourced
     * from Elementor's Breakpoints Manager so sites with Laptop/Widescreen/
     * Mobile Extra/Tablet Extra enabled get those columns too, instead of a
     * hardcoded desktop/tablet/mobile set.
     */
    public function active_breakpoints(): array
    {
        if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->breakpoints)) {
            // Smallest to largest screen size; 'desktop' is not a real
            // Elementor breakpoint object (it's the implicit base/fallback
            // value with no suffix), so it's spliced in by position here.
            $order = ['mobile', 'mobile_extra', 'tablet', 'tablet_extra', 'laptop', 'desktop', 'widescreen'];
            $active = \Elementor\Plugin::$instance->breakpoints->get_active_breakpoints();
            $out = [];
            foreach ($order as $key) {
                if ($key === 'desktop') {
                    $out[] = ['key' => 'desktop', 'label' => 'Desktop', 'suffix' => ''];
                    continue;
                }
                if (isset($active[$key])) {
                    $out[] = [
                        'key' => $key,
                        'label' => method_exists($active[$key], 'get_label') ? $active[$key]->get_label() : ucfirst(str_replace('_', ' ', $key)),
                        'suffix' => '_' . $key,
                    ];
                }
            }
            return $out;
        }

        // Fallback for Elementor versions without a Breakpoints Manager.
        return [
            ['key' => 'mobile', 'label' => 'Mobile', 'suffix' => '_mobile'],
            ['key' => 'tablet', 'label' => 'Tablet', 'suffix' => '_tablet'],
            ['key' => 'desktop', 'label' => 'Desktop', 'suffix' => ''],
        ];
    }

    /**
     * Get the settings of the active Elementor Kit.
     */
    public function kit_settings()
    {
        $kid = $this->kit_id();
        if (!$kid) {
            return [];
        }

        $s = get_post_meta($kid, '_elementor_page_settings', true);
        if (is_array($s) && !empty($s)) {
            return $s;
        }

        // Fallback: try reading from _elementor_data (some Elementor versions store settings differently)
        $elementor_data = get_post_meta($kid, '_elementor_data', true);
        if ($elementor_data) {
            $parsed = json_decode($elementor_data, true);
            if (is_array($parsed) && isset($parsed[0]['settings'])) {
                return $parsed[0]['settings'];
            }
        }

        return [];
    }

    /**
     * Flush Elementor cache site-wide so that changes take effect.
     */
    public function flush($kid)
    {
        // 1. Delete the Kit's CSS meta reference so Elementor regenerates it
        delete_post_meta($kid, '_elementor_css');

        // 2. Use Elementor's official cache clearing if available
        if (class_exists('\Elementor\Plugin')) {
            try {
                if (method_exists(\Elementor\Plugin::$instance->files_manager, 'clear_cache')) {
                    \Elementor\Plugin::$instance->files_manager->clear_cache();
                }
            } catch (\Exception $e) {
                // Ignore exception if clearing fails
            }
        }

        // 3. Force breakpoints/CSS regeneration site-wide
        update_option('elementor-custom-breakpoints-files', '');

        // 4. Manual CSS file cleanup as fallback
        $dir = wp_upload_dir()['basedir'] . '/elementor/css/';
        foreach (["post-{$kid}.css", 'global.css'] as $f) {
            if (file_exists($dir . $f)) {
                @unlink($dir . $f);
            }
        }

        // 5. Touch the post to update modified timestamp
        wp_update_post(['ID' => $kid]);
    }

    /**
     * Flatten Elementor font record → UI-friendly flat object.
     */
    public function normalise_font(array $f): array
    {
        $breakpoints = $this->active_breakpoints();

        // Returns ['{bp_key}' => size, ..., 'unit' => ...] for a given base
        // control name (e.g. 'typography_font_size'), reading whichever
        // breakpoint suffixes are actually active on this site instead of a
        // hardcoded desktop/tablet/mobile set.
        $get_responsive = function ($base_key) use ($f, $breakpoints) {
            $out = ['unit' => null];
            foreach ($breakpoints as $bp) {
                $v = $f[$base_key . $bp['suffix']] ?? null;
                $out[$bp['key']] = is_array($v) ? ($v['size'] ?? null) : null;
                if ($bp['suffix'] === '' && is_array($v) && !empty($v['unit'])) {
                    $out['unit'] = $v['unit'];
                }
            }
            return $out;
        };

        $sz = $get_responsive('typography_font_size');
        // Backwards capability fallback: pre-multi-breakpoint Elementor
        // stored tablet/mobile sizes nested under ['sizes'] instead of as
        // separate '_tablet'/'_mobile' controls. This legacy shape only
        // ever had tablet/mobile, never the newer breakpoints.
        if (empty($sz['tablet'] ?? null) && empty($sz['mobile'] ?? null)) {
            $fs = $f['typography_font_size'] ?? [];
            if (is_array($fs) && !empty($fs['sizes'])) {
                if (isset($sz['tablet'])) {
                    $sz['tablet'] = $fs['sizes']['tablet'] ?? $sz['tablet'];
                }
                if (isset($sz['mobile'])) {
                    $sz['mobile'] = $fs['sizes']['mobile'] ?? $sz['mobile'];
                }
                $sz['desktop'] = $fs['sizes']['desktop'] ?? $sz['desktop'];
            }
        }

        $lh = $get_responsive('typography_line_height');
        $ls = $get_responsive('typography_letter_spacing');
        $ws = $get_responsive('typography_word_spacing');

        $out = [
            '_id' => $f['_id'] ?? '',
            'title' => $f['title'] ?? '',
            'typography_font_family' => $f['typography_font_family'] ?? '',
            'typography_font_weight' => $f['typography_font_weight'] ?? '400',
            'typography_font_style' => $f['typography_font_style'] ?? '',
            'typography_text_transform' => $f['typography_text_transform'] ?? 'none',
            'typography_text_decoration' => $f['typography_text_decoration'] ?? 'none',
            'size_unit' => $sz['unit'] ?: 'px',
            'lh_unit' => $lh['unit'] ?: 'em',
            'ls_unit' => $ls['unit'] ?: 'px',
            'ws_unit' => $ws['unit'] ?: 'px',
        ];

        foreach ($breakpoints as $bp) {
            $out['size_' . $bp['key']] = $sz[$bp['key']];
            $out['lh_' . $bp['key']] = $lh[$bp['key']];
            $out['ls_' . $bp['key']] = $ls[$bp['key']];
            $out['ws_' . $bp['key']] = $ws[$bp['key']];
        }

        return $out;
    }

    /**
     * List of popular Google Fonts for autocomplete.
     */
    public function gfonts()
    {
        return [
            'Inter',
            'Roboto',
            'Open Sans',
            'Lato',
            'Montserrat',
            'Poppins',
            'Raleway',
            'Nunito',
            'Oswald',
            'Merriweather',
            'Playfair Display',
            'Ubuntu',
            'Source Sans Pro',
            'Noto Sans',
            'Rubik',
            'Work Sans',
            'Mulish',
            'DM Sans',
            'Outfit',
            'Plus Jakarta Sans',
            'Sora',
            'Manrope',
            'Libre Baskerville',
            'Crimson Text',
            'EB Garamond',
            'Cormorant Garamond',
            'Josefin Sans',
            'Jost',
            'Space Grotesk',
            'Figtree',
            'Be Vietnam Pro',
            'Lexend',
            'Albert Sans',
            'Bricolage Grotesque',
            'Instrument Sans',
            'DM Serif Display',
            'Fraunces',
            'Roboto Slab',
            'Roboto Condensed',
            'Roboto Mono',
        ];
    }
}
