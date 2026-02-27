<?php
/**
 * Admin Setup (Menus, Scripts)
 *
 * @package GSM
 */

if (!defined('ABSPATH')) {
    exit;
}

class GSM_Admin
{

    private $core;

    public function __construct(GSM_Core $core)
    {
        $this->core = $core;
    }

    public function register()
    {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue']);
        add_action('admin_head', [$this, 'full_width_style']);
        add_action('admin_bar_menu', [$this, 'admin_bar'], 100);
    }

    public function admin_bar($bar)
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        $bar->add_node([
            'id' => 'gsm',
            'title' => 'Global Style Manager',
            'href' => admin_url('admin.php?page=gsm')
        ]);
    }

    public function add_menu()
    {
        add_menu_page('Style Manager', 'Style Manager', 'manage_options', 'gsm', [$this, 'page'], 'dashicons-art', 58);
    }

    public function full_width_style()
    {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'toplevel_page_gsm') {
            return;
        }
        // Force full width for modern UI
        echo '<style>#wpcontent{padding-left:0!important}#wpbody-content{padding-bottom:0}.wrap{margin:0;max-width:none}</style>';
    }

    public function enqueue($hook)
    {
        if ($hook !== 'toplevel_page_gsm') {
            return;
        }

        // CSS
        wp_enqueue_style('gsm-global-css', GSM_URL . 'assets/css/admin.css', [], GSM_VER);

        // Optional modern fonts for admin UI
        wp_enqueue_style('gsm-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap', [], null);

        // JS
        wp_enqueue_script('gsm-admin-js', GSM_URL . 'assets/js/admin.js', ['jquery', 'jquery-ui-sortable'], GSM_VER, true);

        // Pass data
        wp_localize_script('gsm-admin-js', 'gsmCfg', [
            'ajax' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('gsm'),
            'has_el' => defined('ELEMENTOR_VERSION'),
            'el_ver' => defined('ELEMENTOR_VERSION') ? ELEMENTOR_VERSION : null,
            'has_pro' => defined('ELEMENTOR_PRO_VERSION'),
            'kit_id' => $this->core->kit_id(),
            'gfonts' => $this->core->gfonts(),
        ]);
    }

    public function page()
    {
        $kid = $this->core->kit_id();
        $has_el = defined('ELEMENTOR_VERSION');
        $el_ver = $has_el ? ELEMENTOR_VERSION : '—';
        $has_pro = defined('ELEMENTOR_PRO_VERSION');

        include dirname(__DIR__) . '/views/admin-page.php';
    }
}
