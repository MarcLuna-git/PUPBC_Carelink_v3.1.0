# Build context: backend/.

FROM php:8.1-cli

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

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Unahin ang Composer files para reusable ang dependency layer.
COPY composer.json composer.lock ./

# Wala pang .env sa build; skip muna ang Composer scripts.
# Legacy PHP constraints ang dahilan ng platform override.
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --ignore-platform-req=php

COPY . .

RUN mkdir -p storage/framework/{sessions,views,cache,data} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Build default lang ang .env.example; runtime env ang override.
RUN cp .env.example .env 2>/dev/null || true

RUN php artisan key:generate 2>/dev/null || true
RUN php artisan package:discover --ansi 2>/dev/null || true

RUN php artisan storage:link 2>/dev/null || true

# Render ang nagse-set ng PORT.
EXPOSE $PORT

CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT"]
