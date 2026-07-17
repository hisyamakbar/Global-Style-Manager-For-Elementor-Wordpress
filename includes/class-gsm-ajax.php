<?php
/**
 * AJAX endpoints for reading and writing data
 *
 * @package GSM
 */

if (!defined('ABSPATH')) {
    exit;
}

class GSM_Ajax
{

    private $core;

    public function __construct(GSM_Core $core)
    {
        $this->core = $core;
    }

    public function register()
    {
        add_action('wp_ajax_gsm_get', [$this, 'ajax_get']);
        add_action('wp_ajax_gsm_save', [$this, 'ajax_save']);
        add_action('wp_ajax_gsm_raw_kit', [$this, 'ajax_raw_kit']);
    }

    /* ── AJAX: get ───────────────────────────── */
    public function ajax_get()
    {
        check_ajax_referer('gsm', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_die();
        }
        if (!defined('ELEMENTOR_VERSION')) {
            wp_send_json_error('Elementor is not active.');
            return;
        }

        $kid = $this->core->kit_id();
        if (!$kid) {
            wp_send_json_error('Elementor Active Kit not found. Please open the Elementor editor at least once.');
            return;
        }

        $s = $this->core->kit_settings();
        $doc = $this->core->kit_document();

        // System colors/typography that were never customised are never
        // saved to postmeta, so read them via the Document (which fills in
        // Elementor's own control defaults) instead of the raw kit array.
        $system_colors_raw = $doc ? $doc->get_settings('system_colors') : ($s['system_colors'] ?? []);
        $system_typography_raw = $doc ? $doc->get_settings('system_typography') : ($s['system_typography'] ?? []);

        // ── Colors: normalise — strip leading # ──
        $custom_colors = array_map(function ($c) {
            return ['_id' => $c['_id'] ?? '', 'title' => $c['title'] ?? '', 'color' => strtoupper(ltrim($c['color'] ?? '', '#'))];
        }, $s['custom_colors'] ?? []);

        $system_colors = array_map(function ($c) {
            return ['_id' => $c['_id'] ?? '', 'title' => $c['title'] ?? '', 'color' => strtoupper(ltrim($c['color'] ?? '', '#'))];
        }, is_array($system_colors_raw) ? $system_colors_raw : []);

        // ── Fonts: normalise to flat UI format ──
        $custom_fonts = array_map([$this->core, 'normalise_font'], $s['custom_typography'] ?? []);
        $system_fonts = array_map([$this->core, 'normalise_font'], is_array($system_typography_raw) ? $system_typography_raw : []);

        wp_send_json_success(compact('custom_colors', 'system_colors', 'custom_fonts', 'system_fonts', 'kid'));
    }

    /* ── AJAX: save ──────────────────────────── */
    public function ajax_save()
    {
        check_ajax_referer('gsm', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_die();
        }
        if (!defined('ELEMENTOR_VERSION')) {
            wp_send_json_error('Elementor is not active.');
            return;
        }

        $kid = $this->core->kit_id();
        if (!$kid) {
            wp_send_json_error('Kit not found.');
            return;
        }

        $type = sanitize_text_field($_POST['type'] ?? 'both');
        $payload = json_decode(stripslashes($_POST['payload'] ?? '{}'), true);
        if (!is_array($payload)) {
            wp_send_json_error('Invalid data.');
            return;
        }

        $kit = $this->core->kit_settings();

        if (in_array($type, ['colors', 'both'])) {
            // The 'colors' type accepts either a flat array (custom colors
            // only, for backwards compatibility with older exports) or a
            // {custom_colors, system_colors} object like 'both' uses.
            $is_object_payload = $type === 'both' || isset($payload['custom_colors']) || isset($payload['system_colors']);
            $custom_src = $is_object_payload ? ($payload['custom_colors'] ?? []) : $payload;
            $system_src = $is_object_payload ? ($payload['system_colors'] ?? null) : null;

            $kit['custom_colors'] = $this->build_colors($custom_src);
            // System colors are editable too, but only overwritten when the
            // payload actually carries them (empty means the site has none).
            if (!empty($system_src) && is_array($system_src)) {
                $kit['system_colors'] = $this->build_colors($system_src);
            }
        }
        if (in_array($type, ['fonts', 'both'])) {
            // The 'fonts' type accepts either a flat array (custom fonts
            // only, for backwards compatibility with older exports) or a
            // {custom_fonts, system_fonts} object like 'both' uses.
            $is_object_payload = $type === 'both' || isset($payload['custom_fonts']) || isset($payload['system_fonts']);
            $custom_src = $is_object_payload ? ($payload['custom_fonts'] ?? []) : $payload;
            $system_src = $is_object_payload ? ($payload['system_fonts'] ?? null) : null;

            $kit['custom_typography'] = $this->build_fonts($custom_src);
            // System typography is editable too, but only overwritten when
            // the payload actually carries them (empty means leave as-is).
            if (!empty($system_src) && is_array($system_src)) {
                $kit['system_typography'] = $this->build_fonts($system_src);
            }
        }

        update_post_meta($kid, '_elementor_page_settings', $kit);
        $this->core->flush($kid);
        wp_send_json_success(['msg' => 'Successfully saved!', 'kid' => $kid]);
    }

