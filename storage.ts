import { User, Quiz, QuizAttempt, QuizQuestion, StandardClass } from '../types';

const STORAGE_KEYS = {
  USERS: 'srv_school_users',
  QUIZZES: 'srv_school_quizzes',
  ATTEMPTS: 'srv_school_attempts',
  PRINCIPAL_SETUP_KEY: 'srv_school_principal_secret_key',
  CURRENT_USER: 'srv_school_current_user',
};

// Default Secret Setup Key for Principal
export const DEFAULT_SECRET_KEY = 'SRV2026';

// Smart AI Answer Evaluation Helper with Partial Credit (0.5 Marks)
export interface EvaluationResult {
  score: number; // 1.0, 0.5, or 0
  isExact: boolean;
  isPartial: boolean;
  spellingNote?: string;
  correctAnswerText: string;
}

export function evaluateQuestionAnswer(
  q: QuizQuestion,
  userAns: number | string | undefined
): EvaluationResult {
  const type = q.type || 'mcq';

  // Option-based questions (MCQs and True/False)
  if (type === 'mcq' || type === 'true_false') {
    let selectedIdx = -1;
    if (typeof userAns === 'number') {
      selectedIdx = userAns;
    } else if (typeof userAns === 'string' && !isNaN(Number(userAns)) && userAns.trim() !== '') {
      selectedIdx = Number(userAns);
    }
    const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
    const isCorrect = selectedIdx === correctIdx;
    const correctText = q.options && q.options[correctIdx] !== undefined
      ? q.options[correctIdx]
      : `Option ${String.fromCharCode(65 + correctIdx)}`;

    return {
      score: isCorrect ? 1.0 : 0,
      isExact: isCorrect,
      isPartial: false,
      correctAnswerText: correctText,
    };
  }

  // Typed input questions (Fill in the Blanks & One-Word Answer)
  const canonicalTarget = (q.correctAnswerText || (q.options && q.options[q.correctAnswer]) || q.options?.[0] || '').trim();
  const userString = (typeof userAns === 'string' ? userAns : (userAns !== undefined && userAns !== null ? String(userAns) : '')).trim();

  if (!userString) {
    return {
      score: 0,
      isExact: false,
      isPartial: false,
      correctAnswerText: canonicalTarget,
    };
  }

  const normUser = userString.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
  const normTarget = canonicalTarget.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');

  // Exact match (case-insensitive & whitespace trimmed)
  if (normUser === normTarget) {
    return {
      score: 1.0,
      isExact: true,
      isPartial: false,
      correctAnswerText: canonicalTarget,
    };
  }

  // Check Levenshtein distance for spelling error / typo partial credit (0.5 Marks)
  const dist = levenshteinDistance(normUser, normTarget);
  const targetLen = normTarget.length;
  const maxAllowedEdits = targetLen <= 3 ? 1 : targetLen <= 8 ? 2 : 3;

  if (dist > 0 && dist <= maxAllowedEdits) {
    return {
      score: 0.5,
      isExact: false,
      isPartial: true,
      spellingNote: `Spelling note: Correct spelling is "${canonicalTarget}"`,
      correctAnswerText: canonicalTarget,
    };
  }

  return {
    score: 0,
    isExact: false,
    isPartial: false,
    correctAnswerText: canonicalTarget,
  };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Date Formatter: Formats any date / ISO string / YYYY-MM-DD to DD-MM-YYYY format
export function formatDateToDDMMYYYY(dateInput?: string | Date | number): string {
  if (!dateInput) return 'N/A';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return 'N/A';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [yyyy, mm, dd] = trimmed.split('-');
      return `${dd}-${mm}-${yyyy}`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Helper to generate sample 20 MCQs for initial seed quizzes
function generateSampleQuestions(subject: string, stdClass: string) {
  return Array.from({ length: 20 }, (_, i) => {
    const qNum = i + 1;
    const correctIdx = (i * 3) % 4;
    return {
      id: `seed-q-${qNum}`,
      question: `${subject} (${stdClass}) Question #${qNum}: Identify the fundamental principle regarding ${subject} topic #${qNum}.`,
      options: [
        `Standard Option A: Primary factor for ${subject} rule #${qNum}`,
        `Standard Option B: Secondary factor for ${subject} rule #${qNum}`,
        `Standard Option C: Key concept for ${subject} rule #${qNum}`,
        `Standard Option D: Alternative application for ${subject} rule #${qNum}`,
      ],
      correctAnswer: correctIdx,
      explanation: `Option ${String.fromCharCode(65 + correctIdx)} is correct according to the standard ${stdClass} ${subject} textbook guidelines.`,
      optionExplanations: [
        'Option A: Examines baseline parameters.',
        'Option B: Applies to complex cases.',
        'Option C: Direct standard theorem.',
        'Option D: Alternative perspective.',
      ],
    };
  });
}

// Initial Seed Data
const SEED_USERS: User[] = [
  {
    id: 'usr-principal-1',
    username: 'principal',
    password: 'srv',
    fullName: 'Dr. K. R. Sharma',
    role: 'principal',
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-teacher-1',
    username: 'anitha',
    password: 'srv',
    fullName: 'Mrs. Anitha Raman',
    role: 'teacher',
    status: 'approved',
    createdAt: new Date().toISOString(),
    teacherDetails: {
      subject: 'English Language & Literature',
      assignedClass: '10th Standard',
    },
  },
  {
    id: 'usr-teacher-2',
    username: 'suresh',
    password: 'srv',
    fullName: 'Mr. Suresh Kumar',
    role: 'teacher',
    status: 'approved',
    createdAt: new Date().toISOString(),
    teacherDetails: {
      subject: 'Mathematics',
      assignedClass: '6th Standard',
    },
  },
  {
    id: 'usr-teacher-3',
    username: 'meena',
    password: 'srv',
    fullName: 'Ms. Meena V.',
    role: 'teacher',
    status: 'pending',
    createdAt: new Date().toISOString(),
    teacherDetails: {
      subject: 'General Science',
      assignedClass: '8th Standard',
    },
  },
  {
    id: 'usr-student-1',
    username: 'rahul10',
    password: 'srv',
    fullName: 'Rahul V. Verma',
    role: 'student',
    status: 'approved',
    createdAt: new Date().toISOString(),
    studentDetails: {
      rollNo: '1001',
      class: '10th Standard',
    },
  },
  {
    id: 'usr-student-2',
    username: 'priya10',
    password: 'srv',
    fullName: 'Priya S. Nambiar',
    role: 'student',
    status: 'approved',
    createdAt: new Date().toISOString(),
    studentDetails: {
      rollNo: '1002',
      class: '10th Standard',
    },
  },
  {
    id: 'usr-student-3',
    username: 'aditya10',
    password: 'srv',
    fullName: 'Aditya Roy',
    role: 'student',
    status: 'pending',
    createdAt: new Date().toISOString(),
    studentDetails: {
      rollNo: '1003',
      class: '10th Standard',
    },
  },
  {
    id: 'usr-student-4',
    username: 'kavya6',
    password: 'srv',
    fullName: 'Kavya S.',
    role: 'student',
    status: 'approved',
    createdAt: new Date().toISOString(),
    studentDetails: {
      rollNo: '6001',
      class: '6th Standard',
    },
  },
];

const SEED_QUIZZES: Quiz[] = [
  {
    id: 'quiz-101',
    title: 'English Literature & Grammar Master Evaluation',
    subject: 'English Language & Literature',
    targetClass: '10th Standard',
    createdById: 'usr-teacher-1',
    createdByName: 'Mrs. Anitha Raman',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    durationMinutes: 30,
    totalQuestions: 20,
    questions: generateSampleQuestions('English Language & Literature', '10th Standard'),
    isAllotted: true,
    allottedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
  },
  {
    id: 'quiz-102',
    title: 'Class 6th Fundamentals of Mathematics',
    subject: 'Mathematics',
    targetClass: '6th Standard',
    createdById: 'usr-teacher-2',
    createdByName: 'Mr. Suresh Kumar',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 30,
    totalQuestions: 20,
    questions: generateSampleQuestions('Mathematics', '6th Standard'),
    isAllotted: true,
    allottedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
  },
];

function makeSampleAnswers(pattern: number): Record<number, number> {
  const result: Record<number, number> = {};
  for (let i = 0; i < 20; i++) {
    result[i] = pattern === 1 ? (i * 3) % 4 : pattern === 2 ? (i % 2 === 0 ? (i * 3) % 4 : 0) : (i * 3) % 4;
  }
  return result;
}

const SEED_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att-1',
    quizId: 'quiz-101',
    quizTitle: 'English Literature & Grammar Master Evaluation',
    subject: 'English Language & Literature',
    studentId: 'usr-student-1',
    studentName: 'Rahul V. Verma',
    studentRollNo: '1001',
    studentClass: '10th Standard',
    answers: makeSampleAnswers(1),
    score: 18,
    total: 20,
    percentage: 90,
    grade: 'A+',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    timeTakenSeconds: 1120,
  },
  {
    id: 'att-2',
    quizId: 'quiz-101',
    quizTitle: 'English Literature & Grammar Master Evaluation',
    subject: 'English Language & Literature',
    studentId: 'usr-student-2',
    studentName: 'Priya S. Nambiar',
    studentRollNo: '1002',
    studentClass: '10th Standard',
    answers: makeSampleAnswers(2),
    score: 16,
    total: 20,
    percentage: 80,
    grade: 'A',
    submittedAt: new Date(Date.now() - 43200000).toISOString(),
    timeTakenSeconds: 1250,
  },
  {
    id: 'att-3',
    quizId: 'quiz-102',
    quizTitle: 'Class 6th Fundamentals of Mathematics',
    subject: 'Mathematics',
    studentId: 'usr-student-4',
    studentName: 'Kavya S.',
    studentRollNo: '6001',
    studentClass: '6th Standard',
    answers: makeSampleAnswers(1),
    score: 19,
    total: 20,
    percentage: 95,
    grade: 'A+',
    submittedAt: new Date(Date.now() - 20000000).toISOString(),
    timeTakenSeconds: 980,
  },
];

// LocalStorage API
export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_USERS;
  }
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getStoredQuizzes = (): Quiz[] => {
  const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(SEED_QUIZZES));
    return SEED_QUIZZES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_QUIZZES;
  }
};

export const saveQuizzes = (quizzes: Quiz[]) => {
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
};

export const getStoredAttempts = (): QuizAttempt[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(SEED_ATTEMPTS));
    return SEED_ATTEMPTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_ATTEMPTS;
  }
};

export const saveAttempts = (attempts: QuizAttempt[]) => {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
};

export const getSecretSetupKey = (): string => {
  return localStorage.getItem(STORAGE_KEYS.PRINCIPAL_SETUP_KEY) || DEFAULT_SECRET_KEY;
};

export const saveSecretSetupKey = (key: string) => {
  localStorage.setItem(STORAGE_KEYS.PRINCIPAL_SETUP_KEY, key);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const resetSchoolData = () => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(SEED_QUIZZES));
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(SEED_ATTEMPTS));
  localStorage.setItem(STORAGE_KEYS.PRINCIPAL_SETUP_KEY, DEFAULT_SECRET_KEY);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};
