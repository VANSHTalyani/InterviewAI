import React from 'react';
import Navigation from './Navigation';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-black dark:to-slate-900">
    <div className="flex">
      <Navigation />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  </div>
);

export default AppLayout;
