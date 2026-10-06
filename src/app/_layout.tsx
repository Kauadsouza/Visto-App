import '../../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GuardaRota } from '@/components/GuardaRota';
import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

export default function RootLayout() {
  const { iniciar } = useAuth();

  // Lê o token persistido uma vez, no boot, antes de qualquer tela decidir
  // o que mostrar. O GuardaRota espera essa leitura terminar.
  useEffect(() => {
    void iniciar();
  }, [iniciar]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <GuardaRota>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: cores.fundo },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </GuardaRota>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}