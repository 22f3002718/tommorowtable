import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createOrder, getWalletBalance, updateLocation } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LocationPickerModal from '../../components/LocationPickerModal';

export default function CheckoutScreen({ route, navigation }) {
  const { cart, restaurant, totalAmount } = route.params;
  const { user, updateUser } = useAuth();
  const [address, setAddress] = useState(user?.address || '');
  const [latitude, setLatitude] = useState(user?.latitude || null);
  const [longitude, setLongitude] = useState(user?.longitude || null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const data = await getWalletBalance();
      setWalletBalance(data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        setAddress(fullAddress);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address || !latitude || !longitude) {
      Alert.alert('Location Required', 'Please set your delivery location');
      return;
    }

    if (walletBalance < totalAmount) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (₹${walletBalance.toFixed(2)}) is less than the order amount (₹${totalAmount.toFixed(2)}). Please add money to your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Money',
            onPress: () => navigation.navigate('Orders', { screen: 'Wallet' }),
          },
        ]
      );
      return;
    }

    try {
      setLoading(true);

      // Update user location
      await updateLocation(address, latitude, longitude);
      await updateUser({ address, latitude, longitude });

      // Prepare order data
      const orderData = {
        restaurant_id: restaurant.id,
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        delivery_address: address,
        delivery_latitude: latitude,
        delivery_longitude: longitude,
        special_instructions: specialInstructions,
      };

      // Create order
      await createOrder(orderData);

      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        error.response?.data?.detail || 'Failed to place order'
      );
    } finally {
      setLoading(false);
    }
  };

  const sufficientBalance = walletBalance >= totalAmount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={[styles.section, styles.walletSection]}>
          <View style={styles.walletHeader}>
            <Icon name="wallet" size={24} color="#F97316" />
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={[
                styles.walletBalance,
                !sufficientBalance && styles.insufficientBalance
              ]}>
                ₹{walletBalance.toFixed(2)}
              </Text>
            </View>
          </View>
          {!sufficientBalance && (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.warningText}>
                Insufficient balance. Please add money to your wallet.
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            <Icon name="crosshairs-gps" size={20} color="#F97316" />
            <Text style={styles.locationButtonText}>
              {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.addressInput}
            placeholder="Enter delivery address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />

          {latitude && longitude && (
            <Text style={styles.coordsText}>
              Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Any special requests?"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[styles.placeOrderButton, !sufficientBalance && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading || !sufficientBalance}
        >
          <LinearGradient
            colors={sufficientBalance ? ['#F97316', '#DC2626'] : ['#9CA3AF', '#6B7280']}
            style={styles.placeOrderGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeOrderText}>Place Order</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  walletSection: {
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  insufficientBalance: {
    color: '#EF4444',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 12,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
  },
  coordsText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
  },
  placeOrderButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
