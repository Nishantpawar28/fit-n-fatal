import { Tabs } from 'expo-router';
import { colors } from '@fit-n-fatal/utils';
import { Text } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '⚡',
    Workout: '💪',
    History: '📋',
    Progress: '📈',
    Exercises: '🏋️',
  };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'rgba(180,100,255,0.12)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.violet,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: 'DMSans', fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ focused }) => <TabIcon label="Workout" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon label="History" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon label="Progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ focused }) => <TabIcon label="Exercises" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
