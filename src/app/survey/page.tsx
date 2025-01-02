"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic']
});

interface SurveyQuestion {
  id: string;
  question: string;
  options: string[];
  type: 'single' | 'multiple' | 'text';
  allowCustom?: boolean;
}

export default function SurveyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [customAnswer, setCustomAnswer] = useState('');

  const questions: SurveyQuestion[] = [
    {
      id: 'identity',
      question: 'How do you identify?',
      options: ['Male', 'Female'],
      type: 'single',
      allowCustom: true
    },
    {
      id: 'occupation',
      question: 'What is your primary occupation?',
      options: ['Student', 'Homemaker', 'Retired', 'Professional', 'Unemployed'],
      type: 'single',
      allowCustom: true
    },
    {
      id: 'relationship',
      question: 'What is your relationship status?',
      options: ['Single', 'In a relationship', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'],
      type: 'single'
    },
    {
      id: 'faith',
      question: 'What is your faith or spiritual background?',
      options: ['Muslim', 'Jewish', 'Christian', 'Hindu', 'Buddhist', 'Spiritual, but not religious', 'Prefer not to Answer'],
      type: 'single',
      allowCustom: true
    },
    {
      id: 'struggles',
      question: 'Have you been struggling with anything recently?',
      options: ['Sleep', 'Anxiety', 'Grief', 'Depression', 'Loneliness', 'Anger', 'ADHD', 'None of these'],
      type: 'multiple',
      allowCustom: true
    },
    {
      id: 'stress_level',
      question: 'How would you describe your current stress level on most days?',
      options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
      type: 'single'
    },
    {
      id: 'coping_strategies',
      question: 'How do you typically cope with stress or negative emotions?',
      options: [
        'Physical Activity (exercise, sports, etc.)',
        'Creative Outlets (art, music, etc.)',
        'Talking to Friends/Family',
        'Professional Therapy/Counseling',
        'Spiritual/Religious Practices',
        'Self-Medicating (alcohol, etc.)',
        "I'm not sure / I don't have a strategy"
      ],
      type: 'multiple',
      allowCustom: true
    },
    {
      id: 'journal_time',
      question: 'When do you typically like to journal?',
      options: ['Mornings', 'Afternoons', 'Evenings', 'No specific time / whenever I feel like it'],
      type: 'single'
    },
    {
      id: 'advice_style',
      question: 'How do you prefer to receive advice or guidance?',
      options: [
        'Direct and to the point',
        'Gentle and empathetic',
        'Data-driven or research-based suggestions',
        'No preference'
      ],
      type: 'single'
    },
    {
      id: 'personality',
      question: 'Do you consider yourself more introverted or extroverted?',
      options: ['Introverted', 'Extroverted', 'Ambivert (somewhere in between)'],
      type: 'single'
    },
    {
      id: 'support_areas',
      question: 'Which areas of your life would you like the most support or advice in?',
      options: [
        'Career/School',
        'Relationships (family, friends, romantic)',
        'Personal Growth / Self-Discovery',
        'Emotional Regulation',
        'Financial Planning / Stability',
        'Health & Fitness',
        'Spiritual / Faith Journey'
      ],
      type: 'multiple',
      allowCustom: true
    },
    {
      id: 'habits',
      question: 'Are there any specific habits or behaviors you want to develop or break?',
      options: ['Yes', 'No'],
      type: 'single'
    }
  ];

  const handleAnswer = async (answer: string | string[]) => {
    const question = questions[currentQuestion];
    let finalAnswer = answer;

    if (question.type === 'multiple' && !Array.isArray(answer)) {
      finalAnswer = [...(answers[question.id] || [])];
      if ((finalAnswer as string[]).includes(answer as string)) {
        finalAnswer = (finalAnswer as string[]).filter(a => a !== answer);
      } else {
        (finalAnswer as string[]).push(answer as string);
      }
    }

    const newAnswers = { ...answers, [question.id]: finalAnswer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCustomAnswer('');
    } else {
      if (user) {
        try {
          await setDoc(doc(db, 'user_surveys', user.uid), {
            ...newAnswers,
            completed: true,
            completedAt: new Date().toISOString()
          });
          router.push('/journal');
        } catch (error) {
          console.error('Error saving survey:', error);
        }
      }
    }
  };

  const handleCustomAnswer = () => {
    if (customAnswer.trim()) {
      handleAnswer(customAnswer.trim());
    }
  };

  const currentQuestionData = questions[currentQuestion];
  const isMultipleChoice = currentQuestionData.type === 'multiple';
  const selectedAnswers = answers[currentQuestionData.id] || [];

  return (
    <main className="min-h-screen flex flex-col bg-[#CCDAD1]">
      <header className="bg-[#191919] text-white py-6">
        <div className="w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold mb-2">Welcome to Serenity Notes</h2>
            <p className="text-gray-600">Help us personalize your experience</p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="mb-8">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-[#191919] rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <h3 className="text-2xl font-medium mb-6">
              {currentQuestionData.question}
            </h3>

            <div className="space-y-4">
              {currentQuestionData.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    isMultipleChoice
                      ? selectedAnswers.includes(option)
                        ? 'bg-[#191919] text-white'
                        : 'hover:bg-gray-50'
                      : answers[currentQuestionData.id] === option
                      ? 'bg-[#191919] text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}

              {currentQuestionData.allowCustom && (
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder="Other (please specify)"
                    className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                  <button
                    onClick={handleCustomAnswer}
                    className="w-full p-4 bg-[#191919] text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Add Custom Answer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 