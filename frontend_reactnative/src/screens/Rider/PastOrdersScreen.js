import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRiderOrders } from '../../services/api';

export default function PastOrdersScreen() {
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
      // Filter only delivered orders
      const deliveredOrders = data.filter(order => order.status === 'delivered');
      setOrders(deliveredOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load past orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
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

      <View style={styles.deliveryInfo}>
        <View style={styles.statusBadge}>
          <Icon name="check-circle" size={14} color="#10B981" />
          <Text style={styles.statusText}>Delivered</Text>
        </View>
        <Text style={styles.deliverySlot}>
          <Icon name="clock-outline" size={14} color="#6B7280" />
          {' '}{item.delivery_slot}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="package-variant" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Past Deliveries</Text>
          <Text style={styles.emptyDesc}>
            Your completed deliveries will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceText: {
    color: '#fff',
    fontSize: 12,
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
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  deliverySlot: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
