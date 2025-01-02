"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface InsightsSectionProps {
  userData: {
    surveyData: any;
    journalEntries: any[];
  } | null;
}

export default function InsightsSection({ userData }: InsightsSectionProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInsights = async () => {
    if (!userData) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/openai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData: userData.surveyData,
          journalEntries: userData.journalEntries
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData && !insights.length) {
      generateInsights();
    }
  }, [userData]);

  if (!userData) {
    return (
      <div className="text-center text-gray-600">
        No data available to generate insights.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Your Personal Insights</h2>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
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
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Analyzing your journal entries and survey data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <p className="text-gray-800">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 