import React, { useState, useEffect, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const GoogleLocationPicker = ({ onLocationSelect, initialLocation, showSkip = true, onSkip }) => {
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapsRef = useRef(null);

  // Load Google Maps
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Import required libraries
        const { Map } = await importLibrary('maps', { apiKey: GOOGLE_MAPS_API_KEY });
        const { Marker } = await importLibrary('marker', { apiKey: GOOGLE_MAPS_API_KEY });
        const { Autocomplete, Geocoder } = await importLibrary('places', { apiKey: GOOGLE_MAPS_API_KEY });
        
        // Store references for later use
        googleMapsRef.current = { Map, Marker, Autocomplete, Geocoder };
        setMapLoaded(true);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        toast.error('Failed to load Google Maps');
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current || !googleMapsRef.current) return;

    const { Map, Marker, Autocomplete } = googleMapsRef.current;

    const defaultCenter = position 
      ? { lat: position.lat, lng: position.lng }
      : { lat: 20.5937, lng: 78.9629 }; // India center

    const map = new Map(mapRef.current, {
      center: defaultCenter,
      zoom: position ? 15 : 5,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: 'DEMO_MAP_ID'
    });

    mapInstanceRef.current = map;

    // Add click listener to map
    map.addListener('click', (e) => {
      const clickedPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setPosition(clickedPos);
      updateMarker(clickedPos);
      reverseGeocode(clickedPos);
    });

    // Initialize autocomplete
    if (searchInputRef.current) {
      const autocomplete = new Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          toast.error('No details available for this location');
          return;
        }

        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        setPosition(newPos);
        setAddress(place.formatted_address || place.name);
        updateMarker(newPos);
        map.setCenter(newPos);
        map.setZoom(16);
        toast.success('Location selected!');
      });

      autocompleteRef.current = autocomplete;
    }

    // Add initial marker if position exists
    if (position) {
      updateMarker(position);
    }
  }, [mapLoaded]);

  const updateMarker = (pos) => {
    if (!mapInstanceRef.current) return;

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create new marker
    const marker = new window.google.maps.Marker({
      position: { lat: pos.lat, lng: pos.lng },
      map: mapInstanceRef.current,
      title: 'Selected Location',
      animation: window.google.maps.Animation.DROP,
    });

    markerRef.current = marker;
  };

  const reverseGeocode = async (pos) => {
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: pos.lat, lng: pos.lng } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          console.error('Geocoding failed:', status);
        }
      }
    );
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (location) => {
        const newPos = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setPosition(newPos);
        updateMarker(newPos);
        reverseGeocode(newPos);
        
        // Center map on current location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newPos);
          mapInstanceRef.current.setZoom(15);
        }
        
        setGettingLocation(false);
        toast.success('Location detected!');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location. Please search or click on the map.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    if (!position) {
      toast.error('Please select a location on the map');
      return;
    }
    
    const finalAddress = manualAddress.trim() || address;
    
    if (!finalAddress) {
      toast.error('Please enter your complete address');
      return;
    }
    
    onLocationSelect({
      latitude: position.lat,
      longitude: position.lng,
      address: finalAddress,
    });
  };

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading Google Maps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          How to set your delivery location:
        </p>
        <ol className="text-sm text-blue-800 space-y-1 ml-5 list-decimal">
          <li>Search for your area/residence using the search bar</li>
          <li>Or click on the map to select your location</li>
          <li>Or use "My Current Location" button</li>
          <li>Then add your complete address with flat/house details</li>
        </ol>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search: residence name, street, area, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Current Location Button */}
      <Button
        onClick={getCurrentLocation}
        disabled={gettingLocation}
        variant="outline"
        className="w-full"
      >
        {gettingLocation ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4 mr-2" />
        )}
        Use My Current Location
      </Button>

      {/* Map */}
      <div 
        ref={mapRef}
        className="rounded-lg overflow-hidden border border-gray-300 h-[400px] w-full"
      />

      {/* Selected Address Display */}
      {address && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-medium text-green-800">Location Selected:</p>
            <p className="text-sm text-green-700 mt-1">{address}</p>
          </div>

          {/* Manual Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Complete Address (Flat/House No, Building Name, Landmark) *
            </label>
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g., Flat 201, Sunrise Apartments, Near City Mall"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px] text-sm"
              rows="3"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add specific details so the delivery rider can find you easily
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!position || (!address && !manualAddress.trim())}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
        >
          Confirm Location & Address
        </Button>
        {showSkip && onSkip && (
          <Button onClick={onSkip} variant="outline">
            Skip for Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default GoogleLocationPicker;
