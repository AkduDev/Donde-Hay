/**
 * Dónde Hay - useDeviceLocation Hook
 * Geolocation del dispositivo con expo-location
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '@/store/locationStore';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseDeviceLocationOptions {
  enableHighAccuracy?: boolean;
  watchPosition?: boolean;
  distanceInterval?: number;
  timeInterval?: number;
}

export function useDeviceLocation(options: UseDeviceLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    watchPosition = false,
    distanceInterval = 100,
    timeInterval = 5000,
  } = options;

  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<Location.PermissionStatus>(
    Location.PermissionStatus.UNDETERMINED
  );

  const { setUserLocation } = useLocationStore();
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status);
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      setError('Error al solicitar permisos de ubicación');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
      }

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return null;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const deviceLocation: DeviceLocation = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        altitude: result.coords.altitude,
        accuracy: result.coords.accuracy,
        heading: result.coords.heading,
        speed: result.coords.speed,
        timestamp: result.timestamp,
      };

      setLocation(deviceLocation);
      setUserLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });

      return deviceLocation;
    } catch {
      setError('Error al obtener ubicación');
      return null;
    } finally {
      setLoading(false);
    }
  }, [enableHighAccuracy, requestPermission, setUserLocation]);

  const startWatching = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          distanceInterval,
          timeInterval,
        },
        (result) => {
          const deviceLocation: DeviceLocation = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            altitude: result.coords.altitude,
            accuracy: result.coords.accuracy,
            heading: result.coords.heading,
            speed: result.coords.speed,
            timestamp: result.timestamp,
          };
          setLocation(deviceLocation);
          setUserLocation({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
          });
        }
      );
    } catch {
      setError('Error al observar ubicación');
    }
  }, [enableHighAccuracy, distanceInterval, timeInterval, requestPermission, setUserLocation]);

  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch y suscripción de ubicación en montaje (regla heurística)
    void getCurrentLocation({ silent: true });

    if (watchPosition) {
      void startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [getCurrentLocation, startWatching, stopWatching, watchPosition]);

  return {
    location,
    error,
    loading,
    permission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    requestPermission,
  };
}

export default useDeviceLocation;
