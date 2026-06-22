import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { FitTabBar, getTabBarTotalHeight } from '../../components/ui/FitTabBar';
import { useAppInsets } from '../../lib/safeArea';

const PRIMARY = COLORS.primary;
const INACTIVE = COLORS.textMuted;
const BG = COLORS.bg;

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
  { name: 'library', title: 'Biblio', icon: 'book-outline', iconActive: 'book' },
  { name: 'settings', title: 'Config', icon: 'settings-outline', iconActive: 'settings' },
];

export default function TabLayout() {
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const insets = useAppInsets();
  const tabBarHeight = getTabBarTotalHeight(insets.bottom);

  return (
    <Tabs
      tabBar={(props) => <FitTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: activeSession ? { display: 'none' } : { height: tabBarHeight },
        tabBarHideOnKeyboard: true,
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
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
