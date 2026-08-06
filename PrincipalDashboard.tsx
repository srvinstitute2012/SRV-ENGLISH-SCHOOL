import React, { useState } from 'react';
import { User, Quiz, QuizAttempt, StandardClass, STANDARD_CLASSES } from '../types';
import {
  getStoredUsers,
  saveUsers,
  getStoredQuizzes,
  getStoredAttempts,
  getSecretSetupKey,
  saveSecretSetupKey,
  formatDateToDDMMYYYY,
} from '../lib/storage';
import {
  Shield,
  UserCheck,
  UserX,
  Users,
  BookOpen,
  Award,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Search,
  ChevronRight,
  Filter,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface PrincipalDashboardProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'analytics' | 'quizzes' | 'users' | 'settings'>('approvals');
  const [users, setUsers] = useState<User[]>(getStoredUsers());
  const [quizzes, setQuizzes] = useState<Quiz[]>(getStoredQuizzes());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(getStoredAttempts());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Settings State
  const [newSecretKey, setNewSecretKey] = useState(getSecretSetupKey());
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const refreshState = () => {
    setUsers(getStoredUsers());
    setQuizzes(getStoredQuizzes());
    setAttempts(getStoredAttempts());
    if (onRefreshData) onRefreshData();
  };

  // Pending Teachers
  const pendingTeachers = users.filter((u) => u.role === 'teacher' && u.status === 'pending');
  const approvedTeachers = users.filter((u) => u.role === 'teacher' && u.status === 'approved');
  const allStudents = users.filter((u) => u.role === 'student');

  // Approve Teacher
  const handleTeacherApproval = (teacherId: string, approve: boolean) => {
    const updatedUsers = users.map((u) => {
      if (u.id === teacherId) {
        return { ...u, status: approve ? ('approved' as const) : ('rejected' as const) };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    refreshState();
  };

  // Save Secret Key
  const handleSaveSecretKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSecretKey.trim()) {
      saveSecretSetupKey(newSecretKey.trim());
      setSettingsSuccess('Secret Setup Key successfully updated!');
      setTimeout(() => setSettingsSuccess(''), 3000);
    }
  };

  // Calculate Cumulative Performance by Class (6th to 10th Standard)
  const getClassMetrics = (cls: StandardClass) => {
    const classStudents = allStudents.filter((s) => s.studentDetails?.class === cls);
    const classAttempts = attempts.filter((a) => a.studentClass === cls);
    const classQuizzes = quizzes.filter((q) => q.targetClass === cls);

    const totalScores = classAttempts.reduce((sum, a) => sum + a.percentage, 0);
    const avgScore = classAttempts.length > 0 ? Math.round(totalScores / classAttempts.length) : 0;

    // Top Scorer
    let topScorer = 'N/A';
    if (classAttempts.length > 0) {
      const sorted = [...classAttempts].sort((a, b) => b.percentage - a.percentage);
      topScorer = `${sorted[0].studentName} (${sorted[0].percentage}%)`;
    }

    return {
      studentCount: classStudents.length,
      quizCount: classQuizzes.length,
      attemptsCount: classAttempts.length,
      avgScore,
      topScorer,
    };
  };

  return (
    <div className="min-h-screen bg-[#0d1527] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b from-emerald-400 to-teal-500" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" /> Executive Administration Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Principal Evaluation Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              SRV English School • Welcome back, <span className="text-emerald-400 font-bold">{currentUser.fullName}</span>
            </p>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-[#090f1d] border border-slate-700/80 px-4 py-3 rounded-2xl min-w-[120px] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pending Approvals</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{pendingTeachers.length}</div>
            </div>
            <div className="bg-[#090f1d] border border-slate-700/80 px-4 py-3 rounded-2xl min-w-[120px] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Active Teachers</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{approvedTeachers.length}</div>
            </div>
            <div className="bg-[#090f1d] border border-slate-700/80 px-4 py-3 rounded-2xl min-w-[120px] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Quizzes</div>
              <div className="text-2xl font-black text-indigo-400 mt-0.5">{quizzes.length}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-[#131d35] border border-slate-700/80 rounded-2xl shadow-xl">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Pending Teachers ({pendingTeachers.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Class Results (6th to 10th)
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            All Generated Quizzes ({quizzes.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            School Directory
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            Principal Settings
          </button>
        </div>

        {/* TAB 1: PENDING TEACHER APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-amber-400" /> Pending Teacher Registrations
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Teachers who registered for SRV English School require your authorization before accessing their class dashboards.
              </p>

              {pendingTeachers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <div className="text-sm font-bold text-slate-200">All Teacher Registrations Processed</div>
                  <div className="text-xs text-slate-500 mt-1">There are no pending teacher applications at this time.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-amber-500/50 transition shadow-md flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/80 text-[10px] font-bold uppercase">
                            Pending Approval
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Registered: {formatDateToDDMMYYYY(teacher.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{teacher.fullName}</h3>
                        <div className="text-xs text-slate-400 mt-1">
                          Username: <span className="text-slate-200 font-mono">@{teacher.username}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Subject</span>
                            <span className="text-emerald-300 font-medium">{teacher.teacherDetails?.subject}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Class</span>
                            <span className="text-amber-300 font-medium">{teacher.teacherDetails?.assignedClass}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleTeacherApproval(teacher.id, true)}
                          className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <UserCheck className="w-4 h-4" /> Approve Teacher
                        </button>
                        <button
                          onClick={() => handleTeacherApproval(teacher.id, false)}
                          className="py-2.5 px-3 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <UserX className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUMULATIVE CLASS RESULTS (6TH TO 10TH STANDARD) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" /> School-wide Performance (Categorized strictly by Class)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    SRV English School operates strictly by Class Standard (6th, 7th, 8th, 9th, 10th).
                  </p>
                </div>
              </div>

              {/* Class Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {STANDARD_CLASSES.map((cls) => {
                  const m = getClassMetrics(cls);
                  return (
                    <div
                      key={cls}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/40 transition shadow-md relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-emerald-300 uppercase tracking-wide">{cls}</h3>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-bold">
                          {m.studentCount} Students
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Average Cumulative Score</div>
                          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
                            <span>{m.avgScore}%</span>
                            <span className="text-xs font-normal text-slate-400">({m.attemptsCount} test submissions)</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${m.avgScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900 p-2.5 rounded-lg">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Quizzes</span>
                            <span className="text-slate-200 font-bold">{m.quizCount}</span>
                          </div>
                          <div className="bg-slate-900 p-2.5 rounded-lg">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Top Performer</span>
                            <span className="text-emerald-400 font-bold truncate block">{m.topScorer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALL GENERATED QUIZZES MONITOR */}
        {activeTab === 'quizzes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> All AI Quizzes & Assessments
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                      {quiz.targetClass}
                    </span>
                    <span className="text-xs text-slate-400">
                      Created by {quiz.createdByName}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{quiz.title}</h3>
                  <div className="text-xs text-slate-400">
                    Subject: <span className="text-emerald-400 font-semibold">{quiz.subject}</span> • {quiz.totalQuestions || quiz.questions?.length || 0} Questions ({quiz.totalQuestions || quiz.questions?.length || 0} MCQs)
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className={`font-semibold ${quiz.isAllotted ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {quiz.isAllotted ? '✓ Allotted to Class' : 'Draft / Not Allotted'}
                    </span>
                    <span className="text-slate-500">
                      Duration: {quiz.durationMinutes} mins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SCHOOL DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> Complete SRV School Roster
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Class / Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-white">{u.fullName}</td>
                      <td className="px-4 py-3 capitalize text-slate-300 font-semibold">{u.role}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.role === 'teacher' && `${u.teacherDetails?.assignedClass} (${u.teacherDetails?.subject})`}
                        {u.role === 'student' && `${u.studentDetails?.class} - Roll #${u.studentDetails?.rollNo}`}
                        {u.role === 'principal' && 'Executive Principal'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : u.status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateToDDMMYYYY(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PRINCIPAL SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-xl mx-auto space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" /> Security & Secret Setup Key Management
            </h2>

            {settingsSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950 text-emerald-300 text-xs border border-emerald-800">
                {settingsSuccess}
              </div>
            )}

            <form onSubmit={handleSaveSecretKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  SRV Secret Setup Key (Required for First-Time Setup)
                </label>
                <input
                  type="text"
                  required
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default: <span className="font-mono text-slate-300">SRV2026</span>. Updating this key changes the requirement for new setup attempts.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 transition text-xs uppercase tracking-wider"
              >
                Update Secret Setup Key
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
