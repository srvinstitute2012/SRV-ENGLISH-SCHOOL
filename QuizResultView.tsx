import React, { useState } from 'react';
import { Quiz, QuizAttempt, User } from './types';
import { evaluateQuestionAnswer } from './storage';
import { Award, CheckCircle2, XCircle, Printer, ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';
import { PrintableGradebook } from './PrintableGradebook';

interface QuizResultViewProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  student: User;
  onBackToDashboard: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quiz,
  attempt,
  student,
  onBackToDashboard,
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#0d1527] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Score Banner */}
        <div className="bg-[#131d35] border border-emerald-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-950/90 text-emerald-400 rounded-2xl border border-emerald-500/50 flex items-center justify-center mx-auto shadow-lg">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              Evaluation Completed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3">{quiz.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Student: <span className="text-white font-bold">{student.fullName}</span> (Roll #{student.studentDetails?.rollNo} - {student.studentDetails?.class})
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Score</div>
              <div className="text-xl font-black text-white mt-0.5">{attempt.score} / {attempt.total}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Percentage</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{attempt.percentage}%</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Grade</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{attempt.grade}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Time Taken</div>
              <div className="text-xl font-black text-slate-200 mt-0.5">{formatSeconds(attempt.timeTakenSeconds)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Printable Gradebook Report Card
            </button>
            <button
              onClick={onBackToDashboard}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Student Dashboard
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" /> Question-by-Question Solutions & Explanations
          </h2>

          <div className="space-y-6">
            {quiz.questions.map((q, idx) => {
              const evalRes = evaluateQuestionAnswer(q, attempt.answers[idx]);
              const questionScore = attempt.questionScores?.[idx] !== undefined ? attempt.questionScores[idx] : evalRes.score;
              const spellingNote = attempt.spellingNotes?.[idx] || evalRes.spellingNote;
              const studentAns = attempt.answers[idx];
              const qType = q.type || 'mcq';

              return (
                <div
                  key={q.id || idx}
                  className={`bg-[#090f1d] border rounded-2xl p-5 space-y-4 transition shadow-md ${
                    questionScore === 1.0
                      ? 'border-emerald-500/50'
                      : questionScore === 0.5
                      ? 'border-amber-500/60 bg-amber-950/20'
                      : 'border-rose-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-sm text-slate-100 flex items-start gap-2">
                      <span className="text-emerald-400 font-mono">Q{idx + 1}.</span>
                      <div className="space-y-1">
                        <div>{q.question}</div>
                        <span className="inline-block text-[10px] font-semibold bg-[#131d35] text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full">
                          {qType === 'true_false' ? 'True / False' : qType === 'fill_in_blank' ? 'Fill in the Blank' : qType === 'one_word' ? 'One-Word Answer' : 'Multiple Choice'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 flex-shrink-0 shadow-sm ${
                        questionScore === 1.0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          : questionScore === 0.5
                          ? 'bg-amber-950/90 text-amber-200 border border-amber-500/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                      }`}
                    >
                      {questionScore === 1.0 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> +1.0 Mark (Full Credit)
                        </>
                      ) : questionScore === 0.5 ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> +0.5 Marks (Partial Credit)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> 0 Marks
                        </>
                      )}
                    </span>
                  </div>

                  {/* Answer Details */}
                  {qType === 'fill_in_blank' || qType === 'one_word' ? (
                    <div className="bg-[#131d35] p-4 rounded-2xl border border-slate-700/80 text-xs space-y-2.5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Typed Response:</div>
                      <div className="font-mono text-sm text-white font-bold bg-[#090f1d] px-3.5 py-2.5 rounded-xl border border-slate-700">
                        {studentAns !== undefined && String(studentAns).trim() !== '' ? (
                          String(studentAns)
                        ) : (
                          <span className="text-slate-500 italic">No answer provided</span>
                        )}
                      </div>

                      {spellingNote && (
                        <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{spellingNote} (+0.5 Partial Credit awarded)</span>
                        </div>
                      )}

                      <div className="text-xs text-emerald-400 font-semibold pt-1">
                        Correct Answer Key: <span className="font-mono text-white underline font-bold">{evalRes.correctAnswerText}</span>
                      </div>
                    </div>
                  ) : (
                    /* Options List for MCQ & True/False */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isStudentChoice = studentAns === oIdx;
                        const isAnswerKey = oIdx === q.correctAnswer;

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-lg border text-left flex items-center justify-between ${
                              isAnswerKey
                                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-100 font-bold'
                                : isStudentChoice
                                ? 'bg-rose-950/80 border-rose-600 text-rose-100 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-500">
                                {qType === 'true_false' ? (oIdx === 0 ? 'T' : 'F') : String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isAnswerKey && (
                              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isAnswerKey && (
                              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                Your Selection
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation Block */}
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">
                      Academic Explanation & Key Solution:
                    </div>
                    <div className="leading-relaxed">{q.explanation}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Print Gradebook Modal */}
      {showPrintModal && (
        <PrintableGradebook
          student={student}
          attempt={attempt}
          quiz={quiz}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
