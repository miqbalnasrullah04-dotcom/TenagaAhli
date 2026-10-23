@php $a = $article; @endphp

<div>
    <label class="block text-xs font-semibold uppercase tracking-wide text-[#6B4F3A] mb-1.5">Judul</label>
    <input type="text" name="title" value="{{ old('title', $a->title ?? '') }}"
           class="w-full rounded-lg border border-[#3E2B1F]/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E5E3B]/40 focus:border-[#2E5E3B] outline-none"
           placeholder="Judul berita/pamflet" required>
    @error('title') <p class="text-xs text-red-600 mt-1">{{ $message }}</p> @enderror
</div>

<div>
    <label class="block text-xs font-semibold uppercase tracking-wide text-[#6B4F3A] mb-1.5">Sumber</label>
    <input type="text" name="source" value="{{ old('source', $a->source ?? '') }}"
           class="w-full rounded-lg border border-[#3E2B1F]/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E5E3B]/40 focus:border-[#2E5E3B] outline-none"
           placeholder="Sumber berita atau informasi proyek (misal: Kompas, KemenPUPR, dll)">
    @error('source') <p class="text-xs text-red-600 mt-1">{{ $message }}</p> @enderror
</div>

<div>
    <label class="block text-xs font-semibold uppercase tracking-wide text-[#6B4F3A] mb-1.5">Ringkasan Singkat</label>
    <textarea name="excerpt" rows="2"
              class="w-full rounded-lg border border-[#3E2B1F]/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E5E3B]/40 focus:border-[#2E5E3B] outline-none">{{ old('excerpt', $a->excerpt ?? '') }}</textarea>
    @error('excerpt') <p class="text-xs text-red-600 mt-1">{{ $message }}</p> @enderror
</div>

<div>
    <label class="block text-xs font-semibold uppercase tracking-wide text-[#6B4F3A] mb-1.5">Isi Lengkap</label>
    <textarea name="content" rows="8"
              class="w-full rounded-lg border border-[#3E2B1F]/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E5E3B]/40 focus:border-[#2E5E3B] outline-none">{{ old('content', $a->content ?? '') }}</textarea>
    @error('content') <p class="text-xs text-red-600 mt-1">{{ $message }}</p> @enderror
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
        <label class="block text-xs font-semibold uppercase tracking-wide text-[#6B4F3A] mb-1.5">Tanggal Terbit</label>
        <input type="datetime-local" name="published_at"
               value="{{ old('published_at', $a?->published_at?->format('Y-m-d\TH:i')) }}"
               class="w-full rounded-lg border border-[#3E2B1F]/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E5E3B]/40 focus:border-[#2E5E3B] outline-none">
        @error('published_at') <p class="text-xs text-red-600 mt-1">{{ $message }}</p> @enderror
    </div>

    <div>
        <label class="block text-xs font-semibold uppercase tracking-wide text-[#6B4F3A] mb-1.5">Thumbnail</label>
        @if (!empty($a?->thumbnail))
            <img src="{{ asset('storage/'.$a->thumbnail) }}" class="w-24 h-16 rounded-md object-cover mb-2 border border-[#3E2B1F]/10">
        @endif
        <input type="file" name="thumbnail" accept="image/*"
               class="w-full text-sm text-[#6B4F3A] file:mr-3 file:rounded-full file:border-0 file:bg-[#2E5E3B]/10 file:text-[#2E5E3B] file:px-4 file:py-2 file:text-xs file:font-medium">
        @error('thumbnail') <p class="text-xs text-red-600 mt-1">{{ $message }}</p> @enderror
    </div>
</div>
