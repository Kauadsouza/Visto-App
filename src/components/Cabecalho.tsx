import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useAuth } from '@/store/auth';
import { cores } from '@/theme';

/**
 * Cabeçalho das telas protegidas.
 *
 * Concentra a saída de conta — que não é uma tela por si só, e sim uma ação
 * que precisa existir em algum lugar acessível em toda sessão.
 */
export function Cabecalho({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  const { sair } = useAuth();
  const router = useRouter();

  const aoSair = async () => {
    await sair();
    router.replace('/onboarding');
  };

  return (
    <View className="flex-row items-center justify-between px-6 pb-5 pt-2">
      <View className="flex-1 pr-3">
        <Text className="text-lg font-semibold" style={{ color: cores.texto }}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text className="mt-0.5 text-caption" style={{ color: cores.texto3 }}>
            {subtitulo}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sair da conta"
        onPress={aoSair}
        className="h-10 w-10 items-center justify-center rounded-xl border active:opacity-70"
        style={{ backgroundColor: cores.superficie, borderColor: cores.borda }}
      >
        <LogOut size={17} color={cores.texto3} />
      </Pressable>
    </View>
  );
}