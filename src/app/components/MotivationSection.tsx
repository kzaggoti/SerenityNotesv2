"use client";

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string | null;
  progress: number;
}

interface MotivationSectionProps {
  userId: string;
  userData: {
    surveyData: any;
    journalEntries: any[];
  } | null;
}

export default function MotivationSection({ userId, userData }: MotivationSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [goalMotivation, setGoalMotivation] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      await fetchGoals();
      await generateMotivationalContent();
    };
    init();
  }, [userId]);

  const fetchGoals = async () => {
    try {
      const q = query(
        collection(db, 'goals'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const fetchedGoals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Goal));
      setGoals(fetchedGoals);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  };

  const generateMotivationalContent = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/openai/motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goals,
          userData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate motivation');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setQuotes(data.quotes);
      setRecommendations(data.recommendations);
      setGoalMotivation(data.goalMotivation || {});
    } catch (err: any) {
      console.error('Error generating motivation:', err.message);
      setError(err.message || 'Failed to generate motivation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Daily Motivation</h2>
        <button
          onClick={generateMotivationalContent}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Refresh motivation"
        >
          <RefreshCw size={20} className={`${loading ? 'animate-spin' : ''} text-gray-600`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Quote of the Day */}
      {quotes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Quote of the Day</h3>
          <p className="text-gray-700 italic">{quotes[0]}</p>
        </div>
      )}

      {/* Goal-specific Motivation */}
      {goals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Goal Motivation</h3>
          {goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-800 mb-2">{goal.title}</h4>
              <p className="text-gray-600">
                {loading ? 'Generating motivation...' : goalMotivation[goal.id] || 'Click refresh to generate motivation'}
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Personalized Recommendations</h3>
          <div className="grid gap-3">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 