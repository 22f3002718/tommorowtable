import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RiderDashboardScreen from '../screens/Rider/RiderDashboardScreen';
import PastOrdersScreen from '../screens/Rider/PastOrdersScreen';

const Stack = createStackNavigator();

export default function RiderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="RiderDashboard" 
        component={RiderDashboardScreen}
        options={{ 
          title: 'Rider Dashboard',
          headerStyle: { backgroundColor: '#F97316' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="PastOrders" 
        component={PastOrdersScreen}
        options={{ 
          title: 'Past Deliveries',
          headerStyle: { backgroundColor: '#F97316' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}