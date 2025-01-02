"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond } from 'next/font/google';
import { Menu, Target, Brain, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import InsightsSection from '@/components/InsightsSection';
import GoalsSection from '@/components/GoalsSection';
import MotivationSection from '@/components/MotivationSection';
import CounselorSection from '@/components/CounselorSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic']
});

type Section = 'insights' | 'goals' | 'motivation' | 'counselor';

export default function AdvicePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('insights');
  const [userData, setUserData] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth');
      } else {
        fetchUserData();
      }
    }
  }, [user, loading]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch survey data
      const surveyDoc = await getDoc(doc(db, 'user_surveys', user.uid));
      
      // Fetch journal entries
      const entriesQuery = query(
        collection(db, 'journal_entries'),
        where('userId', '==', user.uid)
      );
      const entriesSnapshot = await getDocs(entriesQuery);
      const entries = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUserData({
        surveyData: surveyDoc.data(),
        journalEntries: entries
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setPageLoading(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-[#191919] text-white py-6">
        <div className="w-full px-8 flex items-center justify-between">
          <button 
            onClick={() => router.push('/journal')}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            <h1 className={`text-6xl tracking-wider ${cormorant.className}`}>
              Serenity Notes
            </h1>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setOpenMenuId(openMenuId ? null : 'menu')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            
            {openMenuId === 'menu' && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    router.push('/journal');
                    setOpenMenuId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                >
                  My Journal
                </button>
                <button
                  onClick={() => {
                    router.push('/advice');
                    setOpenMenuId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                >
                  Advice
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                <button
                  onClick={async () => {
                    await signOut();
                    router.push('/auth');
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 w-full p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setActiveSection('insights')}
            className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              activeSection === 'insights' 
                ? 'bg-[#6B7575] text-white'
                : 'bg-[#788585] text-white hover:bg-[#6B7575]'
            }`}
          >
            <Brain size={24} />
            <span>Insights</span>
          </button>
          <button
            onClick={() => setActiveSection('goals')}
            className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              activeSection === 'goals' 
                ? 'bg-[#6B7575] text-white'
                : 'bg-[#788585] text-white hover:bg-[#6B7575]'
            }`}
          >
            <Target size={24} />
            <span>Goals</span>
          </button>
          <button
            onClick={() => setActiveSection('motivation')}
            className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              activeSection === 'motivation' 
                ? 'bg-[#6B7575] text-white'
                : 'bg-[#788585] text-white hover:bg-[#6B7575]'
            }`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
            <span>Motivation</span>
          </button>
          <button
            onClick={() => setActiveSection('counselor')}
            className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              activeSection === 'counselor' 
                ? 'bg-[#6B7575] text-white'
                : 'bg-[#788585] text-white hover:bg-[#6B7575]'
            }`}
          >
            <MessageSquare size={24} />
            <span>Counselor</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <ErrorBoundary>
            {activeSection === 'insights' && (
              <InsightsSection userData={userData} />
            )}
            {activeSection === 'goals' && (
              <GoalsSection userId={user.uid} />
            )}
            {activeSection === 'motivation' && (
              <MotivationSection userId={user.uid} userData={userData} />
            )}
            {activeSection === 'counselor' && (
              <CounselorSection userData={userData} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
} 