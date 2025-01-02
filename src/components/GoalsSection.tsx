"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import GoalCompletionSurvey from './GoalCompletionSurvey';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic']
});

interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  endDate: string;
  progress: number;
  userId: string;
  createdAt: string;
  isCompleted: boolean;
  completedAt: string;
}

interface GoalsSectionProps {
  userId: string;
}

function parseTimeframe(timeframe: string): Date | null {
  const [value, unit] = timeframe.split(' ');
  const number = parseInt(value);
  
  if (!number) return null;

  const now = new Date();
  const endDate = new Date(now.getTime());
  
  switch(unit) {
    case 'minutes':
      return new Date(endDate.getTime() + number * 60000);
    case 'hours':
      return new Date(endDate.getTime() + number * 3600000);
    case 'days':
      return new Date(endDate.getTime() + number * 86400000);
    case 'weeks':
      return new Date(endDate.getTime() + number * 604800000);
    case 'months':
      endDate.setMonth(endDate.getMonth() + number);
      return endDate;
    default:
      return null;
  }
}

function getTimeRemaining(endDateStr: string, currentTime: Date = new Date()): string | null {
  const endDate = new Date(endDateStr);
  const diff = endDate.getTime() - currentTime.getTime();
  
  if (diff <= 0) return null;
  
  // Convert milliseconds to minutes
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  const weeks = Math.floor(remainingDays / 7);
  const finalDays = remainingDays % 7;
  
  const parts = [];
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
  if (finalDays > 0) parts.push(`${finalDays} day${finalDays > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  
  return parts.length > 0 ? parts.join(', ') + ' remaining' : 'Time is up!';
}

export default function GoalsSection({ userId }: GoalsSectionProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showingSurveyForGoal, setShowingSurveyForGoal] = useState<Goal | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('days');
  const [progress, setProgress] = useState(0);

  // Add this state to track current time
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchGoals = async () => {
    try {
      console.log('Fetching goals for userId:', userId);
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(goalsQuery);
      console.log('Query snapshot:', snapshot.docs.length, 'documents found');
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Goal));
      console.log('Processed goals data:', goalsData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  // Fix the useEffect hook for the timer
  useEffect(() => {
    // Only keep the timer for updating current time
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup function
    return () => clearInterval(timer);
  }, []); // Empty dependency array

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const timeframe = timeValue && timeUnit ? `${timeValue} ${timeUnit}` : null;
      const endDate = timeframe ? parseTimeframe(timeframe) : null;
      
      const goalData = {
        title,
        description,
        timeframe,
        endDate: endDate ? endDate.toISOString() : null,
        progress,
        userId,
        createdAt: new Date().toISOString()
      };

      if (editingGoal) {
        await updateDoc(doc(db, 'goals', editingGoal.id), goalData);
      } else {
        await addDoc(collection(db, 'goals'), goalData);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setTimeValue('');
      setTimeUnit('days');
      setProgress(0);
      setShowForm(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Failed to save goal');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    if (goal.timeframe) {
      const [value, unit] = goal.timeframe.split(' ');
      setTimeValue(value);
      setTimeUnit(unit);
    } else {
      setTimeValue('');
      setTimeUnit('days');
    }
    setProgress(goal.progress);
    setShowForm(true);
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal');
    }
  };

  // Add a function to sort goals by date
  const sortByDate = (a: Goal, b: Goal) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#788585] rounded-lg p-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold text-gray-800 ${cormorant.className}`}>
          Your Goals
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Goal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">Active Goals</h3>
        {goals.filter(goal => !goal.isCompleted).sort(sortByDate).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No active goals. Click "Add Goal" to create your first goal!
          </div>
        ) : (
          goals
            .filter(goal => !goal.isCompleted)
            .sort(sortByDate)
            .map((goal) => (
              <div
                key={`${goal.id}-${currentTime.getTime()}`}
                className="bg-[#6F6866] rounded-lg border border-[#6F6866] p-4 text-white"
              >
                {console.log('Rendering goal:', goal)}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 text-white hover:text-gray-300"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 text-white hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-white mb-2">{goal.description}</p>
                {goal.endDate && (
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-gray-400" />
                    {getTimeRemaining(goal.endDate, currentTime) ? (
                      <p className="text-sm font-medium text-gray-900">
                        {getTimeRemaining(goal.endDate, currentTime)}
                      </p>
                    ) : (
                      <button
                        onClick={() => setShowingSurveyForGoal(goal)}
                        className="text-sm px-3 py-1 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                      >
                        Reflection
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-[#37393A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C95D63] transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Archived Goals */}
      {goals.filter(goal => goal.isCompleted).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">Archived Goals</h3>
          {goals
            .filter(goal => goal.isCompleted)
            .sort(sortByDate)
            .map((goal) => (
              <div
                key={`${goal.id}-${currentTime.getTime()}`}
                className="bg-[#F3DFC1]/50 rounded-lg border border-[#F3DFC1] p-4 opacity-75"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-700">{goal.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 mb-2">{goal.description}</p>
                {goal.completedAt && (
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Completed on {new Date(goal.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Final Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {editingGoal ? 'Edit Goal' : 'Add New Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black placeholder-gray-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    className="w-1/2 p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black placeholder-gray-500"
                    placeholder="Amount"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    className="w-1/2 p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress ({progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    setTitle('');
                    setDescription('');
                    setTimeValue('');
                    setTimeUnit('days');
                    setProgress(0);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showingSurveyForGoal && (
        <GoalCompletionSurvey
          goal={showingSurveyForGoal}
          onClose={() => {
            setShowingSurveyForGoal(null);
            // Optionally refresh goals after survey completion
            fetchGoals();
          }}
        />
      )}
    </div>
  );
} 