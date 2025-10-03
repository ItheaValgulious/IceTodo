// notificationLib.ts
import { LocalNotifications } from '@capacitor/local-notifications'

/**
 * 添加本地通知
 * @param id 唯一通知 ID
 * @param title 通知标题
 * @param body 通知内容
 * @param date 通知触发时间（JavaScript Date 对象）
 */
async function add_notification(
    id: number,
    title: string,
    body: string,
    date: Date
): Promise<void> {
    // 请求权限（如未请求过）
    await LocalNotifications.requestPermissions()

    // 调度通知
    await LocalNotifications.schedule({
        notifications: [
            {
                id,
                title,
                body,
                schedule: {
                    at: date,
                    allowWhileIdle: true
                }
            }
        ]
    })
}

/**
 * 删除本地通知
 * @param id 要删除的通知 ID
 */
async function del_notification(id: number): Promise<void> {
    await LocalNotifications.cancel({ notifications: [{ id }] })
}

export const notifier = {
    add_notification,
    del_notification
};
