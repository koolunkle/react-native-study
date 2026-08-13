import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { DB_NAME, migrateDbIfNeeded } from '@/db/client';
import { Fonts } from '@/constants/Fonts';
import { initNotifications } from '@/lib/notifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    [Fonts.title]: require('../assets/fonts/BMHANNAPro.ttf'),
    [Fonts.body]: require('../assets/fonts/OngleipParkDahyeon.ttf'),
    [Fonts.num]: require('../assets/fonts/Pretendard-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    initNotifications();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
      <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded} useSuspense>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="habit/new"
              options={{ presentation: 'modal', title: '습관 등록' }}
            />
            <Stack.Screen name="habit/[id]/edit" options={{ title: '습관 수정' }} />
            <Stack.Screen name="habit/manage" options={{ title: '습관 관리' }} />
            <Stack.Screen name="habit/archive" options={{ title: '보관함' }} />
            <Stack.Screen name="calendar/[date]" options={{ title: '기록' }} />
          </Stack>
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