    /* ── AJAX: raw kit dump ──────────────────── */
    public function ajax_raw_kit()
    {
        check_ajax_referer('gsm', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_die();
        }
        wp_send_json_success($this->core->kit_settings());
    }

    /**
     * Build Elementor color array from UI flat format.
     */
    private function build_colors(array $colors): array
    {
        return array_values(array_filter(array_map(function ($c) {
            if (empty($c['_id'])) {
                return null;
            }
            $color = trim(sanitize_text_field($c['color'] ?? ''));
            // Only prepend # if it's NOT an rgba/hsla function
            if (!preg_match('/^(rgba?|hsla?)\(/i', $color)) {
                $color = '#' . ltrim($color, '#');
            }

            return [
                '_id' => sanitize_text_field($c['_id']),
                'title' => sanitize_text_field($c['title'] ?? ''),
                'color' => $color,
            ];
        }, $colors)));
    }

    /**
     * Build Elementor typography array from UI flat format.
     */
    private function build_fonts(array $fonts): array
    {
        $breakpoints = $this->core->active_breakpoints();

        // Reads {prop}_{bp_key} for every active breakpoint off $f and
        // builds the Elementor-shaped responsive control set, keyed by
        // suffix ('' for desktop, '_tablet', '_laptop', etc.) — whichever
        // breakpoints are actually active on this site, not a hardcoded set.
        $build_responsive = function ($f, $prop, $unit) use ($breakpoints) {
            $res = [];
            foreach ($breakpoints as $bp) {
                $v = $f[$prop . '_' . $bp['key']] ?? null;
                if ($v !== '' && $v !== null) {
                    $res[$bp['suffix']] = ['size' => (float) $v, 'unit' => $unit, 'sizes' => []];
                }
            }
            return $res;
        };

        return array_values(array_filter(array_map(function ($f) use ($build_responsive) {
            if (empty($f['_id'])) {
                return null;
            }

            $res = [
                '_id' => sanitize_text_field($f['_id']),
                'title' => sanitize_text_field($f['title'] ?? ''),
                'typography_typography' => 'custom',
                'typography_font_family' => sanitize_text_field($f['typography_font_family'] ?? ''),
                'typography_font_weight' => sanitize_text_field($f['typography_font_weight'] ?? '400'),
                'typography_font_style' => sanitize_text_field($f['typography_font_style'] ?? ''),
                'typography_text_transform' => sanitize_text_field($f['typography_text_transform'] ?? 'none'),
                'typography_text_decoration' => sanitize_text_field($f['typography_text_decoration'] ?? 'none'),
            ];

            $sz_u = $f['size_unit'] ?? 'px';
            $lh_u = $f['lh_unit'] ?? 'em';
            $ls_u = $f['ls_unit'] ?? 'px';
            $ws_u = $f['ws_unit'] ?? 'px';

            foreach ($build_responsive($f, 'size', $sz_u) as $sfx => $val) {
                $res['typography_font_size' . $sfx] = $val;
            }
            foreach ($build_responsive($f, 'lh', $lh_u) as $sfx => $val) {
                $res['typography_line_height' . $sfx] = $val;
            }
            foreach ($build_responsive($f, 'ls', $ls_u) as $sfx => $val) {
                $res['typography_letter_spacing' . $sfx] = $val;
            }
            foreach ($build_responsive($f, 'ws', $ws_u) as $sfx => $val) {
                $res['typography_word_spacing' . $sfx] = $val;
            }

            return $res;
        }, $fonts)));
    }
}
