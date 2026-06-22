import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

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

function AppTabBar(props: BottomTabBarProps) {
  const focusedKey = props.state.routes[props.state.index].key;
  const tabStyle = StyleSheet.flatten(props.descriptors[focusedKey].options.tabBarStyle);
  if (tabStyle?.display === 'none') {
    return null;
  }

  return (
    <BottomTabBar
      {...props}
      style={[
        {
          backgroundColor: BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
        },
        props.style,
      ]}
    />
  );
}

export default function TabLayout() {
  const activeSession = useWorkoutStore((s) => s.activeSession);

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: activeSession ? { display: 'none' } : undefined,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
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
