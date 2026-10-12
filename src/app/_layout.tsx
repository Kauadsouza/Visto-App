import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GuardaRota } from '@/components/GuardaRota';
import { cores } from '@/theme';

export default function RootLayout() {
  // Não há nada a inicializar aqui: o `persist` do store de auth lê o storage
  // do dispositivo sozinho e o GuardaRota espera por `hidratado`.
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
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