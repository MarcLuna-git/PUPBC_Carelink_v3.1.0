<?php

return [


    'default' => env('MAIL_MAILER', 'array'),

    // Explicit staging switch; independent of Railway's environment name.
    'test_mode' => env('EMAIL_TEST_MODE', false),
    'test_recipient' => env('EMAIL_TEST_RECIPIENT', 'delivered@resend.dev'),


    'mailers' => [
        'resend' => [
            'transport' => 'resend',
            'key' => env('RESEND_API_KEY'),
            'from_email' => env('RESEND_FROM_EMAIL'),
            'from_name' => env('RESEND_FROM_NAME', 'PUPBC CareLink'),
            'verified_domain' => env('RESEND_VERIFIED_DOMAIN'),
        ],
        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port' => env('MAIL_PORT', 465),
            'encryption' => env('MAIL_ENCRYPTION', 'ssl'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'auth_mode' => null,
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'mailgun' => [
            'transport' => 'mailgun',
        ],

        'postmark' => [
            'transport' => 'postmark',
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -t -i'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
        ],
    ],


    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],


    'markdown' => [
        'theme' => 'default',

        'paths' => [
            resource_path('views/vendor/mail'),
        ],
    ],

];
