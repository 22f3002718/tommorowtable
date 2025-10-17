import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorOrders, updateOrderStatus, getVendorRestaurant, updateRestaurantImage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function VendorDashboardScreen() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const data = await getVendorRestaurant();
      setRestaurant(data);
      setImageUrl(data.image_url || '');
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getVendorOrders();
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
    await fetchRestaurant();
    setRefreshing(false);
  };

  const handleSaveImage = async () => {
    if (!imageUrl.trim()) {
      Alert.alert('Error', 'Please enter image URL');
      return;
    }

    try {
      setSavingImage(true);
      await updateRestaurantImage(imageUrl);
      Alert.alert('Success', 'Restaurant image updated successfully');
      setSettingsModalVisible(false);
      await fetchRestaurant();
    } catch (error) {
      console.error('Error updating image:', error);
      Alert.alert('Error', 'Failed to update restaurant image');
    } finally {
      setSavingImage(false);
    }
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const statusFlow = {
      placed: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
    };

    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    try {
      await updateOrderStatus(orderId, nextStatus);
      await fetchOrders();
      Alert.alert('Success', `Order status updated to ${nextStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
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

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.placed_at).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={styles.orderItemText}>
            {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>₹{item.total_amount.toFixed(2)}</Text>
        {['placed', 'confirmed', 'preparing'].includes(item.status) && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleUpdateStatus(item.id, item.status)}
          >
            <Text style={styles.updateButtonText}>
              {item.status === 'placed' && 'Confirm'}
              {item.status === 'confirmed' && 'Start Preparing'}
              {item.status === 'preparing' && 'Mark Ready'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#F97316', '#DC2626']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Vendor Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={styles.headerButton}>
              <Icon name="cog" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout}>
              <Icon name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.userName}>Welcome, {user?.name}</Text>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.ready}</Text>
          <Text style={styles.statLabel}>Ready</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="receipt" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Icon name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Restaurant Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.settingLabel}>Restaurant Image URL</Text>
            <TextInput
              style={styles.settingInput}
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />
            <Text style={styles.settingHint}>
              Enter a valid image URL for your restaurant
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveImage}
              disabled={savingImage}
            >
              <LinearGradient
                colors={['#F97316', '#DC2626']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {savingImage ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  updateButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateButtonText: {
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