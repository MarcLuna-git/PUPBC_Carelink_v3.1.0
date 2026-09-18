<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Server Script For The "PHP" Command
|----------------------------------------------|
| This file allows us to emulate Apache's "mod_rewrite" functionality from
| the PHP built-in server. This provides a convenient way to test a Laravel
| application without having installed any web server software here.
*/

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// If the requested URI is a static file that exists in the public directory,
// we let the built-in server serve it directly.
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Otherwise, we hand the request off to Laravel via the front controller.
require_once __DIR__ . '/public/index.php';
