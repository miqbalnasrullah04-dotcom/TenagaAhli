<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$names = ['casnan', 'naufal', 'irman', 'yoga'];
foreach ($names as $q) {
    $users = App\Models\User::where('name', 'like', "%$q%")
        ->orWhere('email', 'like', "%$q%")
        ->get();
    foreach ($users as $u) {
        $exp = App\Models\Expert::where('user_id', $u->id)->first();
        echo "Nama: {$u->name}\n";
        echo "Email: {$u->email}\n";
        echo "Role: {$u->role_type} (Role: {$u->role})\n";
        echo "Paket: " . (is_string($u->package) ? $u->package : json_encode($u->package)) . "\n";
        echo "Bidang: " . ($exp ? $exp->field : '-') . "\n";
        echo "----------------------------------------\n";
    }
}
