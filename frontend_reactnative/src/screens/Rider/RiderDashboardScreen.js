import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRiderOrders, updateDeliveryStatus } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function RiderDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getRiderOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'out-for-delivery' ? 'delivered' : 'out-for-delivery';

    try {
      await updateDeliveryStatus(orderId, nextStatus);
      await fetchOrders();
      Alert.alert('Success', `Order status updated to ${nextStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const openNavigation = (latitude, longitude, address) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location Not Available', 'Customer location not set');
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered').sort((a, b) => (a.delivery_sequence || 0) - (b.delivery_sequence || 0));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Rider Dashboard</Text>
          <TouchableOpacity onPress={logout}>
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>Welcome, {user?.name}</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="truck-delivery" size={32} color="#10B981" />
          <Text style={styles.statValue}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>Active Deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="check-circle" size={32} color="#10B981" />
          <Text style={styles.statValue}>{completedOrders.length}</Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
      </View>

      {/* Past Orders Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={styles.pastOrdersButton}
          onPress={() => navigation.navigate('PastOrders')}
        >
          <Icon name="history" size={20} color="#10B981" />
          <Text style={styles.pastOrdersText}>View Past Deliveries</Text>
          <Icon name="chevron-right" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {activeOrders.length > 0 && (
        <Text style={styles.sectionTitle}>Active Deliveries</Text>
      )}

      {activeOrders.length > 0 ? (
        activeOrders.map((item) => (
          <View key={item.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                {item.delivery_sequence && (
                  <View style={styles.sequenceBadge}>
                    <Text style={styles.sequenceText}>#{item.delivery_sequence}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.customerName}>{item.customer_name}</Text>
                  <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
                </View>
              </View>
              <Text style={styles.orderAmount}>₹{item.total_amount.toFixed(2)}</Text>
            </View>

            <View style={styles.addressSection}>
              <Icon name="map-marker" size={16} color="#6B7280" />
              <View style={styles.addressContent}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.delivery_address}
                </Text>
                {(item.house_number || item.building_name) && (
                  <Text style={styles.addressDetails}>
                    {item.house_number && `Flat: ${item.house_number}`}
                    {item.house_number && item.building_name && ' • '}
                    {item.building_name && `Building: ${item.building_name}`}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.orderItems}>
              {item.items.slice(0, 2).map((orderItem, index) => (
                <Text key={index} style={styles.orderItemText}>
                  {orderItem.name} x {orderItem.quantity}
                </Text>
              ))}
              {item.items.length > 2 && (
                <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => openNavigation(
                  item.delivery_latitude,
                  item.delivery_longitude,
                  item.delivery_address
                )}
              >
                <Icon name="navigation" size={16} color="#fff" />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>

              {item.status === 'out-for-delivery' && (
                <TouchableOpacity
                  style={styles.deliveredButton}
                  onPress={() => handleUpdateStatus(item.id, item.status)}
                >
                  <Icon name="check" size={16} color="#fff" />
                  <Text style={styles.deliveredButtonText}>Mark Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Icon name="truck-delivery" size={60} color="#D1D5DB" />
          <Text style={styles.emptyText}>No deliveries assigned</Text>
        </View>
      )}

      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pastOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pastOrdersText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    marginLeft: 12,
  },
  listContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sequenceBadge: {
    backgroundColor: '#F97316',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  restaurantName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deliveredButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  deliveredButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});