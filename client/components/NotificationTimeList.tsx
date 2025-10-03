import React from 'react';
import { NotificationTime, DateTime } from '../types';

interface NotificationTimeListProps {
    value: NotificationTime[];
    onChange: (value: NotificationTime[]) => void;
}

const NotificationTimeList: React.FC<NotificationTimeListProps> = ({ value, onChange }) => {
    const addNotificationTime = () => {
        const newNotificationTime: NotificationTime = {
            id: Date.now().toString(),
            beforeDays: 1,
            time: { hour: 9, minute: 0, time_stamp: Date.now() }
        };
        onChange([...value, newNotificationTime]);
    };

    const removeNotificationTime = (id: string) => {
        onChange(value.filter(item => item.id !== id));
    };

    const updateNotificationTime = (id: string, field: 'beforeDays' | 'time', newValue: number | DateTime) => {
        onChange(value.map(item =>
            item.id === id
                ? { ...item, [field]: newValue }
                : item
        ));
    };

    const updateTimeField = (id: string, timeField: 'hour' | 'minute', newValue: number) => {
        onChange(value.map(item =>
            item.id === id
                ? {
                    ...item,
                    time: {
                        ...item.time,
                        [timeField]: newValue,
                        time_stamp: Date.now()
                    }
                }
                : item
        ));
    };

    return (
        <div className="notification-time-list">
            <div className="mb-3 flex justify-between items-center">
                <strong className="text-slate-700 dark:text-slate-300">Notification Times</strong>
                <button
                    onClick={addNotificationTime}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    + Add
                </button>
            </div>

            {value.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400 italic text-sm">No notification times configured</div>
            ) : (
                value.map((item) => (
                    <div key={item.id} className="flex items-center mb-3 p-3 border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700">
                        <div className="mr-4">
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Before (days)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="365"
                                value={item.beforeDays}
                                onChange={(e) => updateNotificationTime(item.id, 'beforeDays', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                            />
                        </div>

                        <div className="mr-4">
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                Time
                            </label>
                            <div className="flex gap-1 items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={item.time.hour}
                                    onChange={(e) => updateTimeField(item.id, 'hour', parseInt(e.target.value) || 0)}
                                    className="w-12 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                                />
                                <span className="text-slate-600 dark:text-slate-400">:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={item.time.minute}
                                    onChange={(e) => updateTimeField(item.id, 'minute', parseInt(e.target.value) || 0)}
                                    className="w-12 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => removeNotificationTime(item.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm ml-auto"
                        >
                            Remove
                        </button>
                    </div>
                ))
            )}

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                Notifications will be sent at the specified time, before the due date by the specified number of days.
                "Before 0 days" means notification on the due date itself.
            </div>
        </div>
    );
};

export default NotificationTimeList;