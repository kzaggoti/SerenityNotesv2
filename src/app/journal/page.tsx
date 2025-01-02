"use client";

import React from 'react';
import { Cormorant_Garamond } from 'next/font/google';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Plus, Mic, Pen, Trash2, Menu } from 'lucide-react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic']
});

interface JournalEntry {
  id: string;
  content: string;
  timestamp: string;
  monthYear: string;
  isFavorite: boolean;
  header?: string;
  createdAt: string;
}

const JournalPage: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'journal' | 'advice'>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [header, setHeader] = useState('');

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript;
            setNewEntry(prev => prev + (prev ? ' ' : '') + transcript);
          }
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          if (isListening) {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
              setIsListening(false);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
          setIsListening(false);
        } catch (error) {
          console.error('Error cleaning up recognition:', error);
        }
      }
    };
  }, [isListening]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'journal_entries'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedEntries = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content,
            timestamp: data.timestamp,
            monthYear: data.monthYear,
            isFavorite: data.isFavorite,
            header: data.header,
            createdAt: data.createdAt
          } as JournalEntry;
        });

        console.log('Fetched entries:', fetchedEntries);
        setEntries(fetchedEntries);
      } catch (error) {
        console.error('Error fetching entries:', error);
      }
    };

    fetchEntries();
  }, [user]);

  const toggleListening = async () => {
    if (!recognition) return;

    console.log('Toggling listening state. Current state:', isListening);

    if (isListening) {
      try {
        recognition.stop();
        recognition.abort();
        setIsListening(false);
        console.log('Stopped recording');
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        setIsListening(true);
        console.log('Started recording');
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    }
  };

  const addEntry = async () => {
    if (!newEntry.trim() || !user) return;
    
    const now = new Date();
    const entryData = {
      header,
      content: newEntry,
      timestamp: now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      monthYear: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      isFavorite: false,
      userId: user.uid,
      createdAt: now.toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'journal_entries'), entryData);
      setEntries([{ ...entryData, id: docRef.id } as JournalEntry, ...entries]);
      setNewEntry("");
      setIsAddingEntry(false);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const saveEdit = async () => {
    if (!editingId || !newEntry.trim() || !user) return;

    try {
      await updateDoc(doc(db, 'journal_entries', editingId), {
        content: newEntry
      });

      setEntries(entries.map(entry => 
        entry.id === editingId 
          ? { ...entry, content: newEntry }
          : entry
      ));
      setEditingId(null);
      setNewEntry("");
      setIsAddingEntry(false);
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    try {
      await updateDoc(doc(db, 'journal_entries', id), {
        isFavorite: !entry.isFavorite
      });

      setEntries(entries.map(entry =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'journal_entries', id));
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const monthGroups = Object.entries(
    entries.reduce((groups: { [key: string]: JournalEntry[] }, entry) => {
      if (!groups[entry.monthYear]) {
        groups[entry.monthYear] = [];
      }
      groups[entry.monthYear].push(entry);
      return groups;
    }, {})
  ).map(([monthYear, entries]) => ({ monthYear, entries }));

  const menuItems = [
    {
      label: 'Advice',
      onClick: () => router.push('/advice')
    },
    // ... other menu items
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || !user) return;

    try {
      if (editingId) {
        // Update existing entry
        const entryRef = doc(db, 'journal_entries', editingId);
        await updateDoc(entryRef, {
          content: newEntry,
          header: header
        });

        // Update the entries state to reflect the change
        setEntries(entries.map(entry => 
          entry.id === editingId 
            ? { ...entry, content: newEntry, header: header }
            : entry
        ));
      } else {
        // Create new entry
        const now = new Date();
        const entryData = {
          header,
          content: newEntry,
          timestamp: now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          monthYear: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          isFavorite: false,
          userId: user.uid,
          createdAt: now.toISOString()
        };

        const docRef = await addDoc(collection(db, 'journal_entries'), entryData);
        setEntries([{ ...entryData, id: docRef.id } as JournalEntry, ...entries]);
      }

      // Reset form state
      setNewEntry("");
      setHeader("");
      setEditingId(null);
      setIsAddingEntry(false);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-[#191919] text-white py-6">
        <div className="w-full px-8 flex items-center justify-between">
          <button 
            onClick={() => setSelectedMonth(null)} 
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
                    setActiveTab('journal');
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
                    setOpenMenuId(null);
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
        {activeTab === 'journal' && (
          <>
            {!selectedMonth ? (
              <div className="space-y-4">
                {entries.some(entry => entry.isFavorite) && (
                  <button
                    onClick={() => setSelectedMonth('pinned')}
                    className="w-full bg-white rounded-lg shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-all"
                  >
                    <div className="text-yellow-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <span className={`text-2xl text-gray-800 ${cormorant.className}`}>
                      Favorite Journal Entries
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
                      {entries.filter(entry => entry.isFavorite).length} {entries.filter(entry => entry.isFavorite).length === 1 ? 'entry' : 'entries'}
                    </span>
                  </button>
                )}

                {monthGroups.map(({ monthYear, entries }) => (
                  <button
                    key={monthYear}
                    onClick={() => setSelectedMonth(monthYear)}
                    className="w-full bg-white rounded-lg shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-all"
                  >
                    <span className={`text-2xl text-gray-800 ${cormorant.className}`}>
                      {monthYear}
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="mb-6 text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to folders
                </button>

                <div className="space-y-4">
                  {(selectedMonth === 'pinned' 
                    ? entries.filter(entry => entry.isFavorite)
                    : entries.filter(entry => entry.monthYear === selectedMonth)
                      .sort((a, b) => {
                        if (a.isFavorite && !b.isFavorite) return -1;
                        if (!a.isFavorite && b.isFavorite) return 1;
                        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                      })
                  ).map((entry) => (
                    <div key={entry.id} className="bg-white rounded-lg p-4 shadow-md">
                      {entry.header && (
                        <h3 className="font-bold text-black text-lg mb-2">{entry.header}</h3>
                      )}
                      <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          {entry.isFavorite && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-yellow-400"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                          <span className="text-gray-500">{entry.timestamp}</span>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                          {openMenuId === entry.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg py-1 z-10">
                              <button
                                onClick={() => toggleFavorite(entry.id)}
                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-800"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={entry.isFavorite ? "currentColor" : "none"} stroke="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span>{entry.isFavorite ? 'Unpin' : 'Pin'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setNewEntry(entry.content);
                                  setHeader(entry.header || '');
                                  setEditingId(entry.id);
                                  setIsAddingEntry(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-800"
                              >
                                <Pen size={16} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  deleteEntry(entry.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-red-600"
                              >
                                <Trash2 size={16} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Add Entry Button or Input */}
            {!isAddingEntry ? (
              <button
                onClick={() => setIsAddingEntry(true)}
                className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-6 h-6" />
                <span className="text-lg">Add Journal Entry</span>
              </button>
            ) : (
              <div className="fixed inset-x-0 bottom-0 bg-[#CCDAD1] p-6 transition-all ease-in-out duration-300" style={{ marginBottom: '60px' }}>
                <div className="max-w-3xl mx-auto">
                  <div className="relative">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => setHeader(e.target.value)}
                        placeholder="Header (Optional)"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black"
                      />
                      <div className="relative">
                        <textarea
                          value={newEntry}
                          onChange={(e) => setNewEntry(e.target.value)}
                          placeholder="Write your thoughts..."
                          className={`w-full p-4 border rounded-lg min-h-[120px] text-gray-800 focus:ring-2 focus:ring-black focus:outline-none resize-none bg-white pr-12 ${
                            isListening ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                          }`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`absolute right-3 top-3 p-2 rounded-full transition-all transform ${
                            isListening 
                              ? 'bg-red-500 hover:bg-red-600 text-white scale-110' 
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                          title={isListening ? 'Stop recording' : 'Start recording'}
                        >
                          <Mic 
                            size={20} 
                            className={`transition-colors duration-200 ${
                              isListening ? 'text-white' : 'text-current'
                            }`}
                          />
                        </button>
                        {isListening && (
                          <div className="absolute right-3 top-14 text-sm font-medium text-red-500 animate-pulse">
                            Recording...
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-4">
                        <button
                          type="submit"
                          className="bg-[#191919] text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                          {editingId ? 'Save Edit' : 'Add Entry'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingEntry(false);
                            setNewEntry("");
                            setEditingId(null);
                            setHeader("");
                            if (isListening && recognition) {
                              recognition.stop();
                              setIsListening(false);
                            }
                          }}
                          className="bg-red-900 text-white px-6 py-2.5 rounded-lg hover:bg-red-800 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-16"></div>
    </main>
  );
};

export default JournalPage;