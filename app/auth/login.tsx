import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../src/lib/auth.context';
import { ENV } from '../../src/config/env';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>✦</Text>
        <Text style={styles.appName}>{ENV.app.name}</Text>
        <Text style={styles.tagline}>AI Agent · Camera · YouTube · Local DB</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get started</Text>
        <Text style={styles.cardSub}>Sign in to continue</Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={signIn}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading
            ? <ActivityIndicator color="#374151" />
            : (
              <>
                <View style={styles.gIcon}><Text style={styles.gIconText}>G</Text></View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )
          }
        </TouchableOpacity>

        <Text style={styles.terms}>
          By signing in you agree to Google's Terms of Service.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 48, color: '#6366f1', marginBottom: 12 },
  appName: { fontSize: 32, fontWeight: '800', color: '#111827' },
  tagline: { fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center' },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: '#fff',
    borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1d5db',
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20,
    width: '100%', justifyContent: 'center', gap: 10,
  },
  gIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  gIconText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  terms: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 20, lineHeight: 16 },
});
