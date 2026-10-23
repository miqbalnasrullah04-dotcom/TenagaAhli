<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('expert_id')->constrained('experts')->onDelete('cascade');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->string('title');
                $table->string('category')->default('other');
                $table->unsignedBigInteger('price')->default(0);
                $table->unsignedBigInteger('discount_price')->nullable();
                $table->integer('stock')->nullable();
                $table->boolean('is_digital')->default(true);
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->string('status')->default('active');
                $table->unsignedInteger('sold_count')->default(0);
                $table->decimal('rating', 3, 2)->default(0.00);
                $table->unsignedInteger('reviews_count')->default(0);
                $table->boolean('is_featured')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
