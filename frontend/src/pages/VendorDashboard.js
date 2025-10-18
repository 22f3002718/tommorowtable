import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Package, CheckCircle, Clock, User, Plus, Trash2, Edit, Bike, TrendingUp, DollarSign, ShoppingBag, Download, CheckSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RouteOptimizationDialog from '@/components/RouteOptimizationDialog';
import StatsCard from '@/components/StatsCard';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [selectedRiders, setSelectedRiders] = useState({});
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  
  // New item form states
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    available_count: ''
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
      const [ordersRes, restaurantRes, menuRes, ridersRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/vendor/restaurant`),
        axios.get(`${API}/vendor/menu`),
        axios.get(`${API}/riders/available`)
      ]);
      setOrders(ordersRes.data);
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
      setAvailableRiders(ridersRes.data);
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

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      const itemData = {
        ...newItem,
        price: parseFloat(newItem.price)
      };
      
      // Add available_count only if it's provided
      if (newItem.available_count !== '') {
        itemData.available_count = parseInt(newItem.available_count);
      }
      
      await axios.post(`${API}/restaurants/${restaurant.id}/menu`, itemData);
      toast.success('Menu item added successfully');
      setShowAddItem(false);
      setNewItem({ name: '', description: '', price: '', category: '', image_url: '', available_count: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await axios.delete(`${API}/menu-items/${itemId}`);
      toast.success('Menu item deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      const response = await axios.patch(`${API}/menu-items/${itemId}/availability`);
      toast.success(response.data.is_available ? 'Item is now available' : 'Item marked as out of stock');
      fetchData();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    if (!riderId) {
      toast.error('Please select a rider');
      return;
    }
    
    setLoading({ ...loading, [orderId]: true });
    try {
      await axios.patch(`${API}/orders/${orderId}/assign-rider`, { rider_id: riderId });
      toast.success('Rider assigned successfully');
      fetchData();
      setSelectedRiders({ ...selectedRiders, [orderId]: '' });
    } catch (error) {
      toast.error('Failed to assign rider');
      console.error(error);
    } finally {
      setLoading({ ...loading, [orderId]: false });
    }
  };

  const handleMarkAllReady = async () => {
    if (!confirm('Mark all pending orders as ready?')) return;
    
    try {
      const response = await axios.post(`${API}/vendor/mark-all-ready`);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error('Failed to mark orders as ready');
      console.error(error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await axios.get(`${API}/vendor/orders/ready/csv`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ready_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV downloaded successfully');
    } catch (error) {
      toast.error('Failed to download CSV');
      console.error(error);
    }
  };

  const handleUpdateStock = async (itemId, count) => {
    try {
      await axios.patch(`${API}/menu-items/${itemId}/stock`, { available_count: count });
      toast.success('Stock updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update stock');
      console.error(error);
    }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            icon={ShoppingBag}
            label="Total Orders"
            value={orders.length}
            color="blue"
          />
          <StatsCard 
            icon={Clock}
            label="Pending"
            value={pendingOrders.length}
            color="orange"
          />
          <StatsCard 
            icon={Package}
            label="Active"
            value={activeOrders.length}
            color="purple"
          />
          <StatsCard 
            icon={CheckCircle}
            label="Menu Items"
            value={menuItems.length}
            color="green"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders" data-testid="orders-tab">Orders</TabsTrigger>
            <TabsTrigger value="menu" data-testid="menu-tab">Menu Management</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">

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
                        <p className="text-xl font-bold text-orange-500">₹{order.total_amount.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-2">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
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

          {/* Route Optimization Button - Show when all orders are ready */}
          {activeOrders.filter(o => o.status === 'ready').length > 1 && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-orange-500" />
                    All Orders Ready for Delivery!
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You have {activeOrders.filter(o => o.status === 'ready').length} orders ready. 
                    Optimize delivery routes to save time and assign multiple orders to riders efficiently.
                  </p>
                  <Button
                    onClick={() => setShowRouteOptimization(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={availableRiders.length === 0}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Batch & Route Optimize
                  </Button>
                  {availableRiders.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      No riders available. Please ensure riders are registered.
                    </p>
                  )}
                </div>
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
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-700 font-medium flex items-center">
                            <Bike className="w-4 h-4 mr-2" />
                            Assign Rider for Delivery
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select 
                            value={selectedRiders[order.id] || ''}
                            onValueChange={(value) => setSelectedRiders({ ...selectedRiders, [order.id]: value })}
                          >
                            <SelectTrigger className="flex-1" data-testid={`rider-select-${order.id}`}>
                              <SelectValue placeholder="Select a rider" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRiders.length === 0 ? (
                                <SelectItem value="no-riders" disabled>No available riders</SelectItem>
                              ) : (
                                availableRiders.map((rider) => (
                                  <SelectItem key={rider.id} value={rider.id}>
                                    {rider.name} {rider.phone ? `(${rider.phone})` : ''}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => handleAssignRider(order.id, selectedRiders[order.id])}
                            className="bg-blue-500 hover:bg-blue-600"
                            disabled={loading[order.id] || !selectedRiders[order.id] || availableRiders.length === 0}
                            data-testid={`assign-rider-btn-${order.id}`}
                          >
                            Assign
                          </Button>
                        </div>
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
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu">
            <div className="space-y-6">
              {/* Add Menu Item Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                <Button 
                  onClick={() => setShowAddItem(true)}
                  className="bg-green-500 hover:bg-green-600"
                  data-testid="add-menu-item-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xl font-bold text-green-600">₹{item.price}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {item.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.is_available 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.is_available ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleToggleAvailability(item.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State for Menu */}
              {menuItems.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500">No menu items yet</p>
                  <Button 
                    onClick={() => setShowAddItem(true)}
                    className="mt-4 bg-green-500 hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Item
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Menu Item Dialog */}
        <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <Input
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                required
              />
              <Input
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                required
              />
              <Input
                placeholder="Category"
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                required
              />
              <Input
                placeholder="Image URL (optional)"
                value={newItem.image_url}
                onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
              />
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
                  Add Item
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddItem(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Route Optimization Dialog */}
        <RouteOptimizationDialog
          open={showRouteOptimization}
          onClose={() => setShowRouteOptimization(false)}
          orders={activeOrders.filter(o => o.status === 'ready')}
          availableRiders={availableRiders}
          onConfirm={() => {
            fetchData();
            setShowRouteOptimization(false);
          }}
        />
      </div>
    </div>
  );
};

export default VendorDashboard;