import { Briefcase, Compass, Map, MessagesSquare, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { cores } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // A tab ativa é a tinta da marca; a inativa recua para o texto-3. A
        // distinção não vem só da cor: o peso da fonte separa as duas mesmo
        // em tela com daltonismo ou brilho baixo.
        tabBarActiveTintColor: cores.marinho,
        tabBarInactiveTintColor: cores.texto3,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="resultado"
        options={{
          title: 'Rotas',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Assistente',
          tabBarIcon: ({ color, size }) => <MessagesSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="consultoria"
        options={{
          title: 'Consultoria',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="conta"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}