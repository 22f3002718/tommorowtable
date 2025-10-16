import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import VendorNavigator from './VendorNavigator';
import RiderNavigator from './RiderNavigator';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.role === 'vendor' ? (
        <Stack.Screen name="Vendor" component={VendorNavigator} />
      ) : user.role === 'rider' ? (
        <Stack.Screen name="Rider" component={RiderNavigator} />
      ) : (
        <Stack.Screen name="Customer" component={CustomerNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});