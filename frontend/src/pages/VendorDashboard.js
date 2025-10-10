import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Package, CheckCircle, Clock, User, Plus, Trash2, Edit } from 'lucide-react';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState({});
  const [showAddItem, setShowAddItem] = useState(false);
  
  // New item form states
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: ''
  });

  useEffect(() => {
    if (!auth?.user || auth.user.role !== 'vendor') {
      toast.error('Access denied');
      navigate('/');
      return;
    }
    fetchData();
  }, [auth]);

  const fetchData = async () => {
    try {
      const [ordersRes, restaurantsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/restaurants`)
      ]);
      setOrders(ordersRes.data);
      setRestaurants(restaurantsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading({ ...loading, [orderId]: true });
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setLoading({ ...loading, [orderId]: false });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-purple-100 text-purple-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-green-100 text-green-700',
      'out-for-delivery': 'bg-teal-100 text-teal-700',
      delivered: 'bg-green-200 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const pendingOrders = orders.filter(o => ['placed', 'confirmed'].includes(o.status));
  const activeOrders = orders.filter(o => ['preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['out-for-delivery', 'delivered'].includes(o.status));

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
              <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-md p-6">
            <p className="text-sm text-orange-700 mb-1">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-md p-6">
            <p className="text-sm text-blue-700 mb-1">Active</p>
            <p className="text-3xl font-bold text-blue-600">{activeOrders.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md p-6">
            <p className="text-sm text-green-700 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedOrders.length}</p>
          </div>
        </div>

        {/* Orders Sections */}
        <div className="space-y-8">
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Orders</h2>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500"
                    data-testid={`pending-order-${order.id}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.delivery_address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-orange-500">${order.total_amount.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-2">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {order.status === 'placed' && (
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          disabled={loading[order.id]}
                          data-testid={`confirm-order-${order.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Order
                        </Button>
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          variant="destructive"
                          className="flex-1"
                          disabled={loading[order.id]}
                          data-testid={`cancel-order-${order.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {order.status === 'confirmed' && (
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        disabled={loading[order.id]}
                        data-testid={`start-preparing-${order.id}`}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Start Preparing
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Orders</h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500"
                    data-testid={`active-order-${order.id}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    {order.status === 'preparing' && (
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="w-full bg-green-500 hover:bg-green-600"
                        disabled={loading[order.id]}
                        data-testid={`mark-ready-${order.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Ready
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 font-medium">Order is ready for pickup by rider</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No orders yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;