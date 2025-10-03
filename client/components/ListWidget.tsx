
import React, { useState } from 'react';
import { Task, Note } from '../types';
import TaskWidget from './TaskWidget';
import NoteWidget from "./NoteWidget"
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

export type ListItem = { type: 'task'; data: Task } | { type: 'note'; data: Note } | { type: 'list'; data: ListWidgetProps };

interface ListWidgetProps {
  title: string;
  items: ListItem[];
  foldable?: boolean;
  defaultFolded?: boolean;
}

const ListWidget: React.FC<ListWidgetProps> = ({ title, items, foldable = true, defaultFolded = true }) => {
  const [isFolded, setIsFolded] = useState(foldable && defaultFolded);

  const toggleFold = () => {
    if (foldable) {
      setIsFolded(!isFolded);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`flex justify-between items-center p-2 rounded-md ${foldable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''}`}
        onClick={toggleFold}
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        {foldable && (
          isFolded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />
        )}
      </div>
      {!isFolded && (
        <div className="pl-2">
          {items.length > 0 ? (
            items.map((item, index) => {
              if (item.type === 'task') {
                return <TaskWidget key={item.data.id} task={item.data} />;
              } else if (item.type === 'note') {
                return <NoteWidget key={item.data.id} note={item.data} />;
              } else if (item.type === 'list') {
                return <ListWidget key={`${item.data.title}-${index}`} {...item.data} />;
              }
              return null;
            })
          ) : (
            <p className="text-slate-500 dark:text-slate-400 p-4 text-center">No items in this list.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ListWidget;