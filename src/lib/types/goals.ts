export interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  endDate: string;
  progress: number;
  userId: string;
  createdAt: string;
  isCompleted?: boolean;
  completedAt?: string;
}

export interface GoalFeedback {
  goalId: string;
  userId: string;
  completedAt: string;
  satisfaction: number;
  challenges: string;
  learnings: string;
  nextSteps: string;
} 