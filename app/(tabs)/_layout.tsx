import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useAppInsets } from '../../lib/safeArea';

const PRIMARY = COLORS.primary;
const INACTIVE = COLORS.textMuted;
const BG = COLORS.bg;
const BORDER = COLORS.border;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'index', title: 'Inicio', icon: 'home-outline', iconActive: 'home' },
  { name: 'workout', title: 'Entreno', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'routines', title: 'Rutinas', icon: 'list-outline', iconActive: 'list' },
  { name: 'progress', title: 'Progreso', icon: 'trending-up-outline', iconActive: 'trending-up' },
  { name: 'library', title: 'Biblioteca', icon: 'book-outline', iconActive: 'book' },
  { name: 'settings', title: 'Config', icon: 'settings-outline', iconActive: 'settings' },
];

export default function TabLayout() {
  const insets = useAppInsets();
  const activeSession = useWorkoutStore((s) => s.activeSession);

  const tabBarStyle = activeSession
    ? { display: 'none' as const }
    : {
        backgroundColor: BG,
        borderTopColor: BORDER,
        borderTopWidth: 1,
        paddingTop: 4,
        paddingBottom: insets.bottom,
        minHeight: 50 + insets.bottom,
        elevation: 0,
      };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle,
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: BG }} />,
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingTop: 2,
          paddingBottom: Platform.OS === 'ios' ? 2 : 4,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 0,
        },
        headerShown: false,
        sceneStyle: { backgroundColor: BG },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
