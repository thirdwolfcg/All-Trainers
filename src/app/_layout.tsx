import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { StoreProvider } from '@/lib/store';

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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerTintColor: Colors.primaryDeep,
              headerTitleStyle: { color: Colors.text, fontWeight: '600' },
              headerBackTitle: 'Back',
              contentStyle: { backgroundColor: Colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="instructor/[id]" options={{ title: '' }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Messages' }} />
            <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
            <Stack.Screen name="schedule/new" options={{ title: 'Add a class', presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
