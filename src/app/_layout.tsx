import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces/400Regular_Italic';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, FontFamily } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { StoreProvider, useStore } from '@/lib/store';
import { ToastProvider, useToast } from '@/lib/toast';

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

  const signedIn = !!session;
  const inApp = demo || (signedIn && !!profile);
  const toast = useToast();

  // Someone scanned an instructor's QR code before they had an account:
  // once they're in as a client, follow that instructor and show their week.
  useEffect(() => {
    const pending = store.pendingFollow;
    if (!pending || !inApp) return;
    store.setPendingFollow(null);
    const instructor = store.instructor(pending);
    if (!instructor || store.role !== 'client') return;
    if (!store.following.has(pending)) store.toggleFollow(pending);
    setTimeout(() => {
      router.push({ pathname: '/instructor/[id]', params: { id: pending } });
      toast(`You're following ${instructor.name.split(' ')[0]}. Welcome in.`);
    }, 0);
  }, [inApp, store, toast]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: Colors.primaryDeep,
        headerTitleStyle: { color: Colors.text, fontFamily: FontFamily.serif, fontSize: 18 },
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      {/* Open to everyone: where instructor QR codes and shared links land */}
      <Stack.Screen name="follow/[handle]" options={{ headerShown: false }} />

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
        <Stack.Screen name="class/[id]" options={{ title: '' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Messages' }} />
        <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
        <Stack.Screen name="schedule/new" options={{ title: 'Add a class', presentation: 'modal' }} />
        <Stack.Screen name="post/new" options={{ title: 'New post', presentation: 'modal' }} />
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
            <ToastProvider>
              <StatusBar style="dark" />
              <Navigator />
            </ToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
