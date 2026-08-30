/**
 * Dónde Hay - useNotifications Hook
 * Manejo de push notifications con expo-notifications
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermission(finalStatus === 'granted');

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#208AEF',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const savePushToken = async (userId: string, token: string) => {
    try {
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: userId,
          push_token: token,
          platform: Platform.OS,
          is_active: true,
        }, {
          onConflict: 'push_token',
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const registerForPushToken = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      setExpoPushToken(token);

      if (user?.id) {
        await savePushToken(user.id, token);
      }

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }, [user?.id, requestPermission]);

  const removePushToken = useCallback(async () => {
    if (!expoPushToken) return;

    try {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('push_token', expoPushToken);

      if (error) {
        console.error('Error removing push token:', error);
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }, [expoPushToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- registro asíncrono de push en montaje/login (regla heurística)
    void registerForPushToken();

    const notifSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        setLastNotification(notification);
      }
    );
    notificationListener.current = notifSub;

    const respSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        if (data?.['productId']) {
          console.log('Navigate to product:', data['productId']);
        }
      }
    );
    responseListener.current = respSub;

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [registerForPushToken]);

  return {
    expoPushToken,
    permission,
    lastNotification,
    requestPermission,
    registerForPushToken,
    removePushToken,
  };
}

export default useNotifications;
