import React, { useState } from 'react';
import { User, Quiz, QuizAttempt, StandardClass, QuizQuestion, QuestionType, STANDARD_CLASSES, SUBJECT_OPTIONS } from '../types';
import {
  getStoredUsers,
  saveUsers,
  getStoredQuizzes,
  saveQuizzes,
  getStoredAttempts,
  formatDateToDDMMYYYY,
} from '../lib/storage';
import {
  BookOpen,
  Users,
  UserCheck,
  UserX,
  Sparkles,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart2,
  Trash2,
  Send,
  HelpCircle,
  Eye,
  Lock,
  GraduationCap,
  Filter,
  Upload,
  Image as ImageIcon,
  X,
  Camera,
} from 'lucide-react';
import { PrintableGradebook } from '../components/PrintableGradebook';

interface TeacherDashboardProps {
  currentUser: User;
  onRefreshData?: () => void;
}

interface UploadedImageItem {
  id: string;
  name: string;
  preview: string;
  base64: string;
  mimeType: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const teacherDetails = currentUser.teacherDetails || {
    subject: 'General Science',
    assignedClass: '10th Standard' as StandardClass,
  };

  const assignedClass = teacherDetails.assignedClass;

  const [activeTab, setActiveTab] = useState<'students' | 'generator' | 'quizzes' | 'gradebook'>('students');
  const [users, setUsers] = useState<User[]>(getStoredUsers());
  const [quizzes, setQuizzes] = useState<Quiz[]>(getStoredQuizzes());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(getStoredAttempts());

