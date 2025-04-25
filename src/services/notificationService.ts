import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { EchoRecord } from '../lib/supabase';

// Configure notifications to handle interaction when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('echo-unlocks', {
      name: 'Echo Unlocks',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066CC',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}

export async function scheduleUnlockNotification(echo: EchoRecord) {
  if (!echo.id || !echo.unlock_at) {
    console.error('Invalid echo data for notification scheduling');
    return null;
  }

  const unlockDate = new Date(echo.unlock_at);
  const now = new Date();

  // Don't schedule if unlock date is in the past
  if (unlockDate <= now) {
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "An Echo from your past is ready",
        body: "Tap to listen",
        data: { echoId: echo.id },
      },
        trigger: {
            date: unlockDate,
            channelId: 'echo-unlocks',
        },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}