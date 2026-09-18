<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'kiosk/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        env('APP_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.1.3:3000',
        env('FRONTEND_URL', 'http://localhost:3000'),
        // Render deployment domains (live services)
        'https://pup-carelink-testing-frontend.onrender.com',
        'https://pup-carelink-testing-backend.onrender.com',
        'https://carelink-frontend.onrender.com',
        'https://carelink-backend.onrender.com',
    ],

    'allowed_origins_patterns' => [
        // NOTE: these patterns are passed STRAIGHT to preg_match() by
        // asm89/stack-cors, so they MUST include regex delimiters (#...#).
        // Allow any local network IP during development
        '#^http://192\.168\.\d+\.\d+:3000$#i',
        '#^http://192\.168\.\d+\.\d+:5173$#i',
        // Allow any *.onrender.com subdomain (Render may append random
        // suffixes on name collisions; keeps CORS working across URL changes)
        '#^https://[a-z0-9-]+\.onrender\.com$#i',
    ],

    'allowed_headers' => [
        'Authorization',
        'Content-Type',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-Socket-Id',
        'X-Kiosk-Token',
    ],

    'exposed_headers' => [
        'Authorization',
        'Content-Disposition',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'Retry-After',
    ],

    'max_age' => 86400, // 24 hours cache for preflight requests

    'supports_credentials' => true,

];