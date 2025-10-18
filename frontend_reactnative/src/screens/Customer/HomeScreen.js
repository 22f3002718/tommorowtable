import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRestaurants } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('Restaurant', { restaurantId: item.id })}
    >
      <View style={styles.restaurantImage}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={['#FED7AA', '#FECACA']}
            style={styles.imagePlaceholder}
          >
            <Icon name="silverware-fork-knife" size={40} color="#F97316" />
          </LinearGradient>
        )}
        <View style={styles.ratingBadge}>
          <Icon name="star" size={12} color="#FBBF24" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.restaurantDesc} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.cuisineBadge}>
            <Text style={styles.cuisineText}>{item.cuisine}</Text>
          </View>
          <View style={styles.deliveryTime}>
            <Icon name="clock-outline" size={12} color="#6B7280" />
            <Text style={styles.deliveryTimeText}>7-11 AM</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#F97316', '#DC2626']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Icon name="food" size={32} color="#fff" />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Localtokri</Text>
              <Text style={styles.headerSubtitle}>Local Essentials, Delivered</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Fresh Breakfast</Text>
          <Text style={styles.heroTitle}>Delivered Tomorrow</Text>
          <Text style={styles.heroSubtitle}>Order before midnight • Delivery 7-11 AM</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for restaurants or cuisines..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </LinearGradient>

      {/* Quick Info Cards */}
      <View style={styles.quickInfo}>
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: '#FED7AA' }]}>
            <Icon name="lightning-bolt" size={20} color="#F97316" />
          </View>
          <Text style={styles.infoTitle}>Fast Delivery</Text>
          <Text style={styles.infoDesc}>7-11 AM</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="trophy" size={20} color="#10B981" />
          </View>
          <Text style={styles.infoTitle}>Fresh Food</Text>
          <Text style={styles.infoDesc}>Quality First</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="star" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.infoTitle}>Top Rated</Text>
          <Text style={styles.infoDesc}>Best Quality</Text>
        </View>
      </View>

      {/* Restaurants List */}
      <View style={styles.restaurantsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Restaurants Near You'}
          </Text>
          {filteredRestaurants.length > 0 && (
            <Text style={styles.sectionCount}>{filteredRestaurants.length} available</Text>
          )}
        </View>

        {filteredRestaurants.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="magnify" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No restaurants found</Text>
            <Text style={styles.emptyDesc}>Try searching with different keywords</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRestaurants}
            renderItem={renderRestaurant}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
  },
  logoutButton: {
    padding: 8,
  },
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#1F2937',
  },
  quickInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoDesc: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  restaurantsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  restaurantCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantImage: {
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  restaurantDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cuisineBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cuisineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryTimeText: {
    fontSize: 10,
    color: '#6B7280',
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
  listContent: {
    paddingBottom: 20,
  },
});