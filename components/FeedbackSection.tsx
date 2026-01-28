"use client";

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function FeedbackSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Let us know how to improve your wing experience
          </h2>
          <p className="text-sm text-gray-600">
            We value your feedback and use it to make Wingside better for you
          </p>
        </div>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors whitespace-nowrap"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Contact Support</span>
        </Link>
      </div>
    </div>
  );
}
