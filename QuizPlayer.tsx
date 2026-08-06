import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt, User } from '../types';
import { calculateGrade, evaluateQuestionAnswer } from '../lib/storage';
import { Clock, CheckCircle2, Flag, ChevronLeft, ChevronRight, AlertTriangle, Send, Sparkles, Edit3 } from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  student: User;
  onSubmitAttempt: (attempt: QuizAttempt) => void;
  onCancel: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  student,
  onSubmitAttempt,
  onCancel,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(quiz.durationMinutes * 60);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer Countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  const currentQ = quiz.questions[currentQuestionIdx];

  const handleSelectOption = (optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIdx,
    }));
  };

  const handleTextChange = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: text,
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentQuestionIdx]: !prev[currentQuestionIdx],
    }));
  };

  const handleFinalSubmit = () => {
    // Smart AI Evaluation with Partial Marks & Spelling Notes
    let totalScore = 0;
    const questionScores: Record<number, number> = {};
    const spellingNotes: Record<number, string> = {};

    quiz.questions.forEach((q, idx) => {
      const res = evaluateQuestionAnswer(q, answers[idx]);
      totalScore += res.score;
      questionScores[idx] = res.score;
      if (res.spellingNote) {
        spellingNotes[idx] = res.spellingNote;
      }
    });

    const total = quiz.questions.length;
    const formattedScore = Number(totalScore.toFixed(1));
    const percentage = Math.round((formattedScore / total) * 100);
    const grade = calculateGrade(percentage);
    const timeTakenSeconds = quiz.durationMinutes * 60 - timeLeftSeconds;

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      studentId: student.id,
      studentName: student.fullName,
      studentRollNo: student.studentDetails?.rollNo || '1001',
      studentClass: student.studentDetails?.class || '10th Standard',
      answers,
      score: formattedScore,
      total,
      percentage,
      grade,
      submittedAt: new Date().toISOString(),
      timeTakenSeconds,
      questionScores,
      spellingNotes,
    };

    onSubmitAttempt(attempt);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => {
    const v = answers[Number(k)];
    return v !== undefined && v !== '';
  }).length;

  const qType = currentQ.type || 'mcq';

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1527] text-slate-100 flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-[#131d35]/90 backdrop-blur-md border-b border-slate-700/80 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xl">
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            {quiz.subject} • {quiz.targetClass}
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">{quiz.title}</h2>
        </div>

        {/* Timer Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-mono font-bold shadow-inner ${
              timeLeftSeconds < 300
                ? 'bg-rose-950/90 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-[#090f1d] border-emerald-500/40 text-emerald-400'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg hover:shadow-emerald-900/50 transition flex items-center gap-1.5 border border-emerald-400/30"
          >
            <Send className="w-4 h-4" /> Finish & Submit
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase bg-[#090f1d] text-slate-300 border border-slate-800 px-3 py-1 rounded-full">
                  Question {currentQuestionIdx + 1} of {quiz.questions.length}
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full">
                  {qType === 'true_false'
                    ? 'True / False'
                    : qType === 'fill_in_blank'
                    ? 'Fill in the Blank'
                    : qType === 'one_word'
                    ? 'One-Word Answer'
                    : 'Multiple Choice (MCQ)'}
                </span>
              </div>

              <button
                onClick={toggleFlag}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  flagged[currentQuestionIdx]
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-600'
                    : 'bg-[#090f1d] text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {flagged[currentQuestionIdx] ? 'Flagged for Review' : 'Flag Question'}
              </button>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Answer Input depending on type */}
            {qType === 'fill_in_blank' || qType === 'one_word' ? (
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>{qType === 'fill_in_blank' ? 'Type the missing word / phrase:' : 'Type your single-word answer:'}</span>
                </label>
                <input
                  type="text"
                  inputMode="text"
                  value={typeof answers[currentQuestionIdx] === 'string' ? (answers[currentQuestionIdx] as string) : ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Type your answer here..."
                  spellCheck={false}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  data-form-type="other"
                  style={{ WebkitTextSecurity: 'none' }}
                  className="w-full bg-[#090f1d] border border-blue-500/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 rounded-2xl px-4 py-3.5 text-white text-base font-semibold focus:outline-none transition shadow-inner placeholder:text-slate-500"
                />
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-amber-300">Smart AI Grading:</strong> Exact answer awards 1.0 Mark. Minor spelling errors or typos automatically receive 0.5 Marks (Half Credit) with a correction note!
                  </span>
                </div>
              </div>
            ) : (
              /* Options List (MCQ or True/False) */
              <div className="space-y-3 pt-2">
                {currentQ.options.map((option, oIdx) => {
                  const isSelected = answers[currentQuestionIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full p-4 rounded-2xl text-left border transition flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-blue-900/50 border-blue-500 text-blue-100 shadow-lg ring-2 ring-blue-500/40'
                          : 'bg-[#090f1d] border-slate-700/80 text-slate-300 hover:border-blue-500/40 hover:bg-[#131d35]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-9 h-9 rounded-xl font-mono font-bold flex items-center justify-center text-xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {qType === 'true_false' ? (oIdx === 0 ? 'T' : 'F') : String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-sm font-semibold">{option}</span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'border-blue-400 bg-blue-500 text-slate-950'
                            : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Previous / Next Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-700/80">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                className="px-4 py-2.5 rounded-xl bg-[#090f1d] border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition text-xs font-bold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                disabled={currentQuestionIdx === quiz.questions.length - 1}
                onClick={() =>
                  setCurrentQuestionIdx((p) => Math.min(quiz.questions.length - 1, p + 1))
                }
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 transition text-xs font-bold flex items-center gap-1.5 shadow-md border border-emerald-400/30"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Grid Navigator (1 col) */}
        <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-5 shadow-2xl h-fit space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Question Navigator
            </h4>
            <span className="text-xs font-bold text-emerald-400">
              {answeredCount} / {quiz.questions.length} Answered
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, idx) => {
              const ansVal = answers[idx];
              const isAnswered = ansVal !== undefined && ansVal !== '';
              const isCurrent = currentQuestionIdx === idx;
              const isFlagged = flagged[idx];

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`h-10 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center relative ${
                    isCurrent
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#131d35] font-black scale-105'
                      : ''
                  } ${
                    isAnswered
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#090f1d] text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-700/80 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#090f1d] border border-slate-800 inline-block" /> Unanswered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Flagged for review
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131d35] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Confirm Evaluation Submission
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have answered <span className="text-emerald-400 font-bold">{answeredCount}</span> of <span className="text-white font-bold">{quiz.questions.length}</span> questions. Once submitted, your score will be instantly evaluated.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Return to Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
