
import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext, getCurrentDateTime, formatDateForContent, addDaysToDateTime } from '../context/AppContext';
import { Page, Task, DateTime } from '../types';
import { TrashIcon } from '../components/Icons';

const TaskEditPage: React.FC<{ taskId: number | null }> = ({ taskId }) => {
    const { getTaskById, updateTask, deleteTask, tags, addTag, navigateBack } = useContext(AppContext);

    const [task, setTask] = useState<Task | null>(null);
    const [newTag, setNewTag] = useState('');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const isInitialLoad = useRef(true);

    useEffect(() => {
        if (taskId) {
            const existingTask = getTaskById(taskId);
            if (existingTask) {
                setTask(existingTask);
            }
        }
    }, [taskId, getTaskById]);

    // Autosave with debounce
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }
        if (task && task.id) {
            const handler = setTimeout(() => {
                updateTask(task);
            }, 500); // 500ms debounce
            return () => clearTimeout(handler);
        }
    }, [task, updateTask]);
    
    if (!task) {
        return <div className="p-4">Loading task...</div>; // Or a spinner
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTask(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleDoneToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isDone = e.target.checked;
        if (!task) return;

        if (isDone) {
            const originalDueTime = task.due_time;
            let newContent = task.content || '';
            if (originalDueTime) {
                const dateString = formatDateForContent(originalDueTime);
                const appendix = `\n\n(Original Due Date: ${dateString})`;
                if (!newContent.includes(appendix)) {
                   newContent = `${newContent}${appendix}`.trim();
                }
            }
            setTask(prev => prev ? ({
                ...prev,
                is_done: true,
                due_time: getCurrentDateTime(),
                content: newContent
            }) : null);
        } else {
             setTask(prev => prev ? ({...prev, is_done: false}) : null);
        }
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'begin_time' | 'due_time') => {
        if (e.target.value) {
            const [year, month, day] = e.target.value.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dt: DateTime = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                time_stamp: date.getTime()
            };
            setTask(prev => prev ? ({ ...prev, [field]: dt }) : null);
        } else {
            setTask(prev => prev ? ({ ...prev, [field]: null}) : null);
        }
    }

    const handleTagToggle = (tag: string) => {
        const currentTags = task.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        setTask(prev => prev ? ({ ...prev, tags: newTags }) : null);
    };
    
    const handleAddTag = () => {
        if(newTag.trim() !== '' && !tags.includes(newTag.trim())) {
            addTag(newTag.trim());
            handleTagToggle(newTag.trim());
            setNewTag('');
        }
    }

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim() === '') return;
        
        setTask(prev => prev ? ({
            ...prev,
            children: [...(prev.children || []), newSubtaskTitle.trim()],
        }) : null);
        setNewSubtaskTitle('');
    };
    
    const handleDeleteSubtask = (index: number) => {
        setTask(prev => prev ? ({
            ...prev,
            children: (prev.children || []).filter((_, i) => i !== index),
        }) : null);
    };

    const handleDelete = () => {
        if (task.id) {
            deleteTask(task.id);
            navigateBack();
        }
    }

    const handleNavigateBack = () => {
        // Save immediately before navigating back
        if (task && task.id) {
            updateTask(task);
        }
        navigateBack();
    }

    const dateToInputValue = (dt: DateTime | null | undefined) => {
        if (!dt) return '';
        const month = String(dt.month).padStart(2, '0');
        const day = String(dt.day).padStart(2, '0');
        return `${dt.year}-${month}-${day}`;
    }
    
    return (
        <div className="p-4">
             <header className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Edit Task</h1>
                <div>
                    <button onClick={handleNavigateBack} className="px-4 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 mr-2">Done</button>
                    {taskId && <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="w-6 h-6"/></button>}
                </div>
            </header>
            <div className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                    <input type="text" name="title" id="title" value={task.title} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                </div>

                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>
                    <textarea name="content" id="content" value={task.content} onChange={handleChange} rows={4} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"></textarea>
                </div>
                
                <div className="flex items-center justify-between">
                    <label htmlFor="is_done" className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as Done</label>
                    <input type="checkbox" name="is_done" id="is_done" checked={!!task.is_done} onChange={handleDoneToggle} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="begin_time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Begin Date</label>
                        <input type="date" name="begin_time" id="begin_time" value={dateToInputValue(task.begin_time)} onChange={(e) => handleDateChange(e, 'begin_time')} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label htmlFor="due_time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                        <input type="date" name="due_time" id="due_time" value={dateToInputValue(task.due_time)} onChange={(e) => handleDateChange(e, 'due_time')} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority: {task.priority}</label>
                    <input type="range" name="priority" id="priority" min="0" max="9" value={task.priority} onChange={e => setTask(prev => prev ? ({...prev, priority: parseInt(e.target.value)}) : null)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map(tag => (
                            <button type="button" key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1 rounded-full text-sm ${(task.tags || []).includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                {tag}
                            </button>
                        ))}
                    </div>
                    <div className="flex mt-2">
                        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag..." className="flex-grow p-2 border rounded-l-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"/>
                        <button type="button" onClick={handleAddTag} className="bg-slate-200 dark:bg-slate-600 px-4 rounded-r-md">Add</button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subtasks</label>
                    <div className="mt-2 space-y-2">
                        {(task.children || []).map((subtask, index) => (
                            <div key={index} className="flex items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                                <span className="flex-grow text-slate-800 dark:text-slate-200">{subtask}</span>
                                <button type="button" onClick={() => handleDeleteSubtask(index)} className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0" aria-label={`Delete subtask ${subtask}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex mt-2">
                        <input 
                            type="text" 
                            value={newSubtaskTitle} 
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                            placeholder="New subtask..."
                            className="flex-grow p-2 border rounded-l-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        />
                        <button type="button" onClick={handleAddSubtask} className="bg-slate-200 dark:bg-slate-600 px-4 rounded-r-md hover:bg-slate-300 dark:hover:bg-slate-500">Add</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskEditPage;