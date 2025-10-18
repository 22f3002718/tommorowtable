import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../../contexts/CartContext';

const DELIVERY_FEE = 11.0;

export default function CartScreen({ navigation }) {
  const {
    cart,
    addToCart,
    removeFromCart,
    removeRestaurantFromCart,
    getRestaurants,
    getTotalAmount,
    getRestaurantTotal,
    getTotalItems,
  } = useCart();

  const restaurants = getRestaurants();
  const subtotal = getTotalAmount();
  const totalDeliveryFee = restaurants.length * DELIVERY_FEE;
  const grandTotal = subtotal + totalDeliveryFee;

  const handleRemoveRestaurant = (restaurantId, restaurantName) => {
    Alert.alert(
      'Remove Restaurant',
      `Remove all items from ${restaurantName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRestaurantFromCart(restaurantId),
        },
      ]
    );
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart');
      return;
    }
    navigation.navigate('Checkout', {
      restaurants,
      subtotal,
      totalDeliveryFee,
      grandTotal,
    });
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add items from restaurants to get started</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerSubtitle}>
          {getTotalItems()} items from {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {restaurants.map((restaurant) => (
          <View key={restaurant.id} style={styles.restaurantSection}>
            <View style={styles.restaurantHeader}>
              <View style={styles.restaurantInfo}>
                <Icon name="store" size={20} color="#10B981" />
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveRestaurant(restaurant.id, restaurant.name)}
              >
                <Icon name="delete-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {restaurant.items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/60' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeFromCart(item, restaurant.id)}
                  >
                    <Icon name="minus" size={16} color="#10B981" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => addToCart(item, { id: restaurant.id, name: restaurant.name })}
                  >
                    <Icon name="plus" size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.restaurantTotal}>
              <Text style={styles.restaurantTotalLabel}>Subtotal</Text>
              <Text style={styles.restaurantTotalValue}>
                ₹{getRestaurantTotal(restaurant.id).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.billSection}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Delivery Fee ({restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''})
            </Text>
            <Text style={styles.billValue}>₹{totalDeliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotal}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.footerSubtext}>{getTotalItems()} items</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={proceedToCheckout}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Icon name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  browseButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  restaurantSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
    borderTopWidth: 8,
    borderTopColor: '#F3F4F6',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  restaurantTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginTop: 8,
  },
  restaurantTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  restaurantTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  billSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
    borderTopWidth: 8,
    borderTopColor: '#F3F4F6',
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  billTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 4,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
