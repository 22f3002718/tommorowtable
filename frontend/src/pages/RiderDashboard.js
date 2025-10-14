import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Package, MapPin, User, Navigation, CheckCircle } from 'lucide-react';
import GoogleMapView from '@/components/GoogleMapView';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!auth?.user || auth.user.role !== 'rider') {
      toast.error('Access denied');
      navigate('/');
      return;
    }
    fetchOrders();
  }, [auth]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      // Filter orders that are ready for delivery or assigned to rider
      const deliveryOrders = response.data.filter(o => 
        o.status === 'ready' || 
        (o.rider_id === auth.user.id && ['out-for-delivery', 'delivered'].includes(o.status))
      );
      setOrders(deliveryOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading({ ...loading, [orderId]: true });
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setLoading({ ...loading, [orderId]: false });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-green-100 text-green-700',
      'out-for-delivery': 'bg-teal-100 text-teal-700',
      delivered: 'bg-green-200 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const readyOrders = orders.filter(o => o.status === 'ready');
  const activeDeliveries = orders.filter(o => o.status === 'out-for-delivery');
  const completedDeliveries = orders.filter(o => o.status === 'delivered');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Rider Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">{auth?.user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-xl shadow-md p-6">
            <p className="text-sm text-green-700 mb-1">Ready for Pickup</p>
            <p className="text-3xl font-bold text-green-600">{readyOrders.length}</p>
          </div>
          <div className="bg-teal-50 rounded-xl shadow-md p-6">
            <p className="text-sm text-teal-700 mb-1">Out for Delivery</p>
            <p className="text-3xl font-bold text-teal-600">{activeDeliveries.length}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-6">
            <p className="text-sm text-blue-700 mb-1">Delivered Today</p>
            <p className="text-3xl font-bold text-blue-600">{completedDeliveries.length}</p>
          </div>
        </div>

        {/* Ready for Pickup */}
        {readyOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready for Pickup</h2>
            <div className="space-y-4">
              {readyOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500"
                  data-testid={`ready-order-${order.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{order.restaurant_name}</h3>
                      <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-500">₹{order.total_amount.toFixed(2)}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(order.status)}`}>
                        READY
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => updateOrderStatus(order.id, 'out-for-delivery')}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                    disabled={loading[order.id]}
                    data-testid={`pickup-order-${order.id}`}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Pick Up & Start Delivery
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Deliveries</h2>
            <div className="space-y-4">
              {activeDeliveries.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500"
                  data-testid={`active-delivery-${order.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{order.customer_name}</h3>
                      <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
                      <div className="flex items-center text-sm text-gray-900 font-medium mt-2">
                        <MapPin className="w-4 h-4 mr-1 text-teal-500" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      OUT FOR DELIVERY
                    </span>
                  </div>

                  {/* Customer Location Map */}
                  {order.delivery_latitude && order.delivery_longitude && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Customer Location:</p>
                      <GoogleMapView
                        latitude={order.delivery_latitude}
                        longitude={order.delivery_longitude}
                        address={order.delivery_address}
                        height="250px"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <a 
                      href={order.delivery_latitude && order.delivery_longitude 
                        ? `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_latitude},${order.delivery_longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                      data-testid={`navigate-${order.id}`}
                    >
                      <Button 
                        variant="outline"
                        className="w-full border-teal-500 text-teal-600 hover:bg-teal-50"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate to Location
                      </Button>
                    </a>
                    
                    <Button 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="w-full bg-green-500 hover:bg-green-600"
                      disabled={loading[order.id]}
                      data-testid={`mark-delivered-${order.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Deliveries */}
        {completedDeliveries.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed Deliveries</h2>
            <div className="space-y-4">
              {completedDeliveries.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-md p-6 opacity-75"
                  data-testid={`completed-delivery-${order.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.customer_name}</h3>
                      <p className="text-sm text-gray-600">{order.delivery_address}</p>
                    </div>
                    <div className="text-right">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <p className="text-xs text-gray-500 mt-1">Delivered</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No deliveries available</p>
            <p className="text-gray-400 mt-2">Check back during morning delivery hours (7-11 AM)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;