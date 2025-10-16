import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VendorDashboardScreen from '../screens/Vendor/VendorDashboardScreen';

const Stack = createStackNavigator();

export default function VendorNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="VendorDashboard" 
        component={VendorDashboardScreen}
        options={{ 
          title: 'Vendor Dashboard',
          headerStyle: { backgroundColor: '#F97316' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}