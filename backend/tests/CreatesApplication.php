<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;

trait CreatesApplication
{
    /** @return \Illuminate\Foundation\Application */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        if ($app->environment() !== 'testing' || config('database.connections.mysql.database') !== 'carelink_stability_testing' || config('database.connections.mysql.host') !== '127.0.0.1' || config('database.connections.mysql.url')) {
            throw new \RuntimeException('Refusing tests outside isolated carelink_stability_testing database.');
        }
        return $app;
    }
}
