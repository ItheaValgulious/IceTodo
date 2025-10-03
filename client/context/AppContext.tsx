import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Task, Note, ConfigSection, Page, DateTime, SyncPayload, DayUpdate, NotificationTime } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialTasks, initialNotes, initialConfigs } from './initialData';
import { notifier } from './notification';
import { add_notification, del_notification, formatTaskNotificationBody, isOverdue, isFuture } from '../utils/notifications';

let server_host="http://localhost:9000"

export const getCurrentDateTime = (): DateTime => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        time_stamp: now.getTime(),
    };
};

export const addDaysToDateTime = (dt: DateTime, days: number): DateTime => {
    const date = new Date(dt.time_stamp);
    date.setDate(date.getDate() + days);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        time_stamp: date.getTime(),
    };
};

export const formatDateForContent = (dt: DateTime): string => {
    const month = String(dt.month).padStart(2, '0');
    const day = String(dt.day).padStart(2, '0');
    return `${dt.year}-${month}-${day}`;
};

export const getTaskStatus = (task: Task): 'done' | 'outdated' | 'running' | 'coming' => {
    if (task.is_done) return 'done';

    const now = new Date();
    // Set hours to 0 to compare dates only, avoiding time-of-day issues.
    now.setHours(0, 0, 0, 0); 
    const todayTimestamp = now.getTime();

    const dueTimestamp = task.due_time ? new Date(task.due_time.time_stamp).getTime() : null;
    
    const beginDateTime = task.begin_time || task.create_time;
    const beginDate = new Date(beginDateTime.time_stamp);
    beginDate.setHours(0, 0, 0, 0);
    const beginTimestamp = beginDate.getTime();

    if (dueTimestamp && dueTimestamp < todayTimestamp) return 'outdated';
    if (beginTimestamp > todayTimestamp) return 'coming';
    
    return 'running';
};




interface AppContextType {
    tasks: Task[];
    notes: Note[];
    configs: ConfigSection[];
    tags: string[]; // Derived from tasks and notes
    activePage: Page;
    activeId: number | null;
    isLoggedIn: boolean;
    username: string;
    isLoginModalOpen: boolean;
    setLoginModalOpen: (isOpen: boolean) => void;
    login: (user: string, pass: string) => Promise<boolean>;
    logout: () => void;
    syncData: () => Promise<void>;
    addTask: (task: Partial<Omit<Task, 'id' | 'create_time' | 'update_time'>>) => Promise<number>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: number) => Promise<void>;
    getTaskById: (taskId: number) => Task | undefined;
    addNote: (note: Partial<Omit<Note, 'id' | 'create_time' | 'update_time'>>) => number;
    updateNote: (note: Note) => void;
    deleteNote: (noteId: number) => void;
    getNoteById: (noteId: number) => Note | undefined;
    updateConfig: (sectionTitle: string, itemName: string, value: any) => Promise<void>;
    addTag: (tag: string) => void; // Now adds tag to current task/note
    navigateTo: (page: Page, id: number | null) => void;
    navigateBack: () => void;
    localDayUpdates: DayUpdate;
    getTaskStatus: (task: Task) => 'done' | 'outdated' | 'running' | 'coming';
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [configs, setConfigs] = useLocalStorage<ConfigSection[]>('configs', initialConfigs);
    // Unified tags are now derived from tasks and notes, not stored separately
    const [activePage, setActivePage] = useState<Page>(Page.MyDay);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [pageBeforeEdit, setPageBeforeEdit] = useState<Page>(Page.MyDay);
    
    // Auth and Sync State
    const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
    const [username, setUsername] = useLocalStorage('username', '');
    const [token, setToken] = useLocalStorage('token', '');

    const [localDayUpdates, setLocalDayUpdates] = useLocalStorage<DayUpdate>('localDayUpdates', {});
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const syncTimeoutRef = useRef<number | null>(null);

    // --- Data Loading from Granular Storage ---
    useEffect(() => {
        // Load Tasks
        const taskIds: number[] | null = JSON.parse(localStorage.getItem('task_ids') || 'null');
        if (taskIds) {
            const loadedTasks = taskIds.map(id => JSON.parse(localStorage.getItem(`task_${id}`) || 'null')).filter(Boolean);
            setTasks(loadedTasks);
        } else {
            localStorage.setItem('task_ids', JSON.stringify(initialTasks.map(t => t.id)));
            initialTasks.forEach(task => localStorage.setItem(`task_${task.id}`, JSON.stringify(task)));
            setTasks(initialTasks);
        }

        // Load Notes
        const noteIds: number[] | null = JSON.parse(localStorage.getItem('note_ids') || 'null');
        if (noteIds) {
            const loadedNotes = noteIds.map(id => JSON.parse(localStorage.getItem(`note_${id}`) || 'null')).filter(Boolean);
            setNotes(loadedNotes);
        } else {
             localStorage.setItem('note_ids', JSON.stringify(initialNotes.map(n => n.id)));
            initialNotes.forEach(note => localStorage.setItem(`note_${note.id}`, JSON.stringify(note)));
            setNotes(initialNotes);
        }
    }, []);

    // Initialize notifications for existing tasks after data is loaded
    useEffect(() => {
        const initializeNotifications = async () => {
            if (tasks.length > 0) {
                console.log('Initializing notifications for existing tasks');
                for (const task of tasks) {
                    await updateTaskNotification(task);
                }
            }
        };
        
        // Only initialize if we have tasks loaded and configs are ready
        if (tasks.length > 0 && configs.length > 0) {
            initializeNotifications();
        }
    }, [tasks.length, configs.length]); // Run when tasks or configs are loaded

    // --- Navigation ---
    const navigateTo = (page: Page, id: number | null = null) => {
        if (page === Page.TaskEdit || page === Page.NoteEdit) {
            setPageBeforeEdit(activePage);
        }
        setActivePage(page);
        setActiveId(id);
    };

    const navigateBack = () => {
        setActivePage(pageBeforeEdit);
        setActiveId(null);
    };
    
    // --- Sync Logic ---
    const triggerSync = () => {
        if (!isLoggedIn) return;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = window.setTimeout(syncData, 10); // Debounce for 2s
    };


    const syncData = async () => {
        if (!isLoggedIn || !token) return;
        console.log("Starting day-based sync...");

        try {
            // Step 1: Get server days with their update times
            const getDaysRes = await fetch(server_host+'/get_days/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (!getDaysRes.ok) {
                console.error("Failed to get server days");
                return;
            }
            
            const serverDaysData = await getDaysRes.json();
            const serverDayUpdates: DayUpdate = serverDaysData.days || {};
            
            // Step 2: Build comprehensive list of local days from actual tasks and notes
            const localDaysFromData = new Set<string>();
            
            // Add days from tasks
            tasks.forEach(task => {
                const dateStr = formatDateForContent(task.create_time);
                localDaysFromData.add(dateStr);
            });
            
            // Add days from notes
            notes.forEach(note => {
                const dateStr = formatDateForContent(note.create_time);
                localDaysFromData.add(dateStr);
            });
            
            // Step 3: Compare local and server update times to determine what needs to be synced
            const daysToPull: string[] = []; // Days where server has newer data
            const daysToPush: string[] = []; // Days where local has newer data
            
            // Check all server days
            for (const [dateStr, serverUpdateTime] of Object.entries(serverDayUpdates)) {
                const localUpdateTime = localDayUpdates[dateStr] || 0;
                if (serverUpdateTime > localUpdateTime) {
                    daysToPull.push(dateStr);
                }
            }
            
            // Check all local days (both from existing localDayUpdates and from actual data)
            const allLocalDays = new Set([...Object.keys(localDayUpdates), ...localDaysFromData]);
            for (const dateStr of allLocalDays) {
                const localUpdateTime = localDayUpdates[dateStr] || 0;
                const serverUpdateTime = serverDayUpdates[dateStr] || 0;
                if (localUpdateTime > serverUpdateTime) {
                    console.log(localUpdateTime, serverUpdateTime);
                    daysToPush.push(dateStr);
                }
            }
            
            console.log(`Days to pull: ${daysToPull.join(', ')}`);
            console.log(`Days to push: ${daysToPush.join(', ')}`);
            
            // Step 3: Pull data for days where server is newer
            for (const dateStr of daysToPull) {
                const [year, month, day] = dateStr.split('-').map(Number);
                
                const pullRes = await fetch(server_host+'/sync/pull/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, year, month, day })
                });
                
                if (pullRes.ok) {
                    const serverPayload = await pullRes.json();
                    
                    // Merge server data with local data for this day
                    const mergedTasks = [...tasks.filter(t => formatDateForContent(t.create_time) !== dateStr), ...serverPayload.tasks];
                    const mergedNotes = [...notes.filter(n => formatDateForContent(n.create_time) !== dateStr), ...serverPayload.notes];
                    
                    setTasks(mergedTasks);
                    setNotes(mergedNotes);
                    
                    // Update local storage
                    localStorage.setItem('task_ids', JSON.stringify(mergedTasks.map(t => t.id)));
                    mergedTasks.forEach(task => localStorage.setItem(`task_${task.id}`, JSON.stringify(task)));
                    localStorage.setItem('note_ids', JSON.stringify(mergedNotes.map(n => n.id)));
                    mergedNotes.forEach(note => localStorage.setItem(`note_${note.id}`, JSON.stringify(note)));
                    
                    // Update local day timestamp to match server
                    setLocalDayUpdates(prev => ({
                        ...prev,
                        [dateStr]: serverPayload.time
                    }));
                    
                    console.log(`Pulled data for ${dateStr}`);
                }
            }
            
            // Step 4: Push data for days where local is newer
            for (const dateStr of daysToPush) {
                const [year, month, day] = dateStr.split('-').map(Number);
                
                // Get local data for this specific day
                const dayTasks = tasks.filter(t => formatDateForContent(t.create_time) === dateStr);
                const dayNotes = notes.filter(n => formatDateForContent(n.create_time) === dateStr);
                
                const dayPayload: SyncPayload = {
                    tasks: dayTasks,
                    notes: dayNotes,
                    tags: [...new Set<string>([...dayTasks.flatMap(t => t.tags), ...dayNotes.flatMap(n => n.tags)])],
                    time: localDayUpdates[dateStr] || 0
                };
                
                const pushRes = await fetch(server_host+'/sync/push/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, year, month, day, time: dayPayload.time, content: dayPayload })
                });
                
                if (pushRes.ok) {
                    console.log(`Pushed data for ${dateStr}`);
                }
            }
            
            console.log("Day-based sync completed");
            
        } catch (error) {
            console.error("Day-based sync failed:", error);
        }
    };
    
    useEffect(() => {
        const intervalId = setInterval(syncData, 60000); // Sync every minute
        // const intervalId = setInterval(syncData, 10000); // Sync every 10 second for debug
        return () => clearInterval(intervalId);
    }, [isLoggedIn, token, tasks, notes]);


    // --- Auth ---
    const login = async (user: string, pass: string): Promise<boolean> => {
        try {
            const response = await fetch(server_host+'/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass }),
            });
            const data = await response.json();
            
            if (data.status === 'success' && data.token) {
                setToken(data.token);
                setUsername(user);
                setIsLoggedIn(true);

                await syncData(); // Initial sync
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login request failed:", error);
            // Mock success for offline testing
            setToken('mock_token');
            setUsername(user);
            setIsLoggedIn(true);
            return true;
        }
    };

    const logout = async () => {
        try {
            await fetch(server_host+'/logout');
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            setToken('');
            setUsername('');
            setIsLoggedIn(false);
        }
    };

    // --- Data C R U D ---


    const updateDayTimestamp = (dateStr: string) => {
        setLocalDayUpdates(prev => ({
            ...prev,
            [dateStr]: Date.now()
        }));
    };

    const addTask = async (task: Partial<Omit<Task, 'id' | 'create_time' | 'update_time'>>): Promise<number> => {
        const now = getCurrentDateTime();
        const newTask: Task = {
            title: 'New Task',
            is_done: false,
            content: '',
            priority: 5,
            tags: [],
            children: [],
            punishment: { delete: false, highlight: true },
            ...task,
            id: Date.now(),
            create_time: now,
            update_time: now,
            begin_time: task.begin_time || now,
            due_time: task.due_time || addDaysToDateTime(now, 7),
        };
        const newTasks = [...tasks, newTask];
        setTasks(newTasks);
        localStorage.setItem('task_ids', JSON.stringify(newTasks.map(t => t.id)));
        localStorage.setItem(`task_${newTask.id}`, JSON.stringify(newTask));
        updateDayTimestamp(formatDateForContent(now));
        
        // Schedule notification for the new task
        await updateTaskNotification(newTask);
        
        triggerSync();
        return newTask.id;
    };

    const updateTask = async (updatedTask: Task) => {
        const now = getCurrentDateTime();
        const newTasks = tasks.map(task => task.id === updatedTask.id ? { ...updatedTask, update_time: now } : task);
        setTasks(newTasks);
        localStorage.setItem(`task_${updatedTask.id}`, JSON.stringify({ ...updatedTask, update_time: now }));
        updateDayTimestamp(formatDateForContent(now));
        
        // Update notification for the updated task
        await updateTaskNotification(updatedTask);
        
        triggerSync();
    };

    const deleteTask = async (taskId: number) => {
        // Remove notification for the task being deleted
        await del_notification(taskId);
        
        const newTasks = tasks.filter(task => task.id !== taskId);
        setTasks(newTasks);
        localStorage.setItem('task_ids', JSON.stringify(newTasks.map(t => t.id)));
        localStorage.removeItem(`task_${taskId}`);
        updateDayTimestamp(formatDateForContent(getCurrentDateTime()));
        triggerSync();
    };
    
    const getTaskById = (taskId: number): Task | undefined => tasks.find(task => task.id === taskId);

    // --- Notification Management ---
    const updateTaskNotification = async (task: Task): Promise<void> => {
      // Remove any existing notification for this task
      await del_notification(task.id);
      
      // Get task status using the same function as UI
      const taskStatus = getTaskStatus(task);
      
      // Don't schedule notifications for completed tasks
      if (taskStatus === 'done') {
        console.log(`Task ${task.id} is completed, no notification scheduled`);
        return;
      }
      
      // Don't schedule notifications for future tasks
      if (taskStatus === 'coming') {
        console.log(`Task ${task.id} is in the future, no notification scheduled`);
        return;
      }
      
      // Handle overdue tasks - schedule daily notifications
      if (taskStatus === 'outdated') {
        console.log(`Task ${task.id} is overdue, scheduling daily notification`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM daily
        
        await add_notification(
          task.id,
          `Overdue: ${task.title}`,
          formatTaskNotificationBody(task),
          tomorrow
        );
        return;
      }
      
      // Handle in-progress tasks - schedule based on config
      const notificationSection = configs.find(section => section.title === 'Notifications');
      const notificationTimeItem = notificationSection?.items.find(item => item.name === 'Notification Time');
      
      if (notificationTimeItem && notificationTimeItem.value) {
        const notificationTimes = notificationTimeItem.value as NotificationTime[];
        
        for (const notificationTime of notificationTimes) {
          const dueDate = new Date(task.due_time.time_stamp);
          const notificationDate = new Date(dueDate);
          
          // Subtract the before days
          notificationDate.setDate(notificationDate.getDate() - notificationTime.beforeDays);
          
          // Set the time
          notificationDate.setHours(notificationTime.time.hour, notificationTime.time.minute, 0, 0);
          
          // Only schedule if the notification time is in the future
          const now = new Date();
          if (notificationDate > now) {
            await add_notification(
              task.id,
              `Task Reminder: ${task.title}`,
              formatTaskNotificationBody(task),
              notificationDate
            );
            console.log(`Scheduled notification for task ${task.id} at ${notificationDate.toLocaleString()}`);
          } else {
            console.log(`Notification time ${notificationDate.toLocaleString()} is in the past, skipping`);
          }
        }
      }
    };

    const updateAllTaskNotifications = async (): Promise<void> => {
      console.log('Updating all task notifications due to config change');
      for (const task of tasks) {
        await updateTaskNotification(task);
      }
    };

    const addNote = (note: Partial<Omit<Note, 'id' | 'create_time' | 'update_time'>>): number => {
        const now = getCurrentDateTime();
        const newNote: Note = {
            content: 'New Note',
            tags: [],
            ...note,
            id: Date.now(),
            create_time: now,
            update_time: now,
        };
        const newNotes = [...notes, newNote];
        setNotes(newNotes);
        localStorage.setItem('note_ids', JSON.stringify(newNotes.map(n => n.id)));
        localStorage.setItem(`note_${newNote.id}`, JSON.stringify(newNote));
        updateDayTimestamp(formatDateForContent(now));
        triggerSync();
        return newNote.id;
    };

    const updateNote = (updatedNote: Note) => {
        const now = getCurrentDateTime();
        const newNotes = notes.map(note => note.id === updatedNote.id ? { ...updatedNote, update_time: now } : note);
        setNotes(newNotes);
        localStorage.setItem(`note_${updatedNote.id}`, JSON.stringify({ ...updatedNote, update_time: now }));
        updateDayTimestamp(formatDateForContent(now));
        triggerSync();
    };

    const deleteNote = (noteId: number) => {
        const newNotes = notes.filter(note => note.id !== noteId);
        setNotes(newNotes);
        localStorage.setItem('note_ids', JSON.stringify(newNotes.map(n => n.id)));
        localStorage.removeItem(`note_${noteId}`);
        updateDayTimestamp(formatDateForContent(getCurrentDateTime()));
        triggerSync();
    };

    const getNoteById = (noteId: number): Note | undefined => notes.find(note => note.id === noteId);

    const updateConfig = async (sectionTitle: string, itemName: string, value: any) => {
        const isNotificationTimeChange = sectionTitle === 'Notifications' && itemName === 'Notification Time';
        
        setConfigs(prev => prev.map(section => 
            section.title === sectionTitle ? { ...section, items: section.items.map(item => item.name === itemName ? { ...item, value } : item) } : section
        ));
        
        // If notification time settings changed, update all task notifications
        if (isNotificationTimeChange) {
          console.log('Notification time settings changed, updating all task notifications');
          await updateAllTaskNotifications();
        }
    };

    // Derive unified tags from all tasks and notes
    const getAllTags = (): string[] => {
        const taskTags = tasks.flatMap(task => task.tags);
        const noteTags = notes.flatMap(note => note.tags);
        return [...new Set([...taskTags, ...noteTags])];
    };

    const addTag = (tag: string) => {
        // This function is now deprecated since tags are derived from tasks/notes
        // Tags should be added directly to tasks or notes
        console.warn('addTag is deprecated. Add tags directly to tasks or notes.');
    };

    const value = {
        tasks, notes, configs, tags: getAllTags(), activePage, activeId, isLoggedIn, username, isLoginModalOpen, setLoginModalOpen, login, logout, syncData,
        addTask, updateTask, deleteTask, getTaskById,
        addNote, updateNote, deleteNote, getNoteById,
        updateConfig, addTag, navigateTo, navigateBack,
        localDayUpdates, getTaskStatus
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const formatDateTimeForDisplay = (dt: DateTime | null): string => {
    if (!dt) return 'No due date';
    const date = new Date(dt.time_stamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const isToday = (dt: DateTime): boolean => {
    const today = new Date();
    const date = new Date(dt.time_stamp);
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};