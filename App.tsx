import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getCurrentUser, saveCurrentUser, resetSchoolData } from './storage';
import { Navbar } from './Navbar';
import { AuthView } from './AuthView';
import { PrincipalDashboard } from './PrincipalDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  };

  const handleResetData = () => {
    resetSchoolData();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0d1527] text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar Header */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onResetData={handleResetData}
      />

      {/* Main View Router */}
      <main>
        {!currentUser ? (
          <AuthView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {currentUser.role === 'principal' && (
              <PrincipalDashboard currentUser={currentUser} onRefreshData={() => {}} />
            )}
            {currentUser.role === 'teacher' && (
              <TeacherDashboard currentUser={currentUser} onRefreshData={() => {}} />
            )}
            {currentUser.role === 'student' && (
              <StudentDashboard currentUser={currentUser} onRefreshData={() => {}} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
