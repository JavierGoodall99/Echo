import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/core';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import RecordScreen from './screens/RecordScreen';
import VaultScreen from './screens/VaultScreen';
import InsightsScreen from './screens/InsightsScreen';
import EchoLockScreen from './screens/EchoLockScreen';
import PlaybackScreen from './screens/PlaybackScreen';
import { RootStackParamList } from './types/navigation';

// Create navigation ref for use outside of components
export const navigationRef = createNavigationContainerRef();

// Declare navigation ref on global for notification handling
declare global {
  var navigationRef: React.RefObject<NavigationContainerRef<any>>;
}

// Assign ref to global for use in notification handlers
global.navigationRef = navigationRef;

// Create the stack navigator
const Stack = createStackNavigator<RootStackParamList>();

// Create the bottom tab navigator
const Tab = createBottomTabNavigator();

// Home stack with Record and EchoLock screens
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="Record" 
        component={RecordScreen} 
        options={{ title: 'Record Echo' }}
      />
      <Stack.Screen 
        name="EchoLock" 
        component={EchoLockScreen} 
        options={{ 
          title: 'Lock Your Echo',
          headerLeft: () => null, // Disable back button
        }}
      />
    </Stack.Navigator>
  );
};

// Vault stack with VaultScreen and PlaybackScreen
const VaultStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="VaultMain"
        component={VaultScreen}
        options={{ title: 'Your Vault' }}
      />
      <Stack.Screen
        name="PlaybackScreen"
        component={PlaybackScreen}
        options={{ 
          title: 'Playback',
          headerShown: false, // Hide header as we have a custom one in the component
        }}
      />
    </Stack.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={{
        prefixes: ['echo://'],
        config: {
          screens: {
            VaultTab: {
              screens: {
                PlaybackScreen: 'playback/:echoId',
              },
            },
          },
        },
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false, // Hide header for tab screens as stacks have their own headers
          tabBarActiveTintColor: '#0066CC',
          tabBarInactiveTintColor: '#888888',
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="VaultTab"
          component={VaultStack}
          options={{
            tabBarLabel: 'Vault',
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
