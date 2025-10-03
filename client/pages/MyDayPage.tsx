
import React, { useContext, useMemo } from 'react';
import ListWidget, { ListItem } from '../components/ListWidget';
import { AppContext, isToday } from '../context/AppContext';
import { PlusIcon } from '../components/Icons';
import { Page, Task, DateTime } from '../types';

const MyDayPage: React.FC = () => {
  const { tasks, navigateTo, addTask } = useContext(AppContext);

  const todayTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTimestamp = now.getTime();

    const isTaskForMyDay = (task: Task): boolean => {
      const dueDateTime = task.due_time ? new Date(task.due_time.time_stamp) : null;
      if (dueDateTime) dueDateTime.setHours(0,0,0,0);

      // 1. Outdated and not done
      if (!task.is_done && dueDateTime && dueDateTime.getTime() < todayTimestamp) {
          return true;
      }
      
      const beginDateTime = task.begin_time || task.create_time;
      const beginDate = new Date(beginDateTime.time_stamp);
      beginDate.setHours(0, 0, 0, 0);

      const dueTime = dueDateTime ? dueDateTime.getTime() : null;

      // 2. Active today
      if (task.begin_time === null && task.due_time === null) return true; // Treat tasks without dates as always relevant
      if (dueTime !== null) {
          // Spans today or is due today without a start date
          return beginDate.getTime() <= todayTimestamp && todayTimestamp <= dueTime;
      }
      // Starts before/on today, no due date
      if (dueTime === null) return beginDate.getTime() <= todayTimestamp;

      return false;
    };

    return tasks
      .filter(isTaskForMyDay)
      .map(task => ({ type: 'task', data: task } as ListItem));
  }, [tasks]);

  const handleAddTask = () => {
    const newTaskId = addTask({ title: '' });
    navigateTo(Page.TaskEdit, newTaskId);
  };

  const today = new Date().toLocaleDateString('en-us', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">My Day</h1>
        <p className="text-slate-500 dark:text-slate-400">{today}</p>
      </header>
      <ListWidget
        title="Today's Tasks"
        items={todayTasks}
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

export default MyDayPage;
