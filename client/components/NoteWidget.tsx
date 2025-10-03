import React, { useContext } from 'react';
import { Note } from '../types';
import { TrashIcon } from './Icons';
import { AppContext } from '../context/AppContext';

interface NoteWidgetProps {
  note: Note;
  showDelete?: boolean;
}

const NoteWidget: React.FC<NoteWidgetProps> = ({ note, showDelete = true }) => {
  const { deleteNote, navigateTo, Page } = useContext(AppContext);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(note.id);
  };

  const handleWidgetClick = () => {
    navigateTo(Page.NoteEdit, note.id);
  };

  return (
    <div className="my-2 rounded-lg shadow-sm bg-white dark:bg-slate-800">
      <div 
        onClick={handleWidgetClick}
        className="flex items-center p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-yellow-500 rounded-lg"
      >
        <div className="flex-grow">
          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {note.content}
          </p>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
            {note.tags.length > 0 && (
              <span className="mr-2">
                {note.tags.map(tag => `#${tag}`).join(' ')}
              </span>
            )}
          </div>
        </div>
        {showDelete && (
          <button onClick={handleDelete} className="ml-3 text-slate-400 hover:text-red-500 flex-shrink-0">
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteWidget;