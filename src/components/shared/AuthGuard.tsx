/**
 * AuthGuard — redirects unauthenticated users to login.
 * Wrap your root Stack/Tabs with this.
 */

import React, { useEffect, type ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../lib/auth.context';
import { FEATURES } from '../../config/features';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!FEATURES.authGuard || isLoading) return;
    const inAuth = segments[0] === 'auth';
    if (!isAuthenticated && !inAuth) router.replace('/auth/login');
    else if (isAuthenticated && inAuth) router.replace('/(app)');
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
});
