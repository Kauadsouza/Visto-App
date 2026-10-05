import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useAuth } from '@/store/auth';

/**
 * Cabeçalho das telas protegidas.
 *
 * Concentra a saída de conta — que não é uma tela por si só, e sim uma ação
 * que precisa existir em algum lugar acessível em toda sessão.
 */
export function Cabecalho({ titulo }: { titulo?: string }) {
  const { sair } = useAuth();
  const router = useRouter();

  const aoSair = async () => {
    await sair();
    router.replace('/onboarding');
  };

  return (
    <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
      <Text className="text-lg font-semibold text-texto">{titulo ?? 'Visto'}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sair da conta"
        onPress={aoSair}
        className="h-10 w-10 items-center justify-center rounded-xl border border-borda active:opacity-70"
      >
        <LogOut size={18} color="#A1A1AA" />
      </Pressable>
    </View>
  );
}