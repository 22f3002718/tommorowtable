import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function LocationPickerModal({ visible, onClose, onLocationSelect, initialData }) {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Location data
  const [latitude, setLatitude] = useState(initialData?.latitude || null);
  const [longitude, setLongitude] = useState(initialData?.longitude || null);
  const [address, setAddress] = useState(initialData?.address || '');
  const [houseNumber, setHouseNumber] = useState(initialData?.house_number || '');
  const [buildingName, setBuildingName] = useState(initialData?.building_name || '');
  
  // Map region
  const [region, setRegion] = useState({
    latitude: initialData?.latitude || 19.076,
    longitude: initialData?.longitude || 72.8777,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (visible && !latitude) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      setLatitude(lat);
      setLongitude(lng);
      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
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

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      
      // Use Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          searchQuery
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        setSearchResults(data.predictions);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search location');
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = async (placeId) => {
    try {
      setLoading(true);
      
      // Get place details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const place = data.result;
        const lat = place.geometry.location.lat;
        const lng = place.geometry.location.lng;
        
        setLatitude(lat);
        setLongitude(lng);
        setAddress(place.formatted_address);
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Failed to select location');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
    
    setLatitude(lat);
    setLongitude(lng);
    
    try {
      // Reverse geocode
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (addresses.length > 0) {
        const addr = addresses[0];
        const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        setAddress(fullAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleSave = () => {
    if (!latitude || !longitude || !address) {
      Alert.alert('Incomplete', 'Please select a location on the map');
      return;
    }

    if (!houseNumber || !buildingName) {
      Alert.alert('Incomplete', 'Please enter house/flat number and building name');
      return;
    }

    onLocationSelect({
      latitude,
      longitude,
      address,
      house_number: houseNumber,
      building_name: buildingName,
    });
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Delivery Location</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchLocation}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color="#F97316" />}
          </View>
          
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            <Icon name="crosshairs-gps" size={24} color="#F97316" />
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <ScrollView style={styles.searchResults}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.place_id}
                style={styles.searchResultItem}
                onPress={() => selectSearchResult(result.place_id)}
              >
                <Icon name="map-marker" size={20} color="#F97316" />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultMain}>{result.structured_formatting.main_text}</Text>
                  <Text style={styles.searchResultSecondary}>{result.structured_formatting.secondary_text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          {latitude && longitude ? (
            <MapView
              style={styles.map}
              region={region}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                draggable
                onDragEnd={handleMapPress}
              />
            </MapView>
          ) : (
            <View style={styles.loadingMap}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </View>

        {/* Address Details */}
        <ScrollView style={styles.detailsContainer}>
          <View style={styles.addressBox}>
            <Icon name="map-marker" size={20} color="#F97316" />
            <Text style={styles.addressText} numberOfLines={2}>
              {address || 'Select location on map'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>House / Flat No. *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 301, Building A"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Building / Apartment Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Green Valley Apartments"
              value={buildingName}
              onChangeText={setBuildingName}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={['#F97316', '#DC2626']}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Confirm Location</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  currentLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultText: {
    flex: 1,
  },
  searchResultMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchResultSecondary: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  mapContainer: {
    height: height * 0.35,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
