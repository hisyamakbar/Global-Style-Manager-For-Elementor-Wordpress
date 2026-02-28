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
        $get_responsive = function ($base_key) use ($f) {
            $d = $f[$base_key] ?? null;
            $t = $f[$base_key . '_tablet'] ?? null;
            $m = $f[$base_key . '_mobile'] ?? null;
            return [
                'd' => is_array($d) ? ($d['size'] ?? null) : null,
                't' => is_array($t) ? ($t['size'] ?? null) : null,
                'm' => is_array($m) ? ($m['size'] ?? null) : null,
                'unit' => is_array($d) && !empty($d['unit']) ? $d['unit'] : null
            ];
        };

        $sz = $get_responsive('typography_font_size');
        // Backwards capability fallback for sizes within typography_font_size['sizes']
        if (empty($sz['t']) && empty($sz['m'])) {
            $fs = $f['typography_font_size'] ?? [];
            if (is_array($fs) && !empty($fs['sizes'])) {
                $sz['t'] = $fs['sizes']['tablet'] ?? $sz['t'];
                $sz['m'] = $fs['sizes']['mobile'] ?? $sz['m'];
                $sz['d'] = $fs['sizes']['desktop'] ?? $sz['d'];
            }
        }

        $lh = $get_responsive('typography_line_height');
        $ls = $get_responsive('typography_letter_spacing');
        $ws = $get_responsive('typography_word_spacing');

        return [
            '_id' => $f['_id'] ?? '',
            'title' => $f['title'] ?? '',
            'typography_font_family' => $f['typography_font_family'] ?? '',
            'typography_font_weight' => $f['typography_font_weight'] ?? '400',
            'typography_font_style' => $f['typography_font_style'] ?? '',
            'typography_text_transform' => $f['typography_text_transform'] ?? 'none',
            'typography_text_decoration' => $f['typography_text_decoration'] ?? 'none',
            'size_desktop' => $sz['d'],
            'size_tablet' => $sz['t'],
            'size_mobile' => $sz['m'],
            'size_unit' => $sz['unit'] ?: 'px',
            'lh_desktop' => $lh['d'],
            'lh_tablet' => $lh['t'],
            'lh_mobile' => $lh['m'],
            'lh_unit' => $lh['unit'] ?: 'em',
            'ls_desktop' => $ls['d'],
            'ls_tablet' => $ls['t'],
            'ls_mobile' => $ls['m'],
            'ls_unit' => $ls['unit'] ?: 'px',
            'ws_desktop' => $ws['d'],
            'ws_tablet' => $ws['t'],
            'ws_mobile' => $ws['m'],
            'ws_unit' => $ws['unit'] ?: 'px',
        ];
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
