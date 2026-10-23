<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('consultations:send-reminders')->everyFiveMinutes();
\Illuminate\Support\Facades\Schedule::command('membership:process-expired')->daily();
