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
import { createMultiVendorOrder, getWalletBalance, updateLocation } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import LocationPickerModal from '../../components/LocationPickerModal';

export default function CheckoutScreen({ route, navigation }) {
  const { restaurants, subtotal, totalDeliveryFee, grandTotal } = route.params;
  const { user, updateUser } = useAuth();
  const { clearCart } = useCart();
  const [address, setAddress] = useState(user?.address || '');
  const [latitude, setLatitude] = useState(user?.latitude || null);
  const [longitude, setLongitude] = useState(user?.longitude || null);
  const [houseNumber, setHouseNumber] = useState(user?.house_number || '');
  const [buildingName, setBuildingName] = useState(user?.building_name || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

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

  const handleLocationSelect = (locationData) => {
    setLatitude(locationData.latitude);
    setLongitude(locationData.longitude);
    setAddress(locationData.address);
    setHouseNumber(locationData.house_number);
    setBuildingName(locationData.building_name);
  };

  const handlePlaceOrder = async () => {
    if (!address || !latitude || !longitude || !houseNumber || !buildingName) {
      Alert.alert('Location Required', 'Please set your complete delivery location including house/flat number and building name');
      return;
    }

    if (walletBalance < grandTotal) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (₹${walletBalance.toFixed(2)}) is less than the order amount (₹${grandTotal.toFixed(2)}). Please add money to your wallet.`,
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

      // Update user location with building details
      await updateLocation(address, latitude, longitude, houseNumber, buildingName);
      await updateUser({ address, latitude, longitude, house_number: houseNumber, building_name: buildingName });

      // Prepare multi-vendor order data
      const orderData = {
        restaurants: restaurants.map(restaurant => ({
          restaurant_id: restaurant.id,
          items: restaurant.items.map(item => ({
            menu_item_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        })),
        delivery_address: address,
        delivery_latitude: latitude,
        delivery_longitude: longitude,
        house_number: houseNumber,
        building_name: buildingName,
        special_instructions: specialInstructions,
      };

      // Create multi-vendor order
      await createMultiVendorOrder(orderData);

      // Clear the cart
      clearCart();

      Alert.alert(
        'Order Placed!',
        `Your ${restaurants.length} order${restaurants.length > 1 ? 's have' : ' has'} been placed successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
              navigation.navigate('Orders', { refresh: true });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasInsufficientBalance = walletBalance < grandTotal;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Delivery Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setLocationModalVisible(true)}
          >
            <Icon name="map-marker" size={20} color="#10B981" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {address || 'Set your delivery location'}
              </Text>
              {(houseNumber || buildingName) && (
                <Text style={styles.locationDetails}>
                  {houseNumber && `Flat: ${houseNumber}`}
                  {houseNumber && buildingName && ' • '}
                  {buildingName && `Building: ${buildingName}`}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary ({restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''})</Text>
          {restaurants.map((restaurant, idx) => (
            <View key={restaurant.id} style={styles.restaurantGroup}>
              <View style={styles.restaurantHeader}>
                <Icon name="store" size={16} color="#10B981" />
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
              </View>
              {restaurant.items.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <Text style={styles.itemName}>
                    {item.name} x {item.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add any special instructions for delivery"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹{totalDeliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={[styles.section, styles.walletSection]}>
          <View style={styles.walletHeader}>
            <Icon name="wallet" size={20} color="#10B981" />
            <Text style={styles.walletLabel}>Wallet Balance</Text>
          </View>
          <Text style={[styles.walletBalance, hasInsufficientBalance && styles.insufficientBalance]}>
            ₹{walletBalance.toFixed(2)}
          </Text>
          {hasInsufficientBalance && (
            <View style={styles.warningBox}>
              <Icon name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.warningText}>
                Insufficient balance. Please add ₹{(grandTotal - walletBalance).toFixed(2)} to your wallet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, (loading || hasInsufficientBalance) && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading || hasInsufficientBalance}
        >
          <LinearGradient
            colors={hasInsufficientBalance ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
            style={styles.placeOrderGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.placeOrderText}>
                  {hasInsufficientBalance ? 'Add Money to Wallet' : 'Place Order'}
                </Text>
                <Text style={styles.placeOrderAmount}>₹{grandTotal.toFixed(2)}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={{ latitude, longitude, address, house_number: houseNumber, building_name: buildingName }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#1F2937',
  },
  locationDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  restaurantGroup: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  walletSection: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  insufficientBalance: {
    color: '#EF4444',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  placeOrderButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeOrderAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
