import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMyOrders, getWalletBalance } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, walletData] = await Promise.all([
        getMyOrders(),
        getWalletBalance(),
      ]);
      setOrders(ordersData);
      setWalletBalance(walletData.balance);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: '#3B82F6',
      confirmed: '#8B5CF6',
      preparing: '#F59E0B',
      ready: '#10B981',
      'out-for-delivery': '#06B6D4',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      placed: 'receipt',
      confirmed: 'check-circle',
      preparing: 'chef-hat',
      ready: 'package-variant',
      'out-for-delivery': 'truck-delivery',
      delivered: 'check-all',
      cancelled: 'close-circle',
    };
    return icons[status] || 'information';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
          <Text style={styles.orderDate}>{formatDate(item.placed_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Icon name={getStatusIcon(item.status)} size={12} color="#fff" />
          <Text style={styles.statusText}>{item.status.replace('-', ' ')}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 3).map((orderItem, index) => (
          <Text key={index} style={styles.orderItemText}>
            {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
        {item.items.length > 3 && (
          <Text style={styles.moreItems}>+{item.items.length - 3} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.deliveryInfo}>
          <Icon name="clock-outline" size={14} color="#6B7280" />
          <Text style={styles.deliveryText}>{item.delivery_slot}</Text>
        </View>
        <Text style={styles.orderTotal}>₹{item.total_amount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#F97316', '#DC2626']} style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Wallet Card */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => navigation.navigate('Wallet')}
        >
          <LinearGradient
            colors={['#F97316', '#DC2626']}
            style={styles.walletGradient}
          >
            <View style={styles.walletContent}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletBalance}>₹{walletBalance.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.addMoneyButton}>
                <Text style={styles.addMoneyText}>Add Money</Text>
                <Icon name="plus-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Orders List */}
        <View style={styles.ordersSection}>
          <Text style={styles.sectionTitle}>Your Orders</Text>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="receipt" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyDesc}>Start ordering to see your history</Text>
            </View>
          ) : (
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  walletCard: {
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  walletGradient: {
    padding: 20,
  },
  walletContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  walletBalance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMoneyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ordersSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});