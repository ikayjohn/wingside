"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { sanitizeBlogHtml } from '@/lib/security';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  author_name: string;
  category: string;
  published_at: string;
  view_count: number;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog?slug=${slug}`);
      const data = await response.json();

      if (response.ok) {
        setPost(data.post);
      } else {
        setError(data.error || 'Failed to load blog post');
      }
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#552627' }}>
            Blog Post Not Found
          </h1>
          <Link href="/blog" className="inline-block px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="aspect-video md:aspect-[2/1] w-full bg-gray-100">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Category Badge */}
        {post.category && (
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight" style={{ color: '#552627' }}>
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-200 text-sm text-gray-600">
          <span className="font-semibold">{post.author_name}</span>
          <span>•</span>
          <span>{formatDate(post.published_at)}</span>
          <span>•</span>
          <span>{post.view_count || 0} views</span>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }}
          style={{
            color: '#374151',
            lineHeight: '1.8'
          }}
        />

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#552627' }}>
            Share this article
          </h3>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors">
              Facebook
            </button>
            <button className="px-4 py-2 bg-sky-500 text-white rounded-full text-sm font-semibold hover:bg-sky-600 transition-colors">
              Twitter
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600 transition-colors">
              WhatsApp
            </button>
          </div>
        </div>
      </article>

      {/* Related Posts Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: '#552627' }}>
            More from Wingside
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Featured Recipe</h3>
              <p className="text-sm text-gray-600 mb-4">Discover our latest wing recipes</p>
              <Link href="/blog" className="text-sm font-semibold" style={{ color: '#F7C400' }}>
                Read More →
              </Link>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Events & News</h3>
              <p className="text-sm text-gray-600 mb-4">Stay updated with our events</p>
              <Link href="/blog" className="text-sm font-semibold" style={{ color: '#F7C400' }}>
                Read More →
              </Link>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Community Stories</h3>
              <p className="text-sm text-gray-600 mb-4">Stories from our customers</p>
              <Link href="/blog" className="text-sm font-semibold" style={{ color: '#F7C400' }}>
                Read More →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
