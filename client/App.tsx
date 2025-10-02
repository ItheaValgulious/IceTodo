
import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { Page, NavConfig } from './types';
import NavBar from './components/NavBar';
import MyDayPage from './pages/MyDayPage';
import TasksPage from './pages/TasksPage';
import TagsPage from './pages/TagsPage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import ConfigPage from './pages/ConfigPage';
import TaskEditPage from './pages/TaskEditPage';
import NoteEditPage from './pages/NoteEditPage';
import LoginModal from './components/LoginModal';
import { AppContext } from './context/AppContext';

const App: React.FC = () => {
  const { activePage, activeId, navigateTo, configs, isLoginModalOpen, setLoginModalOpen } = useContext(AppContext);

  useEffect(() => {
    const darkModeConfig = configs.find(c => c.title === 'Appearance')?.items.find(i => i.name === 'Dark Mode');
    if (darkModeConfig?.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [configs]);

  const navConfig = useMemo(() => {
    const navSection = configs.find(c => c.title === 'Navigation');
    const navItem = navSection?.items.find(i => i.name === 'Navigation');
    if (navItem && navItem.type === 'nav_config') {
        return navItem.value;
    }
    // Default fallback
    return { visible: [Page.MyDay, Page.Tasks, Page.Calendar, Page.Notes, Page.Config], hidden: [Page.Tags] };
  }, [configs]);

  const renderPage = () => {
    switch (activePage) {
      case Page.MyDay:
        return <MyDayPage />;
      case Page.Tasks:
        return <TasksPage />;
      case Page.Tags:
        return <TagsPage />;
      case Page.Calendar:
        return <CalendarPage />;
      case Page.Notes:
        return <NotesPage />;
      case Page.Config:
        return <ConfigPage />;
      case Page.TaskEdit:
        return <TaskEditPage taskId={activeId} />;
      case Page.NoteEdit:
        return <NoteEditPage noteId={activeId} />;
      default:
        return <MyDayPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white dark:bg-slate-800 shadow-lg">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </main>
      <NavBar visibleItems={navConfig.visible} currentPage={activePage} onNavigate={(page) => navigateTo(page, null)} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
};

export default App;