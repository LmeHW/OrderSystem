// app/_layout.tsx
import { Slot } from 'expo-router';
import { AuthProvider } from '@/contexts/auth';
import { AuthGate } from '../components/AuthGate';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Slot />
      </AuthGate>
    </AuthProvider>
  );
}