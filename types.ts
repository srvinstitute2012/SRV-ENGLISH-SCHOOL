export type Role = 'principal' | 'teacher' | 'student';

export type StandardClass = 
  | '6th Standard'
  | '7th Standard'
  | '8th Standard'
  | '9th Standard'
  | '10th Standard';

export const STANDARD_CLASSES: StandardClass[] = [
  '6th Standard',
  '7th Standard',
  '8th Standard',
  '9th Standard',
  '10th Standard',
];

export const SUBJECT_OPTIONS = [
  'Science',
  'Mathematics',
  'English',
  'Social Studies',
  'Kannada',
  'Hindi',
  'General Knowledge',
  'Computer Science',
];

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: Role;
  status: ApprovalStatus;
  createdAt: string;
  teacherDetails?: {
    subject: string;
    assignedClass: StandardClass;
  };
  studentDetails?: {
    rollNo: string;
    class: StandardClass;
  };
}

export type QuestionType = 'mcq' | 'true_false' | 'fill_in_blank' | 'one_word' | 'mixed';

export interface QuizQuestion {
  id: string | number;
  type?: 'mcq' | 'true_false' | 'fill_in_blank' | 'one_word';
  question: string;
  options: string[]; // Choices for MCQ/TrueFalse or ['Typed Input']
  correctAnswer: number; // Index for MCQ/TrueFalse
  correctAnswerText?: string; // Canonical text string for typed answers
  explanation: string;
  optionExplanations?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  targetClass: StandardClass;
  createdById: string;
  createdByName: string;
  createdAt: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  isAllotted: boolean;
  allottedAt?: string;
  dueDate?: string;
  questionFormat?: QuestionType;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  studentClass: StandardClass;
  answers: Record<number, number | string>; // option index or typed answer text
  score: number; // total score (can be fractional, e.g. 8.5)
  total: number;
  percentage: number;
  grade: string;
  submittedAt: string;
  timeTakenSeconds: number;
  questionScores?: Record<number, number>; // score per question (1.0, 0.5, 0)
  spellingNotes?: Record<number, string>; // typo notes if partial credit awarded
}

export interface SchoolAnalytics {
  classStats: Record<StandardClass, {
    studentCount: number;
    quizzesCompleted: number;
    averageScorePercent: number;
    topScorer: string;
  }>;
  totalTeachers: number;
  pendingTeachers: number;
  totalStudents: number;
  pendingStudents: number;
  totalQuizzes: number;
}
