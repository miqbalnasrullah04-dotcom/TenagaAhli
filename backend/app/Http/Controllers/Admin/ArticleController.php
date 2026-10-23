<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $articles = Article::when($request->q, fn ($q) => $q->where('title', 'like', "%{$request->q}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return view('admin.articles.index', compact('articles'));
    }

    public function create()
    {
        return view('admin.articles.create');
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('articles', 'public');
        }

        Article::create($data);

        return redirect()->route('admin.articles.index')->with('success', 'Berita/pamflet berhasil ditambahkan.');
    }

    public function edit(Article $article)
    {
        return view('admin.articles.edit', compact('article'));
    }

    public function update(Request $request, Article $article)
    {
        $data = $this->validated($request);

        if ($request->hasFile('thumbnail')) {
            if ($article->thumbnail) Storage::disk('public')->delete($article->thumbnail);
            $data['thumbnail'] = $request->file('thumbnail')->store('articles', 'public');
        }

        $article->update($data);

        return redirect()->route('admin.articles.index')->with('success', 'Berita/pamflet berhasil diperbarui.');
    }

    public function destroy(Article $article)
    {
        if ($article->thumbnail) Storage::disk('public')->delete($article->thumbnail);
        $article->delete();

        return redirect()->route('admin.articles.index')->with('success', 'Berita/pamflet berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title'        => 'required|string|max:255',
            'source'       => 'nullable|string|max:255',
            'excerpt'      => 'nullable|string|max:500',
            'content'      => 'nullable|string',
            'published_at' => 'nullable|date',
            'thumbnail'    => 'nullable|image|max:2048',
        ]);
    }
}
