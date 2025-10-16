import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/Customer/HomeScreen';
import RestaurantScreen from '../screens/Customer/RestaurantScreen';
import OrdersScreen from '../screens/Customer/OrdersScreen';
import ProfileScreen from '../screens/Customer/ProfileScreen';
import WalletScreen from '../screens/Customer/WalletScreen';
import CheckoutScreen from '../screens/Customer/CheckoutScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Restaurant" 
        component={RestaurantScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ 
          title: 'Checkout',
          headerStyle: { backgroundColor: '#F97316' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersMain" 
        component={OrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ 
          title: 'My Wallet',
          headerStyle: { backgroundColor: '#F97316' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}