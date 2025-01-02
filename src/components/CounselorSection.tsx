"use client";

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Cormorant_Garamond } from 'next/font/google';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CounselorSectionProps {
  userData: {
    surveyData: any;
    journalEntries: any[];
  } | null;
}

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic']
});

export default function CounselorSection({ userData }: CounselorSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/openai/counselor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6 bg-[#788585] rounded-lg p-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold text-gray-800 ${cormorant.className}`}>
          AI Counselor Chat
        </h2>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 h-[400px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Start a conversation with your AI counselor. They have access to your journal entries and survey responses to provide personalized guidance.
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-[#C95D63] text-[#F3DFC1]' 
                    : 'bg-[#F3DFC1] border border-[#F3DFC1] text-[#37393A]'
                }`}
              >
                {formatText(msg.content)}
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-gray-900"
            disabled={loading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#9CAEA9] text-white rounded-lg hover:bg-[#6B7575] transition-colors disabled:opacity-50"
          >
            <Send size={20} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 