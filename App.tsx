import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

export default function App() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Register for notifications when app starts
    registerForPushNotificationsAsync();

    // Listen for incoming notifications when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle notification while app is open
      console.log('Received notification:', notification);
    });

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const echoId = response.notification.request.content.data?.echoId;
      if (echoId) {
        // We'll handle navigation in the NavigationRef
        global.navigationRef?.navigate('VaultTab', {
          screen: 'PlaybackScreen',
          params: { echoId }
        });
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}
