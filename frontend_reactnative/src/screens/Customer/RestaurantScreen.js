import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRestaurant, getMenuItems } from '../../services/api';

export default function RestaurantScreen({ route, navigation }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantData, menuData] = await Promise.all([
        getRestaurant(restaurantId),
        getMenuItems(restaurantId),
      ]);
      setRestaurant(restaurantData);
      setMenuItems(menuData);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      Alert.alert('Error', 'Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing && existing.quantity > 1) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c
        )
      );
    } else {
      setCart(cart.filter((c) => c.id !== item.id));
    }
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find((c) => c.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const DELIVERY_FEE = 11.0;

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart');
      return;
    }
    navigation.navigate('Checkout', {
      cart,
      restaurant,
      subtotal: getTotalAmount(),
      deliveryFee: DELIVERY_FEE,
      totalAmount: getTotalAmount() + DELIVERY_FEE,
    });
  };

  const renderMenuItem = ({ item }) => {
    const quantity = getItemQuantity(item.id);
    
    return (
      <View style={styles.menuItem}>
        <View style={styles.menuItemContent}>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
          )}
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName}>{item.name}</Text>
            <Text style={styles.menuItemDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.menuItemPrice}>₹{item.price.toFixed(2)}</Text>
          </View>
        </View>
        
        {item.is_available ? (
          quantity > 0 ? (
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => removeFromCart(item)}
              >
                <Icon name="minus" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => addToCart(item)}
              >
                <Icon name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          )
        ) : (
          <Text style={styles.unavailableText}>Not Available</Text>
        )}
      </View>
    );
  };

  if (loading || !restaurant) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#F97316', '#DC2626']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
      </LinearGradient>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <View>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantDesc}>{restaurant.description}</Text>
            <View style={styles.restaurantMeta}>
              <View style={styles.metaItem}>
                <Icon name="star" size={16} color="#FBBF24" />
                <Text style={styles.metaText}>{restaurant.rating.toFixed(1)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>7-11 AM</Text>
              </View>
              <View style={styles.cuisineBadge}>
                <Text style={styles.cuisineText}>{restaurant.cuisine}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.menuList}
        ListHeaderComponent={
          <Text style={styles.menuHeader}>Menu Items</Text>
        }
      />

      {/* Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={proceedToCheckout}
        >
          <LinearGradient
            colors={['#F97316', '#DC2626']}
            style={styles.cartButtonGradient}
          >
            <View style={styles.cartButtonContent}>
              <View style={styles.cartInfo}>
                <Text style={styles.cartItems}>{cart.length} items</Text>
                <Text style={styles.cartTotal}>₹{(getTotalAmount() + DELIVERY_FEE).toFixed(2)}</Text>
              </View>
              <View style={styles.checkoutButton}>
                <Text style={styles.checkoutText}>Checkout</Text>
                <Icon name="arrow-right" size={20} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  restaurantInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  restaurantDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cuisineBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cuisineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  menuList: {
    padding: 20,
  },
  menuHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuItemDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F97316',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 12,
  },
  quantityButton: {
    backgroundColor: '#F97316',
    width: 32,
    height: 32,
    borderRadius: 16,
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
  addButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  unavailableText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cartButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cartButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartInfo: {
    flex: 1,
  },
  cartItems: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  cartTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
