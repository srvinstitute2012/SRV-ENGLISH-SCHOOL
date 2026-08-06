import React, { useState } from 'react';
import { User, Quiz, QuizAttempt, StandardClass } from './types';
import {
  getStoredQuizzes,
  getStoredAttempts,
  saveAttempts,
  formatDateToDDMMYYYY,
} from './storage';
import { QuizPlayer } from './QuizPlayer';
import { QuizResultView } from './QuizResultView';
import { PrintableGradebook } from './PrintableGradebook';
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  Play,
  Printer,
  HelpCircle,
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  onRefreshData?: () => void;
}

// Helper for subject icons
const getSubjectIcon = (subjectName: string) => {
  const s = subjectName.toLowerCase();
  if (s.includes('science') || s.includes('physics') || s.includes('chemistry') || s.includes('biology')) return '🧪';
  if (s.includes('english') || s.includes('literature') || s.includes('grammar')) return '📖';
  if (s.includes('math') || s.includes('algebra') || s.includes('geometry')) return '🔢';
  if (s.includes('kannada')) return '🌸';
  if (s.includes('hindi')) return '🪷';
  if (s.includes('social') || s.includes('history') || s.includes('geography')) return '🌐';
  if (s.includes('computer') || s.includes('coding') || s.includes('it')) return '💻';
  return '📚';
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const studentClass = currentUser.studentDetails?.class || ('10th Standard' as StandardClass);
  const rollNo = currentUser.studentDetails?.rollNo || '1001';

  const [quizzes, setQuizzes] = useState<Quiz[]>(getStoredQuizzes());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(getStoredAttempts());

  const [activeQuizForTest, setActiveQuizForTest] = useState<Quiz | null>(null);
  const [activeAttemptForReview, setActiveAttemptForReview] = useState<{
    quiz: Quiz;
    attempt: QuizAttempt;
  } | null>(null);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  const refreshState = () => {
    setQuizzes(getStoredQuizzes());
    setAttempts(getStoredAttempts());
    if (onRefreshData) onRefreshData();
  };

  // Filter quizzes allotted to this student's class
  const classQuizzes = quizzes.filter(
    (q) => q.targetClass === studentClass && q.isAllotted
  );

  // Extract unique subjects available for this student
  const availableSubjects = Array.from(new Set(classQuizzes.map((q) => q.subject)));

  // Filtered quizzes based on selected subject
  const filteredQuizzes = classQuizzes.filter(
    (q) => selectedSubjectFilter === 'ALL' || q.subject === selectedSubjectFilter
  );

  // Filter attempts for this student
  const myAttempts = attempts.filter((a) => a.studentId === currentUser.id);

  // Handle quiz attempt completion
  const handleAttemptSubmitted = (newAttempt: QuizAttempt) => {
    const updatedAttempts = [newAttempt, ...attempts];
    setAttempts(updatedAttempts);
    saveAttempts(updatedAttempts);

    const quizObj = quizzes.find((q) => q.id === newAttempt.quizId);
    setActiveQuizForTest(null);

    if (quizObj) {
      setActiveAttemptForReview({ quiz: quizObj, attempt: newAttempt });
    }
    refreshState();
  };

  // If student is pending approval
  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#0d1527] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-[#131d35] border border-amber-500/40 rounded-2xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-amber-950/80 text-amber-400 rounded-2xl border border-amber-500/50 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-amber-300">Account Pending Class Teacher Approval</h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Hello <span className="font-bold text-white">{currentUser.fullName}</span> (Roll #{rollNo})! Your registration for <span className="text-emerald-400 font-bold">{studentClass}</span> is pending teacher approval.
          </p>
          <div className="p-3 bg-[#090f1d] rounded-xl border border-slate-800 text-xs text-slate-400">
            Once your class teacher approves your account, your allotted quizzes and gradebook will automatically appear here.
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz Player Mode
  if (activeQuizForTest) {
    return (
      <QuizPlayer
        quiz={activeQuizForTest}
        student={currentUser}
        onSubmitAttempt={handleAttemptSubmitted}
        onCancel={() => setActiveQuizForTest(null)}
      />
    );
  }

  // Active Review Mode
  if (activeAttemptForReview) {
    return (
      <QuizResultView
        quiz={activeAttemptForReview.quiz}
        attempt={activeAttemptForReview.attempt}
        student={currentUser}
        onBackToDashboard={() => setActiveAttemptForReview(null)}
      />
    );
  }

  // Overall Score Stats
  const totalScore = myAttempts.reduce((sum, a) => sum + a.percentage, 0);
  const avgPercentage = myAttempts.length > 0 ? Math.round(totalScore / myAttempts.length) : 0;

  return (
    <div className="min-h-screen bg-[#0d1527] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Warm Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-[#131e36] via-[#1a2744] to-[#131e36] border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b from-emerald-400 via-emerald-500 to-blue-500" />
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm">
              <GraduationCap className="w-4 h-4 text-emerald-400" /> Student Examination Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {currentUser.fullName}! Ready for today's challenge? 🌟
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              SRV English School • Roll No: <span className="text-emerald-400 font-mono font-bold">#{rollNo}</span> • Class: <span className="text-amber-300 font-bold">{studentClass}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#090f1d]/90 border border-emerald-500/30 px-4 py-3 rounded-2xl min-w-[125px] shadow-lg">
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Cumulative Avg</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5 flex items-baseline gap-1">
                {avgPercentage}% <span className="text-xs font-semibold text-emerald-500">Avg</span>
              </div>
            </div>

            <div className="bg-[#090f1d]/90 border border-blue-500/30 px-4 py-3 rounded-2xl min-w-[125px] shadow-lg">
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Quizzes Done</div>
              <div className="text-2xl font-black text-blue-400 mt-0.5">
                {myAttempts.length} <span className="text-xs font-semibold text-slate-400">/ {classQuizzes.length}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl hover:shadow-emerald-900/40 transition-all flex items-center gap-2 shrink-0 border border-emerald-400/30"
            >
              <Printer className="w-4 h-4" /> Gradebook Report Card
            </button>
          </div>
        </div>

        {/* Allotted Quizzes */}
        <div className="bg-[#131d35] border border-slate-700/70 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" /> Allotted Examinations for {studentClass} ({filteredQuizzes.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluations generated by subject teachers specifically for your class standard.
              </p>
            </div>

            {/* Subject Filters */}
            {availableSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedSubjectFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedSubjectFilter === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40'
                      : 'bg-[#090f1d] text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <span>📚</span> All Subjects
                </button>
                {availableSubjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedSubjectFilter === sub
                        ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40'
                        : 'bg-[#090f1d] text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{getSubjectIcon(sub)}</span> {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl bg-[#090f1d]/60">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-300">No Examinations Found</div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedSubjectFilter === 'ALL'
                  ? `No quizzes have been allotted to ${studentClass} yet.`
                  : `No quizzes found for subject "${selectedSubjectFilter}".`}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredQuizzes.map((quiz) => {
                const myAttempt = myAttempts.find((a) => a.quizId === quiz.id);
                const icon = getSubjectIcon(quiz.subject);

                return (
                  <div
                    key={quiz.id}
                    className="bg-[#090f1d]/90 border border-slate-700/80 rounded-2xl p-5 hover:border-emerald-500/60 transition shadow-lg space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                          <span>{icon}</span> {quiz.subject}
                        </span>
                      </div>
                      <span className="text-xs text-amber-400 font-mono font-bold bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                        Due: {formatDateToDDMMYYYY(quiz.dueDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {quiz.title}
                      </h3>
                      <div className="text-xs text-slate-300 mt-2 bg-[#131e36] p-3 rounded-xl border border-slate-700/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span>👨‍🏫 <strong className="text-slate-400">Teacher:</strong> <span className="text-emerald-300 font-bold">{quiz.createdByName}</span></span>
                          <span className="text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {quiz.difficulty || 'Medium'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                          <span>📝 {quiz.totalQuestions || quiz.questions?.length || 0} Questions</span>
                          <span>⏱️ {quiz.durationMinutes} Minutes</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {myAttempt ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="text-xs flex items-center gap-2">
                            <span className="text-slate-400">Score: </span>
                            <span className="font-bold text-emerald-400">{myAttempt.score}/{myAttempt.total} ({myAttempt.percentage}%)</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                              {myAttempt.grade}
                            </span>
                          </div>

                          <button
                            onClick={() => setActiveAttemptForReview({ quiz, attempt: myAttempt })}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> View Solutions
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveQuizForTest(quiz)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 border border-emerald-400/30"
                        >
                          <Play className="w-4 h-4 fill-white" /> Start Quiz Evaluation
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evaluation History */}
        {myAttempts.length > 0 && (
          <div className="bg-[#131d35] border border-slate-700/70 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" /> Completed Evaluation History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090f1d] text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Assessment Title</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {myAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                        <span>{getSubjectIcon(att.subject)}</span> {att.subject}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{att.quizTitle}</td>
                      <td className="px-4 py-3 font-bold text-white">{att.score} / {att.total}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{att.percentage}%</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {att.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {formatDateToDDMMYYYY(att.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Printable Gradebook Modal */}
      {showPrintModal && (
        <PrintableGradebook
          student={currentUser}
          attempt={myAttempts[0]}
          quiz={classQuizzes[0]}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
