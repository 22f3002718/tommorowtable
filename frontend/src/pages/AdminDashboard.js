import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Package, Store, Bike, Users, TrendingUp, Wallet, UserCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [riders, setRiders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({});
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState('');

  useEffect(() => {
    if (!auth?.user || auth.user.role !== 'admin') {
      toast.error('Access denied');
      navigate('/');
      return;
    }
    fetchData();
  }, [auth]);

  const fetchData = async () => {
    try {
      const [ordersRes, restaurantsRes, customersRes, vendorsRes, ridersRes, statsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/restaurants`),
        axios.get(`${API}/admin/customers`),
        axios.get(`${API}/admin/vendors`),
        axios.get(`${API}/admin/riders`),
        axios.get(`${API}/admin/stats`)
      ]);
      setOrders(ordersRes.data);
      setRestaurants(restaurantsRes.data);
      setCustomers(customersRes.data);
      setVendors(vendorsRes.data);
      setRiders(ridersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading({ ...loading, [orderId]: true });
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setLoading({ ...loading, [orderId]: false });
    }
  };

  const handleAddMoney = async () => {
    if (!selectedCustomer || !amountToAdd || parseFloat(amountToAdd) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await axios.post(`${API}/admin/add-wallet-money`, {
        user_id: selectedCustomer.id,
        amount: parseFloat(amountToAdd),
        description: `Admin credit by ${auth?.user?.name}`
      });
      
      toast.success(`₹${amountToAdd} added to ${selectedCustomer.name}'s wallet`);
      setShowAddMoneyDialog(false);
      setSelectedCustomer(null);
      setAmountToAdd('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add money');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-purple-100 text-purple-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-green-100 text-green-700',
      'out-for-delivery': 'bg-teal-100 text-teal-700',
      delivered: 'bg-green-200 text-green-800',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const totalRevenue = stats?.revenue?.total_revenue || 0;
  const statusGroups = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">{auth?.user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-2xl font-bold">₹{totalRevenue.toFixed(0)}</span>
            </div>
            <p className="text-sm opacity-90">Total Revenue</p>
            <p className="text-xs opacity-75 mt-1">Avg: ₹{stats?.revenue?.average_order_value?.toFixed(0) || 0}/order</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.orders?.total_orders || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-xs text-gray-500 mt-1">{stats?.orders?.delivered_orders || 0} delivered</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <UserCircle className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.users?.total_customers || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Total Customers</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.restaurants?.active_restaurants || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Active Restaurants</p>
            <p className="text-xs text-gray-500 mt-1">{stats?.restaurants?.total_restaurants || 0} total</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-indigo-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.users?.total_vendors || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Vendors</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Bike className="w-8 h-8 text-teal-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.users?.total_riders || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Riders</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.orders?.active_orders || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Active Orders</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">{stats?.orders?.cancelled_orders || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Cancelled Orders</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="orders" data-testid="orders-tab">Orders</TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="restaurants-tab">Restaurants</TabsTrigger>
            <TabsTrigger value="customers" data-testid="customers-tab">Customers</TabsTrigger>
            <TabsTrigger value="vendors" data-testid="vendors-tab">Vendors</TabsTrigger>
            <TabsTrigger value="riders" data-testid="riders-tab">Riders</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
              </div>
              
              <div className="divide-y">
                {orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-6 hover:bg-gray-50"
                      data-testid={`admin-order-${order.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">#{order.id.slice(0, 8)}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Customer: <span className="font-medium text-gray-900">{order.customer_name}</span></p>
                              <p className="text-gray-600">Restaurant: <span className="font-medium text-gray-900">{order.restaurant_name}</span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Delivery Slot: <span className="font-medium text-gray-900">{order.delivery_slot}</span></p>
                              <p className="text-gray-600">Address: <span className="font-medium text-gray-900">{order.delivery_address}</span></p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <p className="text-2xl font-bold text-orange-500">₹{order.total_amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.placed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="flex space-x-2 mt-4">
                          <select
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={loading[order.id]}
                            data-testid={`status-select-${order.id}`}
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="out-for-delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants">
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
              </div>
              
              <div className="divide-y">
                {restaurants.length === 0 ? (
                  <div className="p-12 text-center">
                    <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No restaurants yet</p>
                  </div>
                ) : (
                  restaurants.map((restaurant) => (
                    <div 
                      key={restaurant.id} 
                      className="p-6 hover:bg-gray-50"
                      data-testid={`restaurant-${restaurant.id}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-200 to-red-200 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{restaurant.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg font-medium">
                              {restaurant.cuisine}
                            </span>
                            <span className="text-gray-600">Rating: {restaurant.rating.toFixed(1)} ⭐</span>
                            <span className={`px-2 py-1 rounded ${restaurant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;