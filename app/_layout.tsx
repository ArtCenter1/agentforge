import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/lib/auth.context';
import { AuthGuard } from '../src/components/shared/AuthGuard';
import { dbService } from '../src/db/db.service';
import { agentService } from '../src/services/agent.service';
import { FEATURES } from '../src/config/features';

export default function RootLayout() {
  useEffect(() => {
    // Initialise services on app start
    agentService.init();
    if (FEATURES.localDatabase) {
      dbService.init().catch(console.error);
    }
  }, []);

  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </AuthProvider>
  );
}
