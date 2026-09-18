<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\EmailVerificationRepositoryInterface;
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Eloquent\EmailVerificationRepository;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Bind repository interfaces to implementations
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(EmailVerificationRepositoryInterface::class, EmailVerificationRepository::class);
    }

    public function boot()
    {
        // Fix for MySQL/MariaDB "Specified key was too long" error
        Schema::defaultStringLength(191);
    }
}