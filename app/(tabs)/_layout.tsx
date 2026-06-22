import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

const PRIMARY = COLORS.primary;
const INACTIVE = COLORS.textMuted;
const BG = COLORS.bg;
const BORDER = COLORS.border;
const TAB_BAR_CONTENT = 52;

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
  const insets = useSafeAreaInsets();
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const tabBarHeight = TAB_BAR_CONTENT + insets.bottom;

  const tabBarStyle = activeSession
    ? { display: 'none' as const }
    : {
        backgroundColor: BG,
        borderTopColor: BORDER,
        borderTopWidth: 1,
        height: tabBarHeight,
        paddingTop: 6,
        paddingBottom: insets.bottom,
      };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
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
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
