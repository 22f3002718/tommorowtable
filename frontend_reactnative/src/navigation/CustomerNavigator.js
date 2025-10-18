import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/Customer/HomeScreen';
import RestaurantScreen from '../screens/Customer/RestaurantScreen';
import OrdersScreen from '../screens/Customer/OrdersScreen';
import CartScreen from '../screens/Customer/CartScreen';
import ProfileScreen from '../screens/Customer/ProfileScreen';
import WalletScreen from '../screens/Customer/WalletScreen';
import CheckoutScreen from '../screens/Customer/CheckoutScreen';
import { useCart } from '../contexts/CartContext';

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

function CartStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CartMain" 
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ 
          title: 'Checkout',
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}

export default function CustomerNavigator() {
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          // Add badge for cart
          if (route.name === 'Cart' && cartItemCount > 0) {
            return (
              <View style={styles.iconContainer}>
                <Icon name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount}</Text>
                </View>
              </View>
            );
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});