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
            <div style={{ marginBottom: '10px' }}>
                <strong>Notification Times</strong>
                <button
                    onClick={addNotificationTime}
                    style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        backgroundColor: 'rgb(37 99 235 / var(--tw-bg-opacity, 1))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + Add
                </button>
            </div>

            {value.length === 0 ? (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No notification times configured</div>
            ) : (
                value.map((item) => (
                    <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '10px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}>
                        <div style={{ marginRight: '15px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                                Before (days)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="365"
                                value={item.beforeDays}
                                onChange={(e) => updateNotificationTime(item.id, 'beforeDays', parseInt(e.target.value) || 0)}
                                style={{ width: '60px', padding: '5px' }}
                            />
                        </div>

                        <div style={{ marginRight: '15px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                                Time
                            </label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={item.time.hour}
                                    onChange={(e) => updateTimeField(item.id, 'hour', parseInt(e.target.value) || 0)}
                                    style={{ width: '50px', padding: '5px' }}
                                />
                                <span style={{ alignSelf: 'center' }}>:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={item.time.minute}
                                    onChange={(e) => updateTimeField(item.id, 'minute', parseInt(e.target.value) || 0)}
                                    style={{ width: '50px', padding: '5px' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => removeNotificationTime(item.id)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Remove
                        </button>
                    </div>
                ))
            )}

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Notifications will be sent at the specified time, before the due date by the specified number of days.
                "Before 0 days" means notification on the due date itself.
            </div>
        </div>
    );
};

export default NotificationTimeList;