
import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Task, DateTime } from '../types';

// --- Date Helper Functions ---
const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const isSameDay = (d1: Date, d2: Date): boolean => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const getDaysDiff = (d1: Date, d2: Date): number => {
    const d1Copy = new Date(d1.getTime());
    d1Copy.setHours(0,0,0,0);
    const d2Copy = new Date(d2.getTime());
    d2Copy.setHours(0,0,0,0);
    const timeDiff = d2Copy.getTime() - d1Copy.getTime();
    return Math.round(timeDiff / (1000 * 3600 * 24));
}


interface GanttTask extends Task {
    startDate: Date;
    endDate: Date;
}

const useTaskLayout = (tasks: Task[], intervalStart: Date, intervalEnd: Date) => {
    return useMemo(() => {
        const relevantTasks: GanttTask[] = tasks
            .map(task => {
                const beginDateTime = task.begin_time || task.create_time;
                return {
                    ...task,
                    startDate: new Date(beginDateTime.time_stamp),
                    endDate: task.due_time ? new Date(task.due_time.time_stamp) : new Date(beginDateTime.time_stamp),
                }
            })
            .filter(task => task.startDate <= intervalEnd && task.endDate >= intervalStart)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        const tracks: { task: GanttTask; track: number }[] = [];
        const trackEnds: Date[] = [];

        relevantTasks.forEach(task => {
            let placed = false;
            for (let i = 0; i < trackEnds.length; i++) {
                if (trackEnds[i] < task.startDate) {
                    tracks.push({ task, track: i });
                    trackEnds[i] = task.endDate;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                tracks.push({ task, track: trackEnds.length });
                trackEnds.push(task.endDate);
            }
        });

        return { positionedTasks: tracks, totalTracks: trackEnds.length };
    }, [tasks, intervalStart, intervalEnd]);
};


const TaskBar: React.FC<{ task: Task, gridStart: number, duration: number, track: number }> = ({ task, gridStart, duration, track }) => {
    const statusColors = {
        done: 'bg-green-500 hover:bg-green-600',
        outdated: 'bg-red-500 hover:bg-red-600',
        running: 'bg-blue-500 hover:bg-blue-600',
        coming: 'bg-slate-400 hover:bg-slate-500',
    };
    const getStatus = (t:Task) => {
        if(t.is_done) return 'done';
        const now = new Date(); 
        now.setHours(0,0,0,0);
        const todayTimestamp = now.getTime();
        
        if(t.due_time && t.due_time.time_stamp < todayTimestamp) return 'outdated';
        
        const beginDateTime = t.begin_time || t.create_time;
        const beginDate = new Date(beginDateTime.time_stamp);
        beginDate.setHours(0,0,0,0);
        
        if(beginDate.getTime() > todayTimestamp) return 'coming';

        return 'running';
    }

    return (
        <div
            className={`absolute h-6 px-2 text-white text-sm font-medium rounded-md truncate transition-colors ${statusColors[getStatus(task)]}`}
            style={{
                top: `${track * 1.75}rem`,
                left: `calc(${(100 / 7) * (gridStart - 1)}% + 2px)`,
                width: `calc(${(100 / 7) * duration}% - 4px)`,
            }}
            title={task.title}
        >
            {task.title}
        </div>
    );
};

const WeekView: React.FC<{ displayDate: Date, tasks: Task[] }> = ({ displayDate, tasks }) => {
    const weekStart = startOfWeek(displayDate);
    const weekEnd = addDays(weekStart, 6);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const { positionedTasks, totalTracks } = useTaskLayout(tasks, weekStart, weekEnd);

    return (
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-600">
            <div className="grid grid-cols-7 text-center font-semibold text-slate-700 dark:text-slate-300">
                {days.map(day => (
                    <div key={day.toISOString()} className={`py-2 border-b border-slate-300 dark:border-slate-600 ${isSameDay(day, new Date()) ? 'text-blue-600' : ''}`}>
                        <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-2xl">{day.getDate()}</div>
                    </div>
                ))}
            </div>
            <div className="relative" style={{ height: `${Math.max(4, totalTracks) * 1.75}rem` }}>
                 <div className="absolute inset-0 grid grid-cols-7">
                    {days.map((day, i) => (
                        <div key={i} className={`h-full ${i < 6 ? 'border-r border-slate-300 dark:border-slate-600' : ''}`}></div>
                    ))}
                </div>
                {positionedTasks.map(({ task, track }) => {
                    const taskStart = new Date((task.begin_time || task.create_time).time_stamp);
                    const taskEnd = task.due_time ? new Date(task.due_time.time_stamp) : taskStart;
                    
                    const start = taskStart < weekStart ? weekStart : taskStart;
                    const end = taskEnd > weekEnd ? weekEnd : taskEnd;

                    const gridStart = getDaysDiff(weekStart, start) + 1;
                    const duration = getDaysDiff(start, end) + 1;

                    return <TaskBar key={task.id} task={task} gridStart={gridStart} duration={duration} track={track} />;
                })}
            </div>
        </div>
    );
};

const MonthView: React.FC<{ displayDate: Date, tasks: Task[] }> = ({ displayDate, tasks }) => {
    const monthStart = startOfMonth(displayDate);
    const monthEnd = endOfMonth(displayDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = addDays(startOfWeek(monthEnd), 6);

    const weeks: Date[] = [];
    let currentWeek = calendarStart;
    while (currentWeek <= calendarEnd) {
        weeks.push(currentWeek);
        currentWeek = addDays(currentWeek, 7);
    }
    const dayHeaders = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));

    return (
         <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-300 dark:border-slate-600">
             <div className="grid grid-cols-7 text-center font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                {dayHeaders.map(day => <div key={day.toISOString()} className="py-1">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>)}
            </div>
            <div className="overflow-hidden">
            {weeks.map(weekStart => {
                const weekEnd = addDays(weekStart, 6);
                const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
                const { positionedTasks } = useTaskLayout(tasks, weekStart, weekEnd);

                return (
                    <div key={weekStart.toISOString()} className="grid grid-cols-7 relative border-b border-slate-300 dark:border-slate-600 last:border-b-0">
                        {/* Day cells for grid lines and numbers */}
                        {days.map((day, index) => (
                            <div key={day.toISOString()} className={`h-28 text-right p-1 border-r border-slate-300 dark:border-slate-600 last:border-r-0
                                ${day.getMonth() !== displayDate.getMonth() ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400' : 'bg-white dark:bg-slate-800'}
                                ${isSameDay(day, new Date()) ? '!bg-blue-50 dark:!bg-blue-900/20' : ''}
                            `}>
                                <span className={`text-sm ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white rounded-full px-1.5' : ''}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                        ))}
                        
                        {/* Task container on top */}
                        <div className="absolute top-7 left-0 right-0 bottom-0 p-1">
                            {positionedTasks.map(({ task, track }) => {
                                const taskStart = new Date((task.begin_time || task.create_time).time_stamp);
                                const taskEnd = task.due_time ? new Date(task.due_time.time_stamp) : taskStart;
                                
                                const start = taskStart < weekStart ? weekStart : taskStart;
                                const end = taskEnd > weekEnd ? weekEnd : taskEnd;

                                const gridStart = getDaysDiff(weekStart, start) + 1;
                                const duration = Math.max(1, getDaysDiff(start, end) + 1);

                                return <TaskBar key={task.id} task={task} gridStart={gridStart} duration={duration} track={track} />;
                            })}
                        </div>
                    </div>
                );
            })}
            </div>
         </div>
    );
};

const CalendarPage: React.FC = () => {
  const { tasks } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [displayDate, setDisplayDate] = useState(new Date());

  const handlePrev = () => {
    setDisplayDate(d => viewMode === 'month' ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : addDays(d, -7));
  };
  const handleNext = () => {
    setDisplayDate(d => viewMode === 'month' ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDays(d, 7));
  };
  const handleToday = () => {
    setDisplayDate(new Date());
  };

  const headerText = useMemo(() => {
    if (viewMode === 'month') {
        return `${displayDate.getFullYear()}.${String(displayDate.getMonth() + 1).padStart(2, '0')}`;
    } else {
        const start = startOfWeek(displayDate);
        const end = addDays(start, 6);
        const formatShort = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
        
        if (start.getFullYear() !== end.getFullYear()) {
          const formatLong = (d: Date) => `${d.getFullYear()}.${formatShort(d)}`;
          return `${formatLong(start)} - ${formatLong(end)}`;
        }
        
        return `${start.getFullYear()}.${formatShort(start)} - ${formatShort(end)}`;
    }
  }, [displayDate, viewMode]);

  return (
    <div className="p-4 h-full flex flex-col">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Calendar</h1>
      </header>
      
      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm mb-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                 <button onClick={handlePrev} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">&lt;</button>
                 <button onClick={handleNext} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">&gt;</button>
                 <button onClick={handleToday} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">Today</button>
            </div>
            <h2 className="text-lg font-semibold">{headerText}</h2>
            <div className="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-md">
                <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm rounded ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Month</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm rounded ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Week</button>
            </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto">
        {viewMode === 'month' ? 
            <MonthView displayDate={displayDate} tasks={tasks} /> : 
            <WeekView displayDate={displayDate} tasks={tasks} />
        }
      </div>
    </div>
  );
};

export default CalendarPage;
