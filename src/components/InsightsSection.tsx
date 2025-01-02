"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  weight: '700',
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
});

interface InsightsSectionProps {
  userData: {
    surveyData: any;
    journalEntries: any[];
  } | null;
}

interface Insight {
  title: string;
  content: string;
  category: string;
}

export default function InsightsSection({ userData }: InsightsSectionProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const generateInsights = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/openai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      // Transform the insights into structured format
      const formattedInsights = data.insights.map((insight: string) => {
        const titleMatch = insight.match(/^- (.*?):/);
        const title = titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Insight';
        const content = insight.replace(/^- .*?: /, '').replace(`${title}: `, '');
        return {
          title,
          content,
          category: getCategoryIcon(title)
        };
      });
      setInsights(formattedInsights);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (title: string) => {
    const lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.includes('sleep')) return '😴';
    if (lowercaseTitle.includes('nutrition')) return '🍎';
    if (lowercaseTitle.includes('motivation')) return '🎯';
    if (lowercaseTitle.includes('social')) return '👥';
    if (lowercaseTitle.includes('creative')) return '🎨';
    if (lowercaseTitle.includes('emotion')) return '💭';
    if (lowercaseTitle.includes('stress')) return '🧘‍♂️';
    if (lowercaseTitle.includes('exercise')) return '🏃‍♂️';
    return '💡';
  };

  useEffect(() => {
    if (userData) {
      generateInsights();
    }
  }, [userData]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="space-y-6 bg-[#6F6866] rounded-lg p-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-semibold text-white ${cormorant.className}`}>
          Your Personal Insights
        </h2>
        <button
          onClick={generateInsights}
          className="px-4 py-2 bg-[#38302E] text-white rounded-lg hover:bg-[#6B7575] transition-colors"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </div>
          ) : (
            'Refresh Insights'
          )}
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
      ) : insights.length > 0 ? (
        <div className="relative bg-[#6F6866] rounded-xl shadow-lg overflow-hidden min-h-[500px] border border-[#6F6866] p-4">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
            <div 
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / insights.length) * 100}%` }}
            />
          </div>

          <div className="p-12 flex flex-col items-center text-center text-white">
            {/* Category emoji */}
            <div className="text-6xl mb-6">
              {insights[currentIndex].category}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-semibold mb-6">
              {insights[currentIndex].title}
            </h3>

            {/* Content */}
            <p className="text-lg leading-relaxed">
              {formatText(insights[currentIndex].content)}
            </p>

            {/* Navigation */}
            <div className="flex items-center gap-8 mt-12">
              <button
                onClick={goToPrevious}
                className="flex items-center gap-2 px-6 py-3 text-white hover:text-gray-200 hover:bg-[#38302E] rounded-lg transition-colors text-lg"
                aria-label="Previous insight"
              >
                <ChevronLeft size={24} />
                <span>Previous</span>
              </button>

              <div className="text-white font-medium">
                {currentIndex + 1} of {insights.length}
              </div>

              <button
                onClick={goToNext}
                className="flex items-center gap-2 px-6 py-3 text-white hover:text-gray-200 hover:bg-[#38302E] rounded-lg transition-colors text-lg"
                aria-label="Next insight"
              >
                <span>Next</span>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          No insights generated yet. Click refresh to generate new insights.
        </div>
      )}
    </div>
  );
} 