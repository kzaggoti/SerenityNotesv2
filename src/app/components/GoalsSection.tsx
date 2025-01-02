"use client";

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string | null;
  progress: number;
  userId: string;
  createdAt: string;
}

interface GoalsSectionProps {
  userId: string;
}

export default function GoalsSection({ userId }: GoalsSectionProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const goalData = {
      title,
      description,
      timeframe: timeframe || null,
      progress,
      userId,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingGoal) {
        await updateDoc(doc(db, 'goals', editingGoal.id), goalData);
        setGoals(goals.map(g => g.id === editingGoal.id ? { ...goalData, id: editingGoal.id } as Goal : g));
      } else {
        const docRef = await addDoc(collection(db, 'goals'), goalData);
        setGoals([...goals, { ...goalData, id: docRef.id } as Goal]);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving goal:', err);
      setError('Failed to save goal');
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('Failed to delete goal');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setTimeframe(goal.timeframe || '');
    setProgress(goal.progress);
    setIsAddingGoal(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTimeframe('');
    setProgress(0);
    setEditingGoal(null);
    setIsAddingGoal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Your Goals</h2>
        <button
          onClick={() => setIsAddingGoal(true)}
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

      {isAddingGoal ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal Title"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black placeholder-gray-500"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none min-h-[100px] text-black placeholder-gray-500"
            required
          />
          <input
            type="text"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            placeholder="Timeframe (optional)"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black placeholder-gray-500"
          />
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Progress: {progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {editingGoal ? 'Save Changes' : 'Add Goal'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No goals yet. Click "Add Goal" to create your first goal!
            </p>
          ) : (
            goals.map(goal => (
              <div key={goal.id} className="bg-white rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-800">{goal.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">{goal.description}</p>
                {goal.timeframe && (
                  <p className="text-sm text-gray-500">Timeframe: {goal.timeframe}</p>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 