  // Generator State
  const [topic, setTopic] = useState('');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    teacherDetails.subject || SUBJECT_OPTIONS[0]
  );
  const [targetClass, setTargetClass] = useState<StandardClass>(assignedClass);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [questionFormat, setQuestionFormat] = useState<QuestionType>('mcq');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<{
    title: string;
    questions: QuizQuestion[];
  } | null>(null);
  const [genError, setGenError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const newItems: UploadedImageItem[] = [];

    let processedCount = 0;
    fileList.forEach((file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit and was skipped.`);
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        newItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          name: file.name,
          preview: result,
          base64: base64Data,
          mimeType: file.type || 'image/jpeg',
        });
        processedCount++;
        if (processedCount === fileList.length) {
          setUploadedImages((prev) => [...prev, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (idToRemove: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleClearAllImages = () => {
    setUploadedImages([]);
  };

  // Allotment Form State
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );

  // Filter for Quizzes tab
  const [quizFilterClass, setQuizFilterClass] = useState<string>('ALL');

  // Print Gradebook Modal State
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<{
    student: User;
    attempt?: QuizAttempt;
    quiz?: Quiz;
  } | null>(null);

  const refreshState = () => {
    setUsers(getStoredUsers());
    setQuizzes(getStoredQuizzes());
    setAttempts(getStoredAttempts());
    if (onRefreshData) onRefreshData();
  };

  // Filter students pending for this teacher's assigned class
  const pendingStudents = users.filter(
    (u) =>
      u.role === 'student' &&
      u.status === 'pending' &&
      u.studentDetails?.class === assignedClass
  );

  const approvedStudents = users.filter(
    (u) =>
      u.role === 'student' &&
      u.status === 'approved' &&
      u.studentDetails?.class === assignedClass
  );

  // Approve / Reject Student
  const handleStudentApproval = (studentId: string, approve: boolean) => {
    const updated = users.map((u) => {
      if (u.id === studentId) {
        return { ...u, status: approve ? ('approved' as const) : ('rejected' as const) };
      }
      return u;
    });
    setUsers(updated);
    saveUsers(updated);
    refreshState();
  };

  // Call Gemini AI server API to generate 20 MCQs
  const handleGenerateAIQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenError('');
    setGeneratedQuiz(null);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          targetClass: targetClass,
          topic,
          sourceMaterial,
          images: uploadedImages.map((img) => ({
            base64: img.base64,
            mimeType: img.mimeType,
          })),
          difficulty,
          questionCount,
          questionFormat,
        }),
      });

      const data = await res.json();

      if (data.success && data.quiz) {
        setGeneratedQuiz(data.quiz);
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setGenError('Unable to generate AI quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated quiz and allot to class
  const handleSaveAndAllotQuiz = () => {
    if (!generatedQuiz) return;

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: generatedQuiz.title,
      subject: selectedSubject,
      targetClass: targetClass,
      createdById: currentUser.id,
      createdByName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      durationMinutes,
      totalQuestions: generatedQuiz.questions.length,
      questions: generatedQuiz.questions,
      isAllotted: true,
      allottedAt: new Date().toISOString(),
      dueDate,
    };

    const updatedQuizzes = [newQuiz, ...quizzes];
    setQuizzes(updatedQuizzes);
    saveQuizzes(updatedQuizzes);
    setGeneratedQuiz(null);
    setTopic('');
    setActiveTab('quizzes');
    refreshState();
  };

  // If Account Pending Approval
  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-amber-800/80 rounded-2xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-amber-950 text-amber-400 rounded-2xl border border-amber-800 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-amber-300">Account Pending Principal Approval</h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Welcome <span className="font-bold text-white">{currentUser.fullName}</span>! Your registration as <span className="text-emerald-400 font-bold">{teacherDetails.subject} Teacher ({assignedClass})</span> has been submitted to Dr. K. R. Sharma (Principal).
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
            Once approved by the Principal, you will gain full access to approve students, generate AI quizzes, and evaluate class performance.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1527] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b from-emerald-400 to-teal-500" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-xs font-semibold mb-3">
              <BookOpen className="w-3.5 h-3.5" /> Class Teacher Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {teacherDetails.subject} Evaluation
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Assigned Class: <span className="text-emerald-400 font-bold">{assignedClass}</span> • Teacher: <span className="text-white font-bold">{currentUser.fullName}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-[#090f1d] border border-slate-700/80 px-4 py-3 rounded-2xl min-w-[120px] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pending Students</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{pendingStudents.length}</div>
            </div>
            <div className="bg-[#090f1d] border border-slate-700/80 px-4 py-3 rounded-2xl min-w-[120px] shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Approved Students</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{approvedStudents.length}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-[#131d35] border border-slate-700/80 rounded-2xl shadow-xl">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Pending Student Approvals ({pendingStudents.length})
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            AI Quiz Generator
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
            Class Quizzes & Allotments
          </button>

          <button
            onClick={() => setActiveTab('gradebook')}
            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gradebook'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Gradebook & Report Cards
          </button>
        </div>

        {/* TAB 1: PENDING STUDENT APPROVALS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-amber-400" /> Pending Student Approvals for {assignedClass}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Students registered under <span className="text-emerald-400 font-bold">{assignedClass}</span> require your approval before accessing class quizzes.
              </p>

              {pendingStudents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <div className="text-sm font-bold text-slate-200">No Pending Students</div>
                  <div className="text-xs text-slate-500 mt-1">All student registration requests for {assignedClass} have been processed.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingStudents.map((st) => (
                    <div
                      key={st.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-amber-500/50 transition shadow-md flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/80 text-[10px] font-bold uppercase">
                            Pending Approval
                          </span>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            Roll #{st.studentDetails?.rollNo}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{st.fullName}</h3>
                        <div className="text-xs text-slate-400 mt-1">
                          Username: <span className="text-slate-200 font-mono">@{st.username}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Class: <span className="text-slate-200 font-semibold">{st.studentDetails?.class}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleStudentApproval(st.id, true)}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleStudentApproval(st.id, false)}
                          className="py-2 px-3 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Students Directory */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-emerald-400" /> Active Roster for {assignedClass} ({approvedStudents.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {approvedStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                          #{st.studentDetails?.rollNo}
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{st.fullName}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">@{st.username}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Approved
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudentForPrint({ student: st })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 border border-slate-700 hover:border-emerald-600 transition text-[11px] font-semibold"
                          >
                            <Printer className="w-3 h-3" /> Print Gradebook
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI QUIZ GENERATOR (CUSTOM QUESTION COUNT) */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Generate AI Evaluation Quiz</h2>
                  <p className="text-xs text-slate-400">
                    Powered by Gemini AI • Active Subject: <span className="text-emerald-400 font-bold">{selectedSubject}</span>
                  </p>
                </div>
              </div>

              {genError && (
                <div className="mb-4 p-4 rounded-xl bg-rose-950 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  {genError}
                </div>
              )}

              <form onSubmit={handleGenerateAIQuiz} className="space-y-5">
                {/* Dynamic Subject & Target Class Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Quiz Subject</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Select Subject</span>
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      {SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub} {sub === teacherDetails.subject ? '(Primary Specialty)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Allot To Target Class Standard
                    </label>
                    <select
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value as StandardClass)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      {STANDARD_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c} {c === assignedClass ? '(Home Class)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Topic / Syllabus Focus
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Chemical Reactions, Shakespeare's Macbeth, Linear Equations, Cell Biology, Grammatical Rules"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Ground-Truth Source Material / Textbook Context Input Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <BookOpen className="w-4 h-4 text-emerald-400" /> Lesson Reference / Textbook Context (Ground-Truth Source)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional • Text, Links, or Notes</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sourceMaterial}
                    onChange={(e) => setSourceMaterial(e.target.value)}
                    placeholder="Paste textbook paragraphs, chapter notes, lesson summary, or web reference links. Gemini AI will strictly ground questions on this content to guarantee 100% factual accuracy."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500 transition"
                  />
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                    <span>💡 Gemini will generate questions strictly based on this reference text without using conflicting external facts.</span>
                    {sourceMaterial.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSourceMaterial('')}
                        className="text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Clear Source
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Textbook / Lesson Photos (Multimodal Ground-Truth Input) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between flex-wrap gap-1">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Camera className="w-4 h-4 text-cyan-400" /> Upload Textbook / Lesson Photos (Optional Multimodal Ground-Truth)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5">
                      {uploadedImages.length > 0 && (
                        <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                          {uploadedImages.length} Page{uploadedImages.length > 1 ? 's' : ''} Attached
                        </span>
                      )}
                      <span>JPG, PNG, WebP • Max 10MB/photo</span>
                    </span>
                  </label>

                  {uploadedImages.length > 0 ? (
                    <div className="space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {uploadedImages.map((imgItem, idx) => (
                          <div
                            key={imgItem.id}
                            className="relative bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-lg p-2.5 flex items-center justify-between shadow transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={imgItem.preview}
                                  alt={`Page ${idx + 1}`}
                                  className="w-12 h-12 object-cover rounded-md border border-slate-700 shadow-sm"
                                />
                                <span className="absolute -top-1.5 -left-1.5 bg-cyan-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                                  P{idx + 1}
                                </span>
                              </div>
                              <div className="min-w-0 pr-1">
                                <p className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[170px]">
                                  {imgItem.name}
                                </p>
                                <p className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 mt-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> Page {idx + 1} Grounding
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgItem.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 rounded-md transition flex-shrink-0"
                              title="Remove page photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                        <label className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold rounded-lg cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Add More Photos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleClearAllImages}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-medium transition"
                        >
                          Remove All ({uploadedImages.length})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-4 bg-slate-950/60 transition group cursor-pointer text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition">
                            Click or drag photos of textbook pages / handwritten notes (Select multiple pages)
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Gemini AI will analyze text & diagrams across all uploaded pages to ground the quiz
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Question Format
                    </label>
                    <select
                      value={questionFormat}
                      onChange={(e) => setQuestionFormat(e.target.value as QuestionType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="mcq">Multiple Choice Questions (MCQs)</option>
                      <option value="true_false">True / False (2 choices)</option>
                      <option value="fill_in_blank">Fill in the Blanks</option>
                      <option value="one_word">One-Word Answer</option>
                      <option value="mixed">Mixed Format (Combination of All Types)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="Easy">Easy (Foundational)</option>
                      <option value="Medium">Medium (Standard Academic)</option>
                      <option value="Hard">Hard (Advanced Evaluation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Number of Questions</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Custom Count</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 transition"
                        placeholder="Enter number (e.g. 5, 10, 20)"
                      />
                      <div className="flex items-center gap-1">
                        {[5, 10, 15, 20, 25].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setQuestionCount(cnt)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition ${
                              questionCount === cnt
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-4 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-xl shadow-emerald-950/50 transition flex items-center justify-center gap-2 text-sm"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Gemini AI Generating {questionCount} Questions in {selectedSubject}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-emerald-300" />
                      Generate {questionCount} {questionFormat === 'true_false' ? 'True/False Questions' : questionFormat === 'fill_in_blank' ? 'Fill-in-Blank Questions' : questionFormat === 'one_word' ? 'One-Word Questions' : questionFormat === 'mixed' ? 'Mixed-Format Questions' : 'MCQs'} in {selectedSubject} for {targetClass}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* AI Generated Quiz Preview */}
            {generatedQuiz && (
              <div className="bg-slate-900 border border-emerald-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full">
                        ✓ AI Generated Quiz Ready
                      </span>
                      <span className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-full font-bold">
                        {selectedSubject}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-2">{generatedQuiz.title}</h3>
                    <p className="text-xs text-slate-400">
                      Target Class: <span className="text-emerald-400 font-bold">{targetClass}</span> • Total Questions: {generatedQuiz.questions.length} MCQs
                    </p>
                  </div>

                  {/* Allotment Config */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 min-w-[280px]">
                    <div className="text-xs font-bold text-slate-300 uppercase">Allotment Settings</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase">Duration (Mins)</label>
                        <input
                          type="number"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase">Due Date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveAndAllotQuiz}
                      className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Send className="w-4 h-4" /> Allot Quiz to {targetClass}
                    </button>
                  </div>
                </div>

                {/* Questions Preview List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {generatedQuiz.questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="font-bold text-sm text-slate-100 flex items-start gap-2">
                        <span className="text-emerald-400 font-mono">Q{idx + 1}.</span>
                        <span>{q.question}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pl-6">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 rounded border text-left ${
                              oIdx === q.correctAnswer
                                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="font-mono text-slate-500 mr-2">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            {opt}
                            {oIdx === q.correctAnswer && (
                              <span className="ml-2 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">
                                Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pl-6 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                        <span className="font-bold text-emerald-400">Explanation: </span>
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZZES & ALLOTMENTS */}
        {activeTab === 'quizzes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" /> Active School Assignments & Quizzes
                </h2>
                <p className="text-xs text-slate-400">
                  Manage quizzes created across subjects and Class Standards. Primary Expertise: <span className="text-emerald-400 font-bold">{teacherDetails.subject}</span>.
                </p>
              </div>

              {/* Filter bar */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={quizFilterClass}
                  onChange={(e) => setQuizFilterClass(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Classes (6th to 10th)</option>
                  {STANDARD_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c} {c === assignedClass ? '(Home Class)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes
                .filter((q) => quizFilterClass === 'ALL' || q.targetClass === quizFilterClass)
                .map((q) => (
                  <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                          {q.subject}
                        </span>
                        <span className="text-xs bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {q.targetClass}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Due: <span className="text-amber-400 font-bold">{formatDateToDDMMYYYY(q.dueDate)}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{q.title}</h3>
                    <p className="text-xs text-slate-400">
                      Created by <span className="text-slate-200 font-semibold">{q.createdByName}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        Questions: <span className="text-white font-bold">{q.totalQuestions || q.questions?.length || 0} MCQs</span>
                      </div>
                      <div>
                        Duration: <span className="text-white font-bold">{q.durationMinutes} mins</span>
                      </div>
                      <div>
                        Allotted On: <span className="text-slate-300">{formatDateToDDMMYYYY(q.allottedAt)}</span>
                      </div>
                      <div>
                        Status: <span className="text-emerald-400 font-bold">✓ Allotted</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: GRADEBOOK & REPORT CARDS */}
        {activeTab === 'gradebook' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Class Evaluation Gradebook & Printable Reports
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll No</th>
                    <th className="px-4 py-3">Quiz Title</th>
                    <th className="px-4 py-3">Score / Total</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {attempts
                    .filter((a) => a.studentClass === assignedClass)
                    .map((att) => {
                      const studentObj = users.find((u) => u.id === att.studentId);
                      const quizObj = quizzes.find((q) => q.id === att.quizId);

                      return (
                        <tr key={att.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-bold text-white">{att.studentName}</td>
                          <td className="px-4 py-3 font-mono text-emerald-400 font-bold">#{att.studentRollNo}</td>
                          <td className="px-4 py-3 text-slate-300">{att.quizTitle}</td>
                          <td className="px-4 py-3 font-bold text-white">{att.score} / {att.total}</td>
                          <td className="px-4 py-3 font-bold text-emerald-300">{att.percentage}%</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {att.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setSelectedStudentForPrint({
                                  student: studentObj || ({
                                    fullName: att.studentName,
                                    studentDetails: { rollNo: att.studentRollNo, class: att.studentClass },
                                  } as any),
                                  attempt: att,
                                  quiz: quizObj,
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition shadow"
                            >
                              <Printer className="w-3.5 h-3.5" /> Printable Gradebook
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Printable Gradebook Modal */}
      {selectedStudentForPrint && (
        <PrintableGradebook
          student={selectedStudentForPrint.student}
          attempt={selectedStudentForPrint.attempt}
          quiz={selectedStudentForPrint.quiz}
          onClose={() => setSelectedStudentForPrint(null)}
        />
      )}
    </div>
  );
};
