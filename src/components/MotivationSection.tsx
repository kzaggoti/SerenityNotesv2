"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic']
});

interface MotivationSectionProps {
  userId: string;
  userData: {
    surveyData: any;
    journalEntries: any[];
  } | null;
}

export default function MotivationSection({ userId, userData }: MotivationSectionProps) {
  const [quotes, setQuotes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateMotivation = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/openai/motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate motivation');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error generating motivation:', error);
      setError('Failed to generate motivation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      generateMotivation();
    }
  }, [userData]);

  // Convert markdown-style bold to JSX
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return <strong key={index} className="font-bold">{content}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 bg-[#788585] rounded-lg p-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold text-gray-800 ${cormorant.className}`}>
          Daily Motivation
        </h2>
        <button
          onClick={generateMotivation}
          disabled={loading}
          className="px-4 py-2 bg-[#9CAEA9] text-white rounded-lg hover:bg-[#6B7575] transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {quotes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Inspirational Quotes</h3>
              {quotes.map((quote, index) => (
                <blockquote 
                  key={index} 
                  className="bg-gray-50 border-l-4 border-black p-4 italic text-gray-600"
                >
                  {formatText(quote)}
                </blockquote>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Personal Recommendations</h3>
              {recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg border border-gray-100 p-4 text-gray-900"
                >
                  {formatText(rec)}
                </div>
              ))}
            </div>
          )}

          {!loading && quotes.length === 0 && recommendations.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No motivation content generated yet. Click refresh to generate new content.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 