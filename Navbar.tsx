import React, { useState } from 'react';
import { SRVLogo } from './SRVLogo';
import { User } from './types';
import { LogOut, UserCheck, Shield, GraduationCap, BookOpen, RefreshCw, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser?: (user: User) => void;
  onResetData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onResetData,
}) => {
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white border-b border-red-600/80 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 h-20 min-h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo, Title & Inline Tag */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <SRVLogo size="md" lightMode={false} />
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-red-950/80 text-amber-200 px-2.5 py-1 rounded-full border border-red-400/40 font-bold text-[11px] shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            Academic Portal 2026
          </span>
        </div>

        {/* User Status & Action Buttons on Far Right */}
        {currentUser && (
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Quick User Role Badge */}
            <div className="hidden lg:flex items-center gap-2.5 bg-red-950/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-400/30 shadow-sm">
              <div className="p-1 rounded-full bg-red-900/80 text-amber-300 border border-red-400/30">
                {currentUser.role === 'principal' && <Shield className="w-3.5 h-3.5 text-amber-300" />}
                {currentUser.role === 'teacher' && <BookOpen className="w-3.5 h-3.5 text-emerald-300" />}
                {currentUser.role === 'student' && <GraduationCap className="w-3.5 h-3.5 text-amber-300" />}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white leading-none">{currentUser.fullName}</div>
                <div className="text-amber-300 text-[10px] font-medium mt-0.5 capitalize">
                  {currentUser.role === 'principal' && 'Principal'}
                  {currentUser.role === 'teacher' && `${currentUser.teacherDetails?.assignedClass}`}
                  {currentUser.role === 'student' && `Roll #${currentUser.studentDetails?.rollNo}`}
                </div>
              </div>
            </div>

            {/* Role Switcher Demo Tool */}
            {onSwitchUser && (
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/80 hover:bg-red-900 text-white transition border border-red-400/40 shadow-sm"
                title="Switch role for quick testing"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Switch Role</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/90 hover:bg-red-900 text-red-100 hover:text-white border border-red-400/40 transition shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-red-300" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Switch Role Quick Modal */}
      {showSwitchModal && onSwitchUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Quick Role Switcher (Demo)
              </h3>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Select a role below to jump into that workflow instantly:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onSwitchUser({
                    id: 'usr-principal-1',
                    username: 'principal',
                    password: 'srv',
                    fullName: 'Dr. K. R. Sharma',
                    role: 'principal',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                  });
                  setShowSwitchModal(false);
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" /> Principal
                  </div>
                  <div className="text-xs text-slate-400">Dr. K. R. Sharma - Approvals & School-wide Analytics</div>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  Select
                </span>
              </button>

              <button
                onClick={() => {
                  onSwitchUser({
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
                  });
                  setShowSwitchModal(false);
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" /> Class 10th Teacher
                  </div>
                  <div className="text-xs text-slate-400">Mrs. Anitha Raman (English) - Student Approvals & AI Quizzes</div>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  Select
                </span>
              </button>

              <button
                onClick={() => {
                  onSwitchUser({
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
                  });
                  setShowSwitchModal(false);
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-400" /> Approved Student (10th Std)
                  </div>
                  <div className="text-xs text-slate-400">Rahul V. Verma (Roll #1001) - Take Quizzes & View Gradebook</div>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  Select
                </span>
              </button>
            </div>

            {onResetData && (
              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset system data back to default initial state?')) {
                      onResetData();
                      setShowSwitchModal(false);
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset School Data
                </button>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
