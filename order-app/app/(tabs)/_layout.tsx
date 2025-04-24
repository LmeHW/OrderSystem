import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';



import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import UserSidebar from '@/components/UserSidebar'

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  return (
    <>
      <UserSidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
          headerRight: () => (
            <Pressable onPress={() => setSidebarVisible(true)}>
                {({ pressed }) => (
                  <FontAwesome
                    name="user"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
          ),
        }}>

        <Tabs.Screen
          name="index"
          options={{
            title: '订单',
            tabBarIcon: ({ color }) => <TabBarIcon name="inbox" color={color} />,
          }}
        />
        <Tabs.Screen
          name="stock"
          options={{
            title: '仓库',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: '分析',
            tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="customer"
          options={{
            title: '客户',
            tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

