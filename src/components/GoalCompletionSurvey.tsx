"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { Goal } from '@/lib/types/goals';

interface GoalCompletionSurveyProps {
  goal: Goal;
  onClose: () => void;
}

export default function GoalCompletionSurvey({ goal, onClose }: GoalCompletionSurveyProps) {
  const [satisfaction, setSatisfaction] = useState(3);
  const [challenges, setChallenges] = useState('');
  const [learnings, setLearnings] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'goal_feedback'), {
        goalId: goal.id,
        userId: goal.userId,
        completedAt: new Date().toISOString(),
        satisfaction,
        challenges,
        learnings,
        nextSteps,
      });

      await updateDoc(doc(db, 'goals', goal.id), {
        isCompleted: true,
        completedAt: new Date().toISOString()
      });

      onClose();
    } catch (error) {
      console.error('Error saving feedback:', error);
      setError('Failed to save feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">Goal Reflection</h3>
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How satisfied are you with your progress?
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={satisfaction}
              onChange={(e) => setSatisfaction(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Not satisfied</span>
              <span>Very satisfied</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What challenges did you face?
            </label>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What did you learn from this experience?
            </label>
            <textarea
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What are your next steps?
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#9CAEA9] text-white rounded-lg hover:bg-[#6B7575] transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 