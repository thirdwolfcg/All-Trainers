import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

function Navigator() {
  const { loading, session, profile, demo } = useAuth();
  const store = useStore();

  // Signed-in users see the side of the app that matches their account.
  useEffect(() => {
    if (profile && store.role !== profile.role) store.setRole(profile.role);
  }, [profile, store]);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const signedIn = !!session;
  const inApp = demo || (signedIn && !!profile);

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: Colors.primaryDeep,
        headerTitleStyle: { color: Colors.text, fontWeight: '600' },
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Protected guard={!signedIn && !demo} redirectTo={profile || demo ? '/' : '/onboarding'}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ title: '' }} />
        <Stack.Screen name="sign-in" options={{ title: '' }} />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && !profile && !demo} redirectTo={signedIn || demo ? '/' : '/welcome'}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={inApp} redirectTo={signedIn ? '/onboarding' : '/welcome'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="instructor/[id]" options={{ title: '' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Messages' }} />
        <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
        <Stack.Screen name="schedule/new" options={{ title: 'Add a class', presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <ThemeProvider value={theme}>
            <StatusBar style="dark" />
            <Navigator />
          </ThemeProvider>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
