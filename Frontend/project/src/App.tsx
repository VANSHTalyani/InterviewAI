import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { Dashboard } from './pages/Dashboard';
import { Analyze } from './pages/Analyze';
import { History } from './pages/History';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { UserProfile } from './components/UserProfile';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public pages - no sidebar */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* App pages - with sidebar */}
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/analyze" element={<AppLayout><Analyze /></AppLayout>} />
          <Route path="/history" element={<AppLayout><History /></AppLayout>} />
          <Route path="/progress" element={<AppLayout><Progress /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><UserProfile /></AppLayout>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;