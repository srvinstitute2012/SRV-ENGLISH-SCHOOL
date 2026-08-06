import React from 'react';
import { User, QuizAttempt, Quiz } from '../types';
import { SRVLogo } from './SRVLogo';
import { Printer, X, Award, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatDateToDDMMYYYY } from '../lib/storage';

interface PrintableGradebookProps {
  student: User;
  attempt?: QuizAttempt;
  quiz?: Quiz;
  onClose: () => void;
}

export const PrintableGradebook: React.FC<PrintableGradebookProps> = ({
  student,
  attempt,
  quiz,
  onClose,
}) => {
  const rollNo = student.studentDetails?.rollNo || '1001';
  const studentClass = student.studentDetails?.class || '10th Standard';
  const score = attempt ? attempt.score : 18;
  const total = attempt ? attempt.total : (quiz ? quiz.questions.length : 20);
  const percentage = attempt ? attempt.percentage : 90;
  const grade = attempt ? attempt.grade : 'A+';
  const subject = attempt ? attempt.subject : 'English Language & Literature';
  const quizTitle = attempt ? attempt.quizTitle : 'Academic Assessment 2026';
  const dateStr = formatDateToDDMMYYYY(attempt ? attempt.submittedAt : new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8 print:shadow-none print:m-0 print:max-w-none print:w-full border border-slate-200">
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400 tracking-wider">
            <Award className="w-4 h-4" /> Official Printable Gradebook Preview
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" /> Print Gradebook Report
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE GRADEBOOK SHEET */}
        <div className="p-8 sm:p-12 space-y-8 bg-white" id="printable-gradebook-sheet">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-4">
              <SRVLogo size="lg" lightMode={true} />
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Official Academic Evaluation</div>
              <div className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gradebook Report</div>
              <div className="text-xs text-slate-600 mt-1">Academic Session 2026</div>
            </div>
          </div>

          {/* Student & Class Information Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Roll Number</span>
              <span className="font-bold text-emerald-800 text-sm font-mono">#{rollNo}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Enrolled Class</span>
              <span className="font-bold text-slate-900 text-sm">{studentClass}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Evaluation Date</span>
              <span className="font-bold text-slate-900 text-sm">{dateStr}</span>
            </div>
          </div>

          {/* Performance Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Examination & AI Assessment Breakdown
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px]">
                  <th className="p-3 border border-slate-900">Subject</th>
                  <th className="p-3 border border-slate-900">Assessment Title</th>
                  <th className="p-3 border border-slate-900 text-center">Score</th>
                  <th className="p-3 border border-slate-900 text-center">Percentage</th>
                  <th className="p-3 border border-slate-900 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-3 font-bold text-slate-900 border-x border-slate-300">{subject}</td>
                  <td className="p-3 text-slate-800 border-r border-slate-300">{quizTitle}</td>
                  <td className="p-3 text-center font-bold text-slate-900 border-r border-slate-300">{score} / {total}</td>
                  <td className="p-3 text-center font-bold text-emerald-800 border-r border-slate-300">{percentage}%</td>
                  <td className="p-3 text-center font-black text-slate-900 border-r border-slate-300">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      {grade}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grading Key Scale */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div><span className="font-bold text-emerald-800">A+</span>: 90% - 100%</div>
            <div><span className="font-bold text-emerald-700">A</span>: 80% - 89%</div>
            <div><span className="font-bold text-blue-700">B</span>: 70% - 79%</div>
            <div><span className="font-bold text-amber-700">C</span>: 60% - 69%</div>
            <div><span className="font-bold text-orange-700">D</span>: 50% - 59%</div>
            <div><span className="font-bold text-rose-700">F</span>: Below 50%</div>
          </div>

          {/* Official Signatures & Seal */}
          <div className="pt-12 grid grid-cols-2 gap-8 items-end border-t border-slate-300 text-xs">
            <div>
              <div className="font-mono text-[10px] text-slate-400 mb-1">STAMP & SEAL</div>
              <div className="w-24 h-24 border-2 border-emerald-800 rounded-full flex flex-col items-center justify-center p-2 text-center text-[9px] font-bold text-emerald-900 uppercase opacity-90 border-dashed bg-emerald-50">
                <ShieldCheck className="w-6 h-6 text-emerald-800 mb-0.5" />
                <span>SRV ENGLISH SCHOOL</span>
                <span className="text-[7px]">EVALUATION SEAL</span>
              </div>
            </div>

            <div className="text-right space-y-12">
              <div className="border-b border-slate-900 pb-1 font-serif text-sm italic font-bold text-slate-900">
                Dr. K. R. Sharma
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Principal Signature
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-200">
            SRV English School • Verified Official Report Card • Generated via AI Examination Portal
          </div>
        </div>
      </div>
    </div>
  );
};
