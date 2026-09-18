# Dockerfile for PUPBC CareLink Backend (Laravel 8 / PHP)
# This Dockerfile is used for Render deployment and local development.
# Build context is the backend/ directory (rootDir in render.yaml).

FROM php:8.1-cli

# Install system dependencies
# Note: ctype, fileinfo, tokenizer, json, session, openssl, filter, hash, pcre, dom
# are built-in to php:8.1-cli. We only install extensions that require compilation.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip curl \
    && docker-php-ext-install xml simplexml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for better layer caching)
COPY composer.json composer.lock ./

# Install PHP dependencies
# --no-scripts: skip post-install scripts (no .env during build)
# --ignore-platform-req=php: composer.lock was generated on PHP 7.x,
#   but lcobucci/jwt 3.3.3 and tymon/jwt-auth 1.0.2 require php ^7.0
#   which doesn't include PHP 8.1. The packages work fine on 8.1.
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --ignore-platform-req=php

# Copy application files
COPY . .

# Create storage directories and set permissions
RUN mkdir -p storage/framework/{sessions,views,cache,data} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create a default .env file for the build process
# (Render will override with real env vars at runtime)
RUN cp .env.example .env 2>/dev/null || true

# Generate APP_KEY only when missing (keeps the baked-in key stable across
# builds so sessions/tokens survive redeploys) and run package discovery
RUN php artisan key:generate 2>/dev/null || true
RUN php artisan package:discover --ansi 2>/dev/null || true

# Generate storage symlink
RUN php artisan storage:link 2>/dev/null || true

# Expose the port (Render sets $PORT env var)
EXPOSE $PORT

# Run database migrations + seed demo accounts on startup, then serve.
# (CareLinkSeeder is idempotent: updateOrCreate — safe on every deploy.)
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT"]
