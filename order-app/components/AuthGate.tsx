// components/AuthGate.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Don't do anything until auth is initialized
    if (!initialized) {
      return;
    }

    const inLoginFlow = segments[0] === 'login';
    
    // Prevent multiple navigation attempts
    if (isNavigating) {
      return;
    }

    // Handle navigation after a delay
    // const timeout = setTimeout(() => {
      try {
        if (user && inLoginFlow) {
          console.log('✅ User logged in, redirecting to home');
          setIsNavigating(true);
          router.replace('/(tabs)');
        } else if (!user && !inLoginFlow) {
          console.log('🚫 Not logged in, redirecting to login');
          setIsNavigating(true);
          router.replace('/');
        } else {
          // setIsNavigating(false);
          console.log('😎 Staying on current page');
          router.replace('/');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setIsNavigating(false);
      }
    // }, 200);

    // return () => clearTimeout(timeout);
  }, [user, segments, initialized, isNavigating]);

  // Show loading indicator while auth is initializing
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <>{children}</>;
}