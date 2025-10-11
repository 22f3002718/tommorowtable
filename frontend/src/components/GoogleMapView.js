import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const GoogleMapView = ({ latitude, longitude, address, showRoute = false, riderLocation = null }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    loader.load().then(() => {
      setMapLoaded(true);
    }).catch(err => {
      console.error('Error loading Google Maps:', err);
      toast.error('Failed to load Google Maps');
    });
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !latitude || !longitude) return;

    const customerLocation = { lat: latitude, lng: longitude };

    const map = new window.google.maps.Map(mapRef.current, {
      center: customerLocation,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    // Add customer marker
    const customerMarker = new window.google.maps.Marker({
      position: customerLocation,
      map: map,
      title: 'Customer Location',
      label: {
        text: 'C',
        color: 'white',
        fontWeight: 'bold'
      },
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      }
    });

    // Add info window for customer
    const customerInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">Delivery Location</h3>
          <p style="margin: 0; font-size: 13px;">${address || 'Customer Address'}</p>
        </div>
      `
    });

    customerMarker.addListener('click', () => {
      customerInfoWindow.open(map, customerMarker);
    });

    // Show customer info by default
    customerInfoWindow.open(map, customerMarker);

    // If rider location is provided and showRoute is true, show route
    if (showRoute && riderLocation) {
      const riderPos = { lat: riderLocation.lat, lng: riderLocation.lng };
      
      // Add rider marker
      const riderMarker = new window.google.maps.Marker({
        position: riderPos,
        map: map,
        title: 'Rider Location',
        label: {
          text: 'R',
          color: 'white',
          fontWeight: 'bold'
        },
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });

      // Draw route between rider and customer
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // We already have custom markers
      });

      directionsService.route(
        {
          origin: riderPos,
          destination: customerLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          }
        }
      );

      // Adjust bounds to show both markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(customerLocation);
      bounds.extend(riderPos);
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
