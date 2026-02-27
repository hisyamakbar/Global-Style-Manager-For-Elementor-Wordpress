<?php
/**
 * Plugin Name: GSM
 * Description: Manage Elementor Custom Colors & Typography efficiently.
 * Version:     1.0.0
 * License:     GPL2
 * Text Domain: global-style-manager
 */

if (!defined('ABSPATH')) {
    exit;
}

define('GSM_VER', '1.0.0');
define('GSM_DIR', plugin_dir_path(__FILE__));
define('GSM_URL', plugin_dir_url(__FILE__));

// Autoload or require core files
require_once GSM_DIR . 'includes/class-gsm-core.php';
require_once GSM_DIR . 'includes/class-gsm-ajax.php';
require_once GSM_DIR . 'includes/class-gsm-admin.php';

class Global_Style_Manager
{

    private static $instance = null;

    public $core;
    public $ajax;
    public $admin;

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->init();
    }

    private function init()
    {
        // Initialize core dependencies
        $this->core = new GSM_Core();
        $this->ajax = new GSM_Ajax($this->core);
        $this->admin = new GSM_Admin($this->core);

        // Hook up
        $this->ajax->register();
        $this->admin->register();
    }
}

// Bootstrap
function run_global_style_manager()
{
    Global_Style_Manager::get_instance();
}

run_global_style_manager();
