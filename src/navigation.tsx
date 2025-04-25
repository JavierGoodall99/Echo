import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import RecordScreen from './screens/RecordScreen';
import VaultScreen from './screens/VaultScreen';
import InsightsScreen from './screens/InsightsScreen';
import EchoLockScreen from './screens/EchoLockScreen';
import { RootStackParamList } from './screens/EchoLockScreen';

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

const Navigation = () => {
  return (
    <NavigationContainer>
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
          name="Vault"
          component={VaultScreen}
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
