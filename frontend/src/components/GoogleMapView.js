import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsLibrary } from '@/utils/googleMapsLoader';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GoogleMapView = ({ latitude, longitude, address, showRoute = false, riderLocation = null }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const loadMaps = async () => {
      try {
        await loadGoogleMapsLibrary('maps');
        await loadGoogleMapsLibrary('routes');
        setMapLoaded(true);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        toast.error('Failed to load Google Maps');
      }
    };

    loadMaps();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !latitude || !longitude || !googleMapsRef.current) return;

    const { Map, Marker, DirectionsService, DirectionsRenderer } = googleMapsRef.current;

    const customerLocation = { lat: latitude, lng: longitude };

    const map = new Map(mapRef.current, {
      center: customerLocation,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      mapId: 'DEMO_MAP_ID'
    });

    mapInstanceRef.current = map;

    // Add customer marker
    const customerMarker = new Marker({
      position: customerLocation,
      map: map,
      title: 'Customer Location',
    });

    // Add info window for customer (Note: InfoWindow needs to be imported from core library)
    const infoContent = document.createElement('div');
    infoContent.style.padding = '8px';
    infoContent.innerHTML = `
      <h3 style="font-weight: bold; margin-bottom: 4px;">Delivery Location</h3>
      <p style="margin: 0; font-size: 13px;">${address || 'Customer Address'}</p>
    `;

    // If rider location is provided and showRoute is true, show route
    if (showRoute && riderLocation) {
      const riderPos = { lat: riderLocation.lat, lng: riderLocation.lng };
      
      // Add rider marker
      const riderMarker = new Marker({
        position: riderPos,
        map: map,
        title: 'Rider Location',
      });

      // Draw route between rider and customer
      const directionsService = new DirectionsService();
      const directionsRenderer = new DirectionsRenderer({
        map: map,
        suppressMarkers: true, // We already have custom markers
      });

      directionsService.route(
        {
          origin: riderPos,
          destination: customerLocation,
          travelMode: 'DRIVING',
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          }
        }
      );

      // Adjust bounds to show both markers
      const bounds = {
        north: Math.max(customerLocation.lat, riderPos.lat) + 0.01,
        south: Math.min(customerLocation.lat, riderPos.lat) - 0.01,
        east: Math.max(customerLocation.lng, riderPos.lng) + 0.01,
        west: Math.min(customerLocation.lng, riderPos.lng) - 0.01,
      };
      map.fitBounds(bounds);
    }
  }, [mapLoaded, latitude, longitude, address, showRoute, riderLocation]);

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading map...</span>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No location data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        ref={mapRef}
        className="rounded-lg overflow-hidden border border-gray-300 h-64 w-full"
      />
      {address && (
        <p className="text-sm text-gray-600 text-center">
          📍 {address}
        </p>
      )}
    </div>
  );
};

export default GoogleMapView;
