const globals = require('globals');

module.exports = [
    {
        files: ['assets/js/admin.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                jQuery: 'readonly',
                $: 'readonly',
                gsmCfg: 'readonly',
                ajaxurl: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            eqeqeq: 'warn',
        },
    },
];
