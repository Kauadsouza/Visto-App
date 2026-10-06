import { Text, View } from 'react-native';

import { Tela } from '@/components/Tela';
import { cores } from '@/theme';

export default function Conta() {
  return (
    <Tela>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold" style={{ color: cores.texto }}>
          Em breve
        </Text>
      </View>
    </Tela>
  );
}