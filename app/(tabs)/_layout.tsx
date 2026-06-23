import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/useWorkoutStore';

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
  { name: 'progress', title: 'Stats', icon: 'trending-up-outline', iconActive: 'trending-up' },
  { name: 'library', title: 'Biblio', icon: 'book-outline', iconActive: 'book' },
  { name: 'settings', title: 'Ajustes', icon: 'settings-outline', iconActive: 'settings' },
];

function PwaTabBar(props: BottomTabBarProps) {
  const focusedKey = props.state.routes[props.state.index].key;
  const tabStyle = props.descriptors[focusedKey].options.tabBarStyle;
  if (tabStyle && 'display' in tabStyle && tabStyle.display === 'none') {
    return null;
  }

  return <BottomTabBar {...props} />;
}

export default function TabLayout() {
  const activeSession = useWorkoutStore((s) => s.activeSession);

  return (
    <Tabs
      tabBar={(props) => <PwaTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        headerShown: false,
        sceneStyle: styles.scene,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarStyle:
              tab.name === 'workout' && activeSession
                ? { display: 'none' }
                : styles.tabBar,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={21}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: BG,
  },
  tabBar: {
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderStrong,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
