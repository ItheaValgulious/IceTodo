import { LocalNotifications } from '@capacitor/local-notifications';
import { Task, DateTime } from '../types';

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Add a notification
export const add_notification = async (id: number, title: string, body: string, scheduleTime: Date): Promise<void> => {
  try {
    // Cancel any existing notification with this ID first
    await del_notification(id);

    const now = new Date();
    if (scheduleTime <= now) {
      console.log('Notification time is in the past, scheduling for immediate delivery');
    }

    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: scheduleTime },
        ongoing: false,
      }]
    });
    console.log(`Notification scheduled: ${title} at ${scheduleTime.toLocaleString()}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

// Delete a notification
export const del_notification = async (id: number): Promise<void> => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
    console.log(`Notification cancelled: ${id}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

// Format notification body from task
export const formatTaskNotificationBody = (task: Task): string => {
  const parts = [];

  // Title
  parts.push(`Task: ${task.title}`);

  // Time
  if (task.due_time) {
    const dueDate = new Date(task.due_time.time_stamp);
    parts.push(`Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}`);
  } else {
    parts.push('Due: No due date');
  }

  // Priority
  parts.push(`Priority: ${task.priority}/10`);

  // Content
  if (task.content) {
    parts.push(`Content: ${task.content}`);
  }

  // Subtasks
  if (task.children && task.children.length > 0) {
    parts.push(`Subtasks: \n ${task.children.map(child => ` - ${child}`).join('\n')}`);
  }

  return parts.join('\n');
};

// Check if a datetime is overdue
export const isOverdue = (dueTime: DateTime): boolean => {
  const now = new Date();
  const dueDate = new Date(dueTime.time_stamp);
  return dueDate < now;
};

// Check if a datetime is in the future
export const isFuture = (beginTime: DateTime): boolean => {
  const now = new Date();
  const beginDate = new Date(beginTime.time_stamp);
  return beginDate > now;
};