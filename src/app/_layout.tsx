import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, FontFamily } from '@/constants/theme';
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
  const { loading: authLoading, session, profile, demo } = useAuth();
  const store = useStore();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  // Never block the app on fonts: fall back to system fonts if they fail.
  const loading = authLoading || (!fontsLoaded && !fontError);

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
        headerTitleStyle: { color: Colors.text, fontFamily: FontFamily.serif, fontSize: 18 },
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
