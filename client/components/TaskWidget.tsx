
import React, { useContext, useState } from 'react';
import { Task, Page } from '../types';
import { CheckCircleIcon, CircleIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { AppContext, formatDateTimeForDisplay, getCurrentDateTime, formatDateForContent } from '../context/AppContext';

interface TaskWidgetProps {
  task: Task;
  showDone?: boolean;
  showDelete?: boolean;
}

const getTaskStatus = (task: Task): 'done' | 'outdated' | 'running' | 'coming' => {
    if (task.is_done) return 'done';

    const now = new Date();
    // Set hours to 0 to compare dates only, avoiding time-of-day issues.
    now.setHours(0, 0, 0, 0); 
    const todayTimestamp = now.getTime();

    const dueTime = task.due_time ? new Date(task.due_time.time_stamp).getTime() : null;
    const beginDateTime = task.begin_time || task.create_time;
    const beginTime = new Date(beginDateTime.time_stamp).getTime();

    if (dueTime && dueTime < todayTimestamp) return 'outdated';
    if (beginTime > todayTimestamp) return 'coming';
    
    return 'running';
};

const TaskWidget: React.FC<TaskWidgetProps> = ({ task, showDone = true, showDelete = true }) => {
  const { updateTask, deleteTask, navigateTo } = useContext(AppContext);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.is_done) {
        const updatedTask = { ...task };
        updatedTask.is_done = true;
        const originalDueTime = task.due_time;
        updatedTask.due_time = getCurrentDateTime();
        if (originalDueTime) {
            const dateString = formatDateForContent(originalDueTime);
            updatedTask.content = `${task.content}\n\n(Original Due Date: ${dateString})`.trim();
        }
        updateTask(updatedTask);
    } else {
        // NOTE: We don't revert the due date or content changes when un-checking.
        updateTask({ ...task, is_done: false });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
  };
  
  const handleWidgetClick = () => {
    navigateTo(Page.TaskEdit, task.id);
  };
  
  const status = getTaskStatus(task);
  const statusClasses = {
    done: 'border-green-500',
    outdated: 'border-red-500',
    running: 'border-blue-500',
    coming: 'border-transparent',
  };

  const hasSubtasks = task.children && task.children.length > 0;
  const completedSubtasks = task.children?.filter(st => st.is_done).length || 0;

  const handleToggleSubtaskDone = (e: React.MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    const updatedChildren = task.children.map(subtask =>
        subtask.id === subtaskId ? { ...subtask, is_done: !subtask.is_done, update_time: getCurrentDateTime() } : subtask
    );
    updateTask({ ...task, children: updatedChildren });
  };

  return (
    <div className="my-2 rounded-lg shadow-sm bg-white dark:bg-slate-800">
        <div 
          onClick={handleWidgetClick}
          className={`flex items-center p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${statusClasses[status]} ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
        >
            {showDone && (
                <button onClick={handleToggleDone} className="mr-3 flex-shrink-0">
                {task.is_done ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                ) : (
                    <CircleIcon className="w-6 h-6 text-slate-400" />
                )}
                </button>
            )}
            <div className="flex-grow">
                <p className={`font-medium ${task.is_done ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                {task.title}
                </p>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  {hasSubtasks && (
                    <span className="mr-2">{completedSubtasks}/{task.children.length} subtasks</span>
                  )}
                  { (task.begin_time || task.due_time) && (
                    <p className={`${status === 'outdated' ? 'text-red-500' : ''}`}>
                      {task.begin_time && formatDateTimeForDisplay(task.begin_time)}
                      {(task.begin_time && task.due_time) && ' - '}
                      {task.due_time && formatDateTimeForDisplay(task.due_time)}
                    </p>
                  )}
                </div>
            </div>
            {hasSubtasks && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="ml-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                    aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                >
                    {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
            )}
            {showDelete && (
                <button onClick={handleDelete} className="ml-3 text-slate-400 hover:text-red-500 flex-shrink-0">
                <TrashIcon className="w-5 h-5" />
                </button>
            )}
        </div>
        {isExpanded && hasSubtasks && (
            <div className="pl-12 pr-4 pb-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                {task.children.map(subtask => (
                    <div key={subtask.id} className="flex items-center py-1">
                        <button onClick={(e) => handleToggleSubtaskDone(e, subtask.id)} className="mr-3 flex-shrink-0">
                            {subtask.is_done ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : (
                                <CircleIcon className="w-5 h-5 text-slate-400" />
                            )}
                        </button>
                        <p className={`flex-grow text-sm ${subtask.is_done ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {subtask.title}
                        </p>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default TaskWidget;