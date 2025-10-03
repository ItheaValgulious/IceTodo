import React, { useState, useMemo, useContext } from 'react';
import ListWidget, { ListItem } from '../components/ListWidget';
import { AppContext } from '../context/AppContext';
import { Page, Task } from '../types';
import { PlusIcon } from '../components/Icons';

const TasksPage: React.FC = () => {
  const { tasks, tags, navigateTo, addTask } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priorityRange, setPriorityRange] = useState({ min: 0, max: 9 });
  const [doneFilter, setDoneFilter] = useState<'all' | 'done' | 'undone'>('all');
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => task.tags.includes(tag));
        const matchesPriority = task.priority >= priorityRange.min && task.priority <= priorityRange.max;
        const matchesDone = doneFilter === 'all' || (doneFilter === 'done' && task.is_done) || (doneFilter === 'undone' && !task.is_done);
        return matchesSearch && matchesTags && matchesPriority && matchesDone;
    }).map(task => ({ type: 'task', data: task } as ListItem));
  }, [tasks, searchTerm, selectedTags, priorityRange, doneFilter]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddTask = () => {
    const newTaskId = addTask({ title: '' });
    navigateTo(Page.TaskEdit, newTaskId);
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Tasks</h1>
      </header>
      
      <div className="mb-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
        />
        
        <div className="space-y-2">
            <label className="block text-sm font-medium">Filter by Status</label>
            <div className="flex space-x-2">
                <button onClick={() => setDoneFilter('all')} className={`px-3 py-1 rounded-full text-sm ${doneFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>All</button>
                <button onClick={() => setDoneFilter('undone')} className={`px-3 py-1 rounded-full text-sm ${doneFilter === 'undone' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Undone</button>
                <button onClick={() => setDoneFilter('done')} className={`px-3 py-1 rounded-full text-sm ${doneFilter === 'done' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Done</button>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium mb-2">Filter by Tags</label>
            <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
                // FIX: Removed duplicate `key` attribute.
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-sm ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {tag}
                </button>
            ))}
            </div>
        </div>
      </div>

      <ListWidget
        title="All Tasks"
        items={filteredTasks}
        foldable={false}
      />

      <button 
          onClick={handleAddTask}
          className="fixed bottom-24 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Add new task"
        >
          <PlusIcon className="w-6 h-6" />
       </button>
    </div>
  );
};

export default TasksPage;