
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Page } from '../types';
import { PlusIcon } from '../components/Icons';

const NoteWidget: React.FC<{ note: any }> = ({ note }) => {
    const { navigateTo } = useContext(AppContext);

    return (
        <div 
            onClick={() => navigateTo(Page.NoteEdit, note.id)}
            className="p-4 my-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
            <p className="truncate text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
            <div className="flex flex-wrap gap-2 mt-2">
                {note.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

const NotesPage: React.FC = () => {
  const { notes, navigateTo, addNote } = useContext(AppContext);

  const handleAddNote = () => {
    const newNoteId = addNote({ content: '' });
    navigateTo(Page.NoteEdit, newNoteId);
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Notes</h1>
      </header>
      <div>
        {notes.length > 0 ? (
            notes.map(note => <NoteWidget key={note.id} note={note} />)
        ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center p-4">No notes yet. Add one!</p>
        )}
      </div>

       <button 
          onClick={handleAddNote}
          className="fixed bottom-24 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Add new note"
        >
          <PlusIcon className="w-6 h-6" />
       </button>
    </div>
  );
};

export default NotesPage;