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

        // ── Colors: normalise — strip leading # ──
        $custom_colors = array_map(function ($c) {
            return ['_id' => $c['_id'] ?? '', 'title' => $c['title'] ?? '', 'color' => strtoupper(ltrim($c['color'] ?? '', '#'))];
        }, $s['custom_colors'] ?? []);

        $system_colors = array_map(function ($c) {
            return ['_id' => $c['_id'] ?? '', 'title' => $c['title'] ?? '', 'color' => strtoupper(ltrim($c['color'] ?? '', '#'))];
        }, $s['system_colors'] ?? []);

        // ── Fonts: normalise to flat UI format ──
        $custom_fonts = array_map([$this->core, 'normalise_font'], $s['custom_typography'] ?? []);
        $system_fonts = array_map([$this->core, 'normalise_font'], $s['system_typography'] ?? []);

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
            $src = $type === 'both' ? ($payload['custom_colors'] ?? []) : $payload;
            $kit['custom_colors'] = $this->build_colors($src);
            // System colors should never be updated from here.
        }
        if (in_array($type, ['fonts', 'both'])) {
            $src = $type === 'both' ? ($payload['custom_fonts'] ?? []) : $payload;
            $kit['custom_typography'] = $this->build_fonts($src);
            // System typography should never be updated from here.
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
        return array_values(array_filter(array_map(function ($f) {
            if (empty($f['_id'])) {
                return null;
            }

            $build_responsive = function ($d, $t, $m, $unit) {
                $res = [];
                if ($d !== '' && $d !== null) {
                    $res[''] = ['size' => (float) $d, 'unit' => $unit, 'sizes' => []];
                }
                if ($t !== '' && $t !== null) {
                    $res['_tablet'] = ['size' => (float) $t, 'unit' => $unit, 'sizes' => []];
                }
                if ($m !== '' && $m !== null) {
                    $res['_mobile'] = ['size' => (float) $m, 'unit' => $unit, 'sizes' => []];
                }
                return $res;
            };

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

            $sz_d = $f['size_desktop'] ?? null;
            $sz_t = $f['size_tablet'] ?? null;
            $sz_m = $f['size_mobile'] ?? null;
            $lh_d = $f['lh_desktop'] ?? null;
            $lh_t = $f['lh_tablet'] ?? null;
            $lh_m = $f['lh_mobile'] ?? null;
            $ls_d = $f['ls_desktop'] ?? null;
            $ls_t = $f['ls_tablet'] ?? null;
            $ls_m = $f['ls_mobile'] ?? null;
            $ws_d = $f['ws_desktop'] ?? null;
            $ws_t = $f['ws_tablet'] ?? null;
            $ws_m = $f['ws_mobile'] ?? null;

            $lh_u = $f['lh_unit'] ?? 'em';
            $ls_u = $f['ls_unit'] ?? 'px';
            $ws_u = $f['ws_unit'] ?? 'px';

            $sz_u = $f['size_unit'] ?? 'px';
            foreach ($build_responsive($sz_d, $sz_t, $sz_m, $sz_u) as $sfx => $val) {
                $res['typography_font_size' . $sfx] = $val;
            }
            foreach ($build_responsive($lh_d, $lh_t, $lh_m, $lh_u) as $sfx => $val) {
                $res['typography_line_height' . $sfx] = $val;
            }
            foreach ($build_responsive($ls_d, $ls_t, $ls_m, $ls_u) as $sfx => $val) {
                $res['typography_letter_spacing' . $sfx] = $val;
            }
            foreach ($build_responsive($ws_d, $ws_t, $ws_m, $ws_u) as $sfx => $val) {
                $res['typography_word_spacing' . $sfx] = $val;
            }

            return $res;
        }, $fonts)));
    }
}
