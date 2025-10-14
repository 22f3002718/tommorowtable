import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMapsLibrary } from '@/utils/googleMapsLoader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Clock, TrendingUp, User } from 'lucide-react';
import { toast } from 'sonner';
import { API } from '@/App';

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
];

const RouteOptimizationDialog = ({ 
  open, 
  onClose, 
  orders, 
  availableRiders,
  onConfirm 
}) => {
  const [numRiders, setNumRiders] = useState(1);
  const [maxOrdersPerRider, setMaxOrdersPerRider] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState(null);
  const [riderAssignments, setRiderAssignments] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    
    const loadMaps = async () => {
      try {
        await loadGoogleMapsLibrary('maps');
        setMapLoaded(true);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
      }
    };

    loadMaps();
  }, [open]);

  const handleOptimize = async () => {
    if (numRiders < 1 || numRiders > availableRiders.length) {
      toast.error(`Please select between 1 and ${availableRiders.length} riders`);
      return;
    }

    setOptimizing(true);
    setOptimizedRoutes(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API}/vendor/optimize-routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_ids: orders.map(o => o.id),
          num_riders: parseInt(numRiders),
          max_orders_per_rider: maxOrdersPerRider ? parseInt(maxOrdersPerRider) : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize routes');
      }

      const data = await response.json();
      setOptimizedRoutes(data);
      
      // Initialize rider assignments
      const assignments = {};
      data.routes.forEach((route, idx) => {
        assignments[idx] = '';
      });
      setRiderAssignments(assignments);
      
      toast.success(`Routes optimized for ${data.total_riders} riders!`);
      
      // Draw routes on map after a short delay
      setTimeout(() => {
        drawRoutesOnMap(data.routes);
      }, 100);
      
    } catch (error) {
      console.error('Optimization failed:', error);
      toast.error('Failed to optimize routes. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const drawRoutesOnMap = (routes) => {
    if (!mapLoaded || !mapRef.current || !routes || routes.length === 0) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    // Get all coordinates
    const allCoords = [];
    routes.forEach(route => {
      route.orders.forEach(order => {
        if (order.delivery_latitude && order.delivery_longitude) {
          allCoords.push({
            lat: order.delivery_latitude,
            lng: order.delivery_longitude
          });
        }
      });
    });

    if (allCoords.length === 0) return;

    // Create map centered on first coordinate
    const map = new window.google.maps.Map(mapRef.current, {
      center: allCoords[0],
      zoom: 12,
      mapTypeControl: true,
    });

    mapInstanceRef.current = map;

    // Draw each route with different color
    routes.forEach((route, routeIdx) => {
      const color = colors[routeIdx % colors.length];
      const path = route.orders.map(order => ({
        lat: order.delivery_latitude,
        lng: order.delivery_longitude
      }));

      // Draw polyline
      const routeLine = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      routeLine.setMap(map);

      // Add markers
      route.orders.forEach((order, orderIdx) => {
        const marker = new window.google.maps.Marker({
          position: {
            lat: order.delivery_latitude,
            lng: order.delivery_longitude
          },
          map: map,
          label: {
            text: `${routeIdx + 1}-${orderIdx + 1}`,
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          }
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>Route ${routeIdx + 1} - Stop ${orderIdx + 1}</strong><br/>
              Order: #${order.id.slice(0, 8)}<br/>
              Customer: ${order.customer_name}<br/>
              ${order.delivery_address}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    });

    // Fit bounds to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    allCoords.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds);
  };

  const handleConfirm = async () => {
    // Validate all routes have riders assigned
    const unassignedRoutes = Object.entries(riderAssignments).filter(([_, riderId]) => !riderId);
    if (unassignedRoutes.length > 0) {
      toast.error('Please assign a rider to each route');
      return;
    }

    setConfirming(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare routes data for batch assignment
      const routesData = optimizedRoutes.routes.map((route, idx) => ({
        rider_id: riderAssignments[idx],
        order_ids: route.order_ids
      }));
      
      const response = await fetch(`${API}/vendor/batch-assign-riders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ routes: routesData })
      });

      if (!response.ok) {
        throw new Error('Failed to assign riders');
      }

      const result = await response.json();
      toast.success(result.message);
      onConfirm();
      onClose();
      
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign riders. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Batch Route Optimization
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          {!optimizedRoutes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Configure Route Optimization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Riders *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={availableRiders.length}
                    value={numRiders}
                    onChange={(e) => setNumRiders(e.target.value)}
                    placeholder="Enter number of riders"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available riders: {availableRiders.length}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Orders per Rider (Optional)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={maxOrdersPerRider}
                    onChange={(e) => setMaxOrdersPerRider(e.target.value)}
                    placeholder="Leave empty for auto"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total orders to optimize: {orders.length}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleOptimize}
                disabled={optimizing || !numRiders}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing Routes...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Optimize Routes
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results Section */}
          {optimizedRoutes && (
            <>
              {/* Map */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Route Visualization</h3>
                {mapLoaded ? (
                  <div 
                    ref={mapRef}
                    className="rounded-lg overflow-hidden border border-gray-300 h-[400px] w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                    <span>Loading map...</span>
                  </div>
                )}
              </div>

              {/* Routes Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Optimized Routes - Assign Riders</h3>
                {optimizedRoutes.routes.map((route, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border-2 rounded-lg p-4"
                    style={{ borderColor: colors[idx % colors.length] }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg" style={{ color: colors[idx % colors.length] }}>
                          Route {route.rider_index}
                        </h4>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {route.order_ids.length} stops
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {route.total_distance_km} km
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            ~{route.estimated_duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className="w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Rider *
                        </label>
                        <Select 
                          value={riderAssignments[idx] || ''}
                          onValueChange={(value) => setRiderAssignments({
                            ...riderAssignments,
                            [idx]: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rider" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRiders.map((rider) => (
                              <SelectItem key={rider.id} value={rider.id}>
                                {rider.name} {rider.phone ? `(${rider.phone})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Orders in this route */}
                    <div className="bg-gray-50 rounded p-3 mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Orders in sequence:</p>
                      <div className="space-y-2">
                        {route.orders.map((order, orderIdx) => (
                          <div key={order.id} className="flex items-center text-sm">
                            <span 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2"
                              style={{ backgroundColor: colors[idx % colors.length] }}
                            >
                              {orderIdx + 1}
                            </span>
                            <span className="flex-1">
                              Order #{order.id.slice(0, 8)} - {order.customer_name}
                            </span>
                            <span className="text-gray-500">₹{order.total_amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setOptimizedRoutes(null);
                    setRiderAssignments({});
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Re-optimize
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirming || Object.values(riderAssignments).some(v => !v)}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Confirm & Assign Riders
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteOptimizationDialog;
