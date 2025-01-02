export interface SurveyAnswer {
  id: string;
  value: string | string[];
}

export interface UserSurvey {
  answers: Record<string, string | string[]>;
  completedAt: string;
} 