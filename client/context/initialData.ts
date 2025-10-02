
import { Task, Note, ConfigSection, DateTime, Page } from '../types';

const now = new Date();

const toDateTime = (date: Date): DateTime => ({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    time_stamp: date.getTime(),
});

const oneDay = 24 * 60 * 60 * 1000;
const tomorrow = new Date(now.getTime() + oneDay);
const yesterday = new Date(now.getTime() - oneDay);
const nextWeek = new Date(now.getTime() + 7 * oneDay);
const lastWeek = new Date(now.getTime() - 7 * oneDay);
const twoWeeksAgo = new Date(now.getTime() - 14 * oneDay);


export const initialTasks: Task[] = [
    {
        id: 1,
        title: 'Complete React project proposal', // Running
        is_done: false,
        content: 'Write up the full proposal including timeline and budget.',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        begin_time: toDateTime(lastWeek),
        due_time: toDateTime(nextWeek),
        priority: 8,
        tags: ['work', 'react'],
        children: [],
        punishment: { delete: false, highlight: true },
    },
    {
        id: 2,
        title: 'Grocery shopping', // Done
        is_done: true,
        content: 'Milk, Bread, Cheese, Eggs',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        begin_time: null,
        due_time: null,
        priority: 5,
        tags: ['personal', 'chores'],
        children: [],
        punishment: { delete: false, highlight: true },
    },
    {
        id: 3,
        title: 'Book dentist appointment', // Running (no dates)
        is_done: false,
        content: '',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        begin_time: null,
        due_time: null,
        priority: 7,
        tags: ['personal', 'health'],
        children: [],
        punishment: { delete: false, highlight: true },
    },
    {
        id: 4,
        title: 'Plan vacation', // Coming
        is_done: false,
        content: 'Research destinations and book flights.',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        begin_time: toDateTime(tomorrow),
        due_time: toDateTime(nextWeek),
        priority: 6,
        tags: ['personal'],
        children: [],
        punishment: { delete: false, highlight: true },
    },
    {
        id: 5,
        title: 'File expense report', // Outdated
        is_done: false,
        content: 'Submit Q3 expenses.',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        begin_time: toDateTime(twoWeeksAgo),
        due_time: toDateTime(yesterday),
        priority: 9,
        tags: ['work'],
        children: [],
        punishment: { delete: false, highlight: true },
    },
];

export const initialNotes: Note[] = [
    {
        id: 1,
        content: 'Meeting notes from today:\n- Discussed Q3 roadmap\n- Finalized budget for marketing',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        tags: ['work', 'meeting'],
    },
    {
        id: 2,
        content: 'Idea for a new side project: A recipe sharing app.',
        create_time: toDateTime(now),
        update_time: toDateTime(now),
        tags: ['ideas'],
    },
];

export const initialTags: string[] = ['work', 'react', 'personal', 'chores', 'health', 'meeting', 'ideas'];

export const initialConfigs: ConfigSection[] = [
    {
        title: 'Appearance',
        items: [
            { name: 'Dark Mode', type: 'boolean', value: false },
        ],
    },
    {
        title: 'Navigation',
        items: [
            { 
                name: 'Navigation', 
                type: 'nav_config', 
                value: {
                    visible: [Page.MyDay, Page.Tasks, Page.Calendar, Page.Notes, Page.Config],
                    hidden: [Page.Tags]
                } 
            },
        ],
    },
    {
        title: 'Notifications',
        items: [
            { name: 'Enable Notifications', type: 'boolean', value: true },
            { name: 'Reminder Time (minutes)', type: 'number', value: 30 },
        ],
    },
];