import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RecordScreen from './screens/RecordScreen';
import VaultScreen from './screens/VaultScreen';
import InsightsScreen from './screens/InsightsScreen';

// Create the bottom tab navigator
const Tab = createBottomTabNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#0066CC',
          tabBarInactiveTintColor: '#888888',
        }}
      >
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{
            title: 'Home',
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
