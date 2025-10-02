
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