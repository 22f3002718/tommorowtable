import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  ) : null;
}

const LocationPicker = ({ onLocationSelect, initialLocation, showSkip = true, onSkip }) => {
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const mapRef = useRef(null);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Forward geocode - search for address
  const searchAddress = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setPosition(newPos);
        setAddress(result.display_name);
        
        // Pan map to the new location
        if (mapRef.current) {
          mapRef.current.flyTo([newPos.lat, newPos.lng], 15);
        }
        toast.success('Location found!');
      } else {
        toast.error('Location not found. Try a different search.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Get current location from browser
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
        
        // Pan map to current location
        if (mapRef.current) {
          mapRef.current.flyTo([newPos.lat, newPos.lng], 15);
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

  // Update address when position changes (from map click)
  useEffect(() => {
    if (position && !address) {
      reverseGeocode(position.lat, position.lng);
    }
  }, [position]);

  const handleConfirm = () => {
    if (!position) {
      toast.error('Please select a location');
      return;
    }
    if (!address) {
      toast.error('Please wait while we fetch the address');
      return;
    }
    onLocationSelect({
      latitude: position.lat,
      longitude: position.lng,
      address: address,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <MapPin className="inline w-4 h-4 mr-1" />
          Select your delivery location by clicking on the map, searching for an address, or using your current location.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for your address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={searchAddress} 
          disabled={searching}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
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
      <div className="rounded-lg overflow-hidden border border-gray-300 h-[400px]">
        <MapContainer
          center={position ? [position.lat, position.lng] : [20.5937, 78.9629]} // Default to India center
          zoom={position ? 15 : 5}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>

      {/* Selected Address Display */}
      {address && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800">Selected Address:</p>
          <p className="text-sm text-green-700 mt-1">{address}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!position || !address}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
        >
          Confirm Location
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

export default LocationPicker;
