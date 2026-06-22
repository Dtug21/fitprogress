import { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  CommonActions,
  type NavigationRoute,
  type ParamListBase,
} from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { useAppInsets } from '../../lib/safeArea';
import { COLORS, FONT } from '../../constants/theme';

const BG = COLORS.bg;
const BORDER = COLORS.border;
const TAB_ROW = 52;

export function getTabBarTotalHeight(bottomInset: number) {
  return TAB_ROW + bottomInset;
}

export function FitTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const appInsets = useAppInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const focusedKey = state.routes[state.index].key;
  const tabStyle = StyleSheet.flatten(descriptors[focusedKey].options.tabBarStyle);
  if (tabStyle?.display === 'none') {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, appInsets.bottom);
  const compact = width < 400;
  const totalHeight = getTabBarTotalHeight(bottomInset);

  return (
    <View
      style={[styles.shell, { paddingBottom: bottomInset }]}
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height || totalHeight)}
    >
      <View style={styles.row}>
        {state.routes.map((route: NavigationRoute<ParamListBase>, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? COLORS.primary : COLORS.textMuted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          };

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.item}
            >
              {options.tabBarIcon?.({
                focused,
                color,
                size: compact ? 21 : 23,
              })}
              <Text
                style={[styles.label, { color }, compact && styles.labelCompact]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    ...(Platform.OS === 'web'
      ? { zIndex: 100, boxShadow: '0 -1px 0 rgba(255,255,255,0.06)' as unknown as number }
      : {}),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_ROW,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 9,
  },
});
