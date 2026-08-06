import React, { useState } from 'react';
import { SRVLogo } from '../components/SRVLogo';
import { User, Role, StandardClass, STANDARD_CLASSES, SUBJECT_OPTIONS } from '../types';
import { getStoredUsers, saveUsers, getSecretSetupKey, saveCurrentUser } from '../lib/storage';
import { Shield, BookOpen, GraduationCap, Key, Lock, UserPlus, LogIn, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'principal-setup'>('login');
  const [role, setRole] = useState<Role>('student');

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [assignedClass, setAssignedClass] = useState<StandardClass>('10th Standard');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentClass, setStudentClass] = useState<StandardClass>('10th Standard');

  // Principal First-Time Setup State
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isSecretVerified, setIsSecretVerified] = useState(false);
  const [principalUsername, setPrincipalUsername] = useState('');
  const [principalPassword, setPrincipalPassword] = useState('');
  const [principalFullName, setPrincipalFullName] = useState('Dr. K. R. Sharma (Principal)');

  // Alerts
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetAlerts = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Handle Principal First-Time Key Verification
  const handleVerifySecretKey = (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();
    const storedSecretKey = getSecretSetupKey();

    if (secretKeyInput.trim() === storedSecretKey) {
      setIsSecretVerified(true);
      setSuccessMessage('Secret Setup Key verified! Please set up your Principal username and password below.');
    } else {
      setErrorMessage(`Invalid Secret Setup Key! (Default key is "SRV2026").`);
    }
  };

  // 2. Complete Principal Setup
  const handleCompletePrincipalSetup = (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    if (!principalUsername.trim() || !principalPassword.trim()) {
      setErrorMessage('Please provide both Username and Password.');
      return;
    }

    const users = getStoredUsers();
    // Check if principal account already exists, update or create
    const existingIndex = users.findIndex((u) => u.role === 'principal');

    const principalUser: User = {
      id: existingIndex >= 0 ? users[existingIndex].id : `usr-principal-${Date.now()}`,
      username: principalUsername.trim(),
      password: principalPassword.trim(),
      fullName: principalFullName.trim() || 'Principal',
      role: 'principal',
      status: 'approved',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = principalUser;
    } else {
      users.push(principalUser);
    }

    saveUsers(users);
    saveCurrentUser(principalUser);
    onLoginSuccess(principalUser);
  };

  // 3. Handle Regular User Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    const users = getStoredUsers();
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (!foundUser) {
      setErrorMessage('Invalid username or password. Please check your credentials or register.');
      return;
    }

    // Check account status
    saveCurrentUser(foundUser);
    onLoginSuccess(foundUser);
  };

  // 4. Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const users = getStoredUsers();
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (usernameExists) {
      setErrorMessage('Username already taken. Please choose another username.');
      return;
    }

    let newUser: User;

    if (role === 'teacher') {
      newUser = {
        id: `usr-teacher-${Date.now()}`,
        username: username.trim(),
        password: password,
        fullName: fullName.trim(),
        role: 'teacher',
        status: 'pending', // Pending Principal Approval
        createdAt: new Date().toISOString(),
        teacherDetails: {
          subject,
          assignedClass,
        },
      };
    } else if (role === 'student') {
      if (!studentRollNo.trim()) {
        setErrorMessage('Please enter your Roll Number.');
        return;
      }
      newUser = {
        id: `usr-student-${Date.now()}`,
        username: username.trim(),
        password: password,
        fullName: fullName.trim(),
        role: 'student',
        status: 'pending', // Pending Teacher Approval
        createdAt: new Date().toISOString(),
        studentDetails: {
          rollNo: studentRollNo.trim(),
          class: studentClass,
        },
      };
    } else {
      setErrorMessage('For Principal registration, please use the First-Time Principal Setup tab.');
      return;
    }

    users.push(newUser);
    saveUsers(users);
    saveCurrentUser(newUser);
    onLoginSuccess(newUser);
  };

  // Quick Demo Login Handler
  const handleDemoLogin = (demoRole: 'principal' | 'teacher-approved' | 'teacher-pending' | 'student-approved' | 'student-pending') => {
    const users = getStoredUsers();
    let target: User | undefined;

    if (demoRole === 'principal') {
      target = users.find((u) => u.role === 'principal');
    } else if (demoRole === 'teacher-approved') {
      target = users.find((u) => u.role === 'teacher' && u.status === 'approved');
    } else if (demoRole === 'teacher-pending') {
      target = users.find((u) => u.role === 'teacher' && u.status === 'pending');
    } else if (demoRole === 'student-approved') {
      target = users.find((u) => u.role === 'student' && u.status === 'approved');
    } else if (demoRole === 'student-pending') {
      target = users.find((u) => u.role === 'student' && u.status === 'pending');
    }

    if (target) {
      saveCurrentUser(target);
      onLoginSuccess(target);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0d1527] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-950 via-red-800 to-red-950 border-2 border-red-500/60 shadow-2xl mb-4 relative overflow-hidden">
            <div className="flex items-center justify-center">
              <SRVLogo size="xl" />
            </div>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Official Academic Evaluation & AI Examination Management System
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="bg-[#131d35] border border-slate-700/80 rounded-2xl p-1.5 flex gap-1 mb-6 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              resetAlerts();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" /> Account Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              resetAlerts();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" /> New Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('principal-setup');
              resetAlerts();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'principal-setup'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-amber-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" /> Principal Setup
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600" />

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. principal, anitha, rahul10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 text-sm"
              >
                <LogIn className="w-4 h-4" /> Sign In to SRV Portal
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Role Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      role === 'teacher'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Class Teacher</div>
                      <div className="text-[10px] text-slate-400">Requires Principal Approval</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      role === 'student'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Student</div>
                      <div className="text-[10px] text-slate-400">Requires Teacher Approval</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'teacher' ? 'e.g. Mrs. Anitha Raman' : 'e.g. Rahul V. Verma'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Create username"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Role specific fields */}
              {role === 'teacher' && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Subject Expertise (Primary Specialty)</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Registered Profile Expertise</span>
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      {SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Home Class (Class Teacher Role)</span>
                      <span className="text-[10px] text-amber-400 font-normal">Student Approvals</span>
                    </label>
                    <select
                      value={assignedClass}
                      onChange={(e) => setAssignedClass(e.target.value as StandardClass)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      {STANDARD_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      💡 <strong className="text-slate-200">Class Teacher Responsibility:</strong> You will review & approve pending student registrations for your assigned <span className="text-emerald-400 font-bold">{assignedClass}</span> home class. You can create & allot quizzes in <span className="text-emerald-400 font-bold">any subject</span> to any target Class (6th–10th Standard).
                    </p>
                  </div>
                </div>
              )}

              {role === 'student' && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Student Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      value={studentRollNo}
                      onChange={(e) => setStudentRollNo(e.target.value)}
                      placeholder="e.g. 1001, 6002"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Enrolled Class ONLY (6th to 10th Standard)
                    </label>
                    <select
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value as StandardClass)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    >
                      {STANDARD_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Note: SRV English School is organized strictly by Class Standard without section splits.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" /> Submit Account Registration
              </button>
            </form>
          )}

          {/* TAB 3: FIRST-TIME PRINCIPAL SETUP */}
          {activeTab === 'principal-setup' && (
            <div>
              {!isSecretVerified ? (
                <form onSubmit={handleVerifySecretKey} className="space-y-5">
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                      <Key className="w-4 h-4" /> Principal Authorization
                    </div>
                    <div>
                      To perform First-Time Principal Setup or reset credentials, enter the SRV Secret Setup Key.
                    </div>
                    <div className="font-mono text-[11px] text-amber-400 mt-1">
                      Default Setup Key: <span className="underline font-bold">SRV2026</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Secret Setup Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={secretKeyInput}
                        onChange={(e) => setSecretKeyInput(e.target.value)}
                        placeholder="Enter secret key (e.g. SRV2026)"
                        className="w-full bg-slate-950 border border-amber-800/80 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                      />
                      <Lock className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Key className="w-4 h-4" /> Verify Secret Setup Key
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompletePrincipalSetup} className="space-y-5 animate-fadeIn">
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>Secret Key Verified! Configure your Principal credentials below.</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Principal Full Name & Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={principalFullName}
                      onChange={(e) => setPrincipalFullName(e.target.value)}
                      placeholder="e.g. Dr. K. R. Sharma (Principal)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Principal Username
                      </label>
                      <input
                        type="text"
                        required
                        value={principalUsername}
                        onChange={(e) => setPrincipalUsername(e.target.value)}
                        placeholder="e.g. principal"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Principal Password
                      </label>
                      <input
                        type="password"
                        required
                        value={principalPassword}
                        onChange={(e) => setPrincipalPassword(e.target.value)}
                        placeholder="Set password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Shield className="w-4 h-4" /> Save Credentials & Access Principal Dashboard
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Quick Demo Login Shortcut Toolbar */}
        <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Info className="w-4 h-4 text-emerald-400" /> Instant Demo Roles (One-Click Testing)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('principal')}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-700/60 text-amber-300 text-xs font-medium transition text-left flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Principal</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('teacher-approved')}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700/60 text-emerald-300 text-xs font-medium transition text-left flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Approved Teacher</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('teacher-pending')}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/60 text-rose-300 text-xs font-medium transition text-left flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>Pending Teacher</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('student-approved')}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700/60 text-emerald-300 text-xs font-medium transition text-left flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Approved Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('student-pending')}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-700/60 text-amber-300 text-xs font-medium transition text-left flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
