import React from 'react';
import { Page } from '../types';
import { SunIcon, ClipboardListIcon, TagIcon, CalendarIcon, DocumentTextIcon, Cog6ToothIcon } from './Icons';

interface NavBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  visibleItems: Page[];
}

const NavButton: React.FC<{
  page: Page;
  label: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}> = ({ page, label, currentPage, onNavigate, children }) => {
  const isActive = currentPage === page;
  const activeClass = 'text-blue-600 dark:text-blue-400';
  const inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400';

  return (
    <button
      onClick={() => onNavigate(page)}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
};

// FIX: Changed `JSX.Element` to `React.ReactNode` to resolve the TypeScript error "Cannot find namespace 'JSX'".
const navItemMap: { [key in Page]?: { label: string; icon: React.ReactNode } } = {
    [Page.MyDay]: { label: 'My Day', icon: <SunIcon className="w-6 h-6 mb-1"/> },
    [Page.Tasks]: { label: 'Tasks', icon: <ClipboardListIcon className="w-6 h-6 mb-1"/> },
    [Page.Tags]: { label: 'Tags', icon: <TagIcon className="w-6 h-6 mb-1"/> },
    [Page.Calendar]: { label: 'Calendar', icon: <CalendarIcon className="w-6 h-6 mb-1"/> },
    [Page.Notes]: { label: 'Notes', icon: <DocumentTextIcon className="w-6 h-6 mb-1"/> },
    [Page.Config]: { label: 'Config', icon: <Cog6ToothIcon className="w-6 h-6 mb-1"/> },
};


const NavBar: React.FC<NavBarProps> = ({ currentPage, onNavigate, visibleItems }) => {

  const navItems = visibleItems.map(page => navItemMap[page]).filter(Boolean);

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-t-lg">
      <div className="flex justify-around">
        {visibleItems.map(page => {
            const item = navItemMap[page];
            if (!item) return null;
            return (
                <NavButton key={page} page={page} label={item.label} currentPage={currentPage} onNavigate={onNavigate}>
                    {item.icon}
                </NavButton>
            );
        })}
      </div>
    </nav>
  );
};

export default NavBar;