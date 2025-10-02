
import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Task, Note, ConfigSection, Page, DateTime, SyncPayload } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialTasks, initialNotes, initialConfigs } from './initialData';

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

// A simple hash function for data integrity checks
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};


interface AppContextType {
    tasks: Task[];
    notes: Note[];
    configs: ConfigSection[];
    tags: string[];
    activePage: Page;
    activeId: number | null;
    isLoggedIn: boolean;
    username: string;
    isLoginModalOpen: boolean;
    setLoginModalOpen: (isOpen: boolean) => void;
    login: (user: string, pass: string) => Promise<boolean>;
    logout: () => void;
    addTask: (task: Partial<Omit<Task, 'id' | 'create_time' | 'update_time'>>) => number;
    updateTask: (task: Task) => void;
    deleteTask: (taskId: number) => void;
    getTaskById: (taskId: number) => Task | undefined;
    addNote: (note: Partial<Omit<Note, 'id' | 'create_time' | 'update_time'>>) => number;
    updateNote: (note: Note) => void;
    deleteNote: (noteId: number) => void;
    getNoteById: (noteId: number) => Note | undefined;
    updateConfig: (sectionTitle: string, itemName: string, value: any) => void;
    addTag: (tag: string) => void;
    navigateTo: (page: Page, id: number | null) => void;
    navigateBack: () => void;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [configs, setConfigs] = useLocalStorage<ConfigSection[]>('configs', initialConfigs);
    const [tags, setTags] = useLocalStorage<string[]>('tags', []);
    const [activePage, setActivePage] = useState<Page>(Page.MyDay);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [pageBeforeEdit, setPageBeforeEdit] = useState<Page>(Page.MyDay);
    
    // Auth and Sync State
    const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
    const [username, setUsername] = useLocalStorage('username', '');
    const [token, setToken] = useLocalStorage('token', '');
    const [lastLocalUpdate, setLastLocalUpdate] = useLocalStorage('lastLocalUpdate', 0);
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
        syncTimeoutRef.current = window.setTimeout(syncData, 2000); // Debounce for 2s
    };
    
    const getLocalDataPayload = (): SyncPayload => {
        // FIX: Explicitly specify the generic type for Set to avoid type inference issues.
        const allTaskTags = [...new Set<string>(tasks.flatMap(t => t.tags))];
        // FIX: Explicitly specify the generic type for Set to avoid type inference issues.
        const allNoteTags = [...new Set<string>(notes.flatMap(n => n.tags))];
        return {
            tasks,
            notes,
            task_tag: allTaskTags,
            note_tag: allNoteTags,
            time: Date.now()
        };
    };

    const replaceLocalData = (payload: SyncPayload) => {
        // Update state
        setTasks(payload.tasks);
        setNotes(payload.notes);
        const allTags = [...new Set([...payload.task_tag, ...payload.note_tag])];
        setTags(allTags);

        // Clear old local storage
        const oldTaskIds: number[] = JSON.parse(localStorage.getItem('task_ids') || '[]');
        oldTaskIds.forEach(id => localStorage.removeItem(`task_${id}`));
        const oldNoteIds: number[] = JSON.parse(localStorage.getItem('note_ids') || '[]');
        oldNoteIds.forEach(id => localStorage.removeItem(`note_${id}`));

        // Set new local storage
        localStorage.setItem('task_ids', JSON.stringify(payload.tasks.map(t => t.id)));
        payload.tasks.forEach(t => localStorage.setItem(`task_${t.id}`, JSON.stringify(t)));
        localStorage.setItem('note_ids', JSON.stringify(payload.notes.map(n => n.id)));
        payload.notes.forEach(n => localStorage.setItem(`note_${n.id}`, JSON.stringify(n)));
        
        console.log("Local data overwritten by server data.");
    };

    const syncData = async () => {
        if (!isLoggedIn || !token) return;
        console.log("Starting sync...");

        const localData = getLocalDataPayload();
        const localHash = simpleHash(JSON.stringify({ tasks: localData.tasks, notes: localData.notes, tags: [...localData.task_tag, ...localData.note_tag] }));

        try {
            const checkRes = await fetch('a.com/check/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, hash: localHash })
            });
            // Mocking server response for now
            // const checkData = await checkRes.json();
            const checkData = { sync_needed: true }; 

            if (checkData.sync_needed) {
                console.log("Sync needed. Fetching server data...");
                const syncGetRes = await fetch('a.com/sync/', {
                    method: 'POST', // Using POST as GET cannot have a body
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                // const serverPayload = await syncGetRes.json();
                // const serverData = serverPayload.content;
                const serverData: SyncPayload = { tasks: [], notes: [], task_tag: [], note_tag: [], time: Date.now() + 5000 }; // Mock

                if (serverData.time > lastLocalUpdate) {
                    console.log("Server data is newer. Updating local data.");
                    replaceLocalData(serverData);
                    setLastLocalUpdate(serverData.time);
                } else {
                    console.log("Local data is newer. Uploading to server.");
                    await fetch('a.com/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, content: localData })
                    });
                    setLastLocalUpdate(localData.time);
                }
            } else {
                console.log("Data is already in sync.");
            }
        } catch (error) {
            console.error("Sync failed:", error);
        }
    };
    
    useEffect(() => {
        const intervalId = setInterval(syncData, 60000); // Sync every minute
        return () => clearInterval(intervalId);
    }, [isLoggedIn, token, tasks, notes]);


    // --- Auth ---
    const login = async (user: string, pass: string): Promise<boolean> => {
        try {
            const response = await fetch('a.com/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass }),
            });
            const data = await response.json();
            
            if (data.state === 'success' && data.token) {
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
            await fetch('a.com/logout');
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            setToken('');
            setUsername('');
            setIsLoggedIn(false);
        }
    };

    // --- Data C R U D ---
    const updateLocalTimestamp = () => setLastLocalUpdate(Date.now());

    const addTask = (task: Partial<Omit<Task, 'id' | 'create_time' | 'update_time'>>): number => {
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
        updateLocalTimestamp();
        triggerSync();
        return newTask.id;
    };

    const updateTask = (updatedTask: Task) => {
        const newTasks = tasks.map(task => task.id === updatedTask.id ? { ...updatedTask, update_time: getCurrentDateTime() } : task);
        setTasks(newTasks);
        localStorage.setItem(`task_${updatedTask.id}`, JSON.stringify({ ...updatedTask, update_time: getCurrentDateTime() }));
        updateLocalTimestamp();
        triggerSync();
    };

    const deleteTask = (taskId: number) => {
        const newTasks = tasks.filter(task => task.id !== taskId);
        setTasks(newTasks);
        localStorage.setItem('task_ids', JSON.stringify(newTasks.map(t => t.id)));
        localStorage.removeItem(`task_${taskId}`);
        updateLocalTimestamp();
        triggerSync();
    };
    
    const getTaskById = (taskId: number): Task | undefined => tasks.find(task => task.id === taskId);

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
        updateLocalTimestamp();
        triggerSync();
        return newNote.id;
    };

    const updateNote = (updatedNote: Note) => {
        const newNotes = notes.map(note => note.id === updatedNote.id ? { ...updatedNote, update_time: getCurrentDateTime() } : note);
        setNotes(newNotes);
        localStorage.setItem(`note_${updatedNote.id}`, JSON.stringify({ ...updatedNote, update_time: getCurrentDateTime() }));
        updateLocalTimestamp();
        triggerSync();
    };

    const deleteNote = (noteId: number) => {
        const newNotes = notes.filter(note => note.id !== noteId);
        setNotes(newNotes);
        localStorage.setItem('note_ids', JSON.stringify(newNotes.map(n => n.id)));
        localStorage.removeItem(`note_${noteId}`);
        updateLocalTimestamp();
        triggerSync();
    };

    const getNoteById = (noteId: number): Note | undefined => notes.find(note => note.id === noteId);

    const updateConfig = (sectionTitle: string, itemName: string, value: any) => {
        setConfigs(prev => prev.map(section => 
            section.title === sectionTitle ? { ...section, items: section.items.map(item => item.name === itemName ? { ...item, value } : item) } : section
        ));
    };

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            setTags(prev => [...prev, tag]);
            // Note: Tag changes will be synced with task/note updates.
        }
    };

    const value = {
        tasks, notes, configs, tags, activePage, activeId, isLoggedIn, username, isLoginModalOpen, setLoginModalOpen, login, logout,
        addTask, updateTask, deleteTask, getTaskById,
        addNote, updateNote, deleteNote, getNoteById,
        updateConfig, addTag, navigateTo, navigateBack
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