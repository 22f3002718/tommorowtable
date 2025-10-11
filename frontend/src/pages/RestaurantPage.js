import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, Plus, Minus, Clock, Star, MapPin } from 'lucide-react';
import GoogleLocationPicker from '@/components/GoogleLocationPicker';

const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        axios.get(`${API}/restaurants/${id}`),
        axios.get(`${API}/restaurants/${id}/menu`)
      ]);
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Failed to fetch restaurant data:', error);
      toast.error('Failed to load restaurant');
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(ci => ci.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(ci => 
        ci.menu_item_id === item.id 
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === menuItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(item => item.menu_item_id !== menuItemId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleLocationSelect = async (locationData) => {
    setDeliveryAddress(locationData.address);
    setDeliveryLatitude(locationData.latitude);
    setDeliveryLongitude(locationData.longitude);
    setLocationSelected(true);
    setShowLocationPicker(false);
    
    // Save location to user profile
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch(
          `${API}/auth/update-location`,
          {
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleCheckout = async () => {
    if (!auth?.user) {
      toast.error('Please login to place an order');
      navigate('/');
      return;
    }

    if (!locationSelected) {
      setShowLocationPicker(true);
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please select delivery location');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        restaurant_id: id,
        items: cart,
        delivery_address: deliveryAddress,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        special_instructions: specialInstructions
      };

      await axios.post(`${API}/orders`, orderData);
      toast.success('Order placed successfully! Will be delivered tomorrow morning.');
      setCart([]);
      setShowCheckout(false);
      setLocationSelected(false);
      setDeliveryAddress('');
      setDeliveryLatitude(null);
      setDeliveryLongitude(null);
      navigate('/orders');
    } catch (error) {
      console.error('Order failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-btn">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            
            {cart.length > 0 && (
              <Button 
                onClick={() => setShowCheckout(true)} 
                className="bg-orange-500 hover:bg-orange-600 relative"
                data-testid="view-cart-btn"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                View Cart
                <span className="cart-badge">{cart.length}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Restaurant Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {restaurant.image_url ? (
                <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingCart className="w-16 h-16 text-orange-400" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                </div>
                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg font-medium">
                  {restaurant.cuisine}
                </span>
                <div className="flex items-center text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{restaurant.delivery_time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Menu</h2>
        
        {Object.keys(groupedMenu).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <p className="text-xl text-gray-500">No menu items available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category} className="animate-fade-in">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 capitalize">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((item) => {
                    const cartItem = cart.find(ci => ci.menu_item_id === item.id);
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-200"
                        data-testid={`menu-item-${item.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            <p className="text-xl font-bold text-orange-500">₹{item.price.toFixed(2)}</p>
                          </div>
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-20 h-20 rounded-lg object-cover ml-4"
                            />
                          )}
                        </div>
                        
                        {cartItem ? (
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 p-0"
                                data-testid={`decrease-qty-${item.id}`}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-semibold w-8 text-center">{cartItem.quantity}</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 p-0"
                                data-testid={`increase-qty-${item.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeFromCart(item.id)}
                              data-testid={`remove-item-${item.id}`}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => addToCart(item)} 
                            className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                            data-testid={`add-to-cart-${item.id}`}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-lg" data-testid="checkout-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Complete Your Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Cart Summary */}
            <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-orange-500">₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-3">
              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location *</label>
                {locationSelected ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center text-green-800 mb-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="font-medium text-sm">Selected Location:</span>
                        </div>
                        <p className="text-sm text-green-700">{deliveryAddress}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowLocationPicker(true)}
                        className="ml-2"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowLocationPicker(true)}
                    variant="outline"
                    className="w-full border-2 border-dashed border-gray-300 hover:border-orange-500 h-12"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Select Delivery Location
                  </Button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <Input
                  placeholder="Any special requests?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  data-testid="special-instructions-input"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center text-orange-700">
                  <Clock className="w-5 h-5 mr-2" />
                  <p className="text-sm font-medium">Delivery tomorrow morning between 7-11 AM</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCheckout} 
              className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg font-semibold"
              disabled={loading}
              data-testid="place-order-btn"
            >
              {loading ? 'Placing Order...' : locationSelected ? `Place Order - ₹${getTotalAmount().toFixed(2)}` : 'Continue to Place Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Picker Dialog */}
      <Dialog open={showLocationPicker} onOpenChange={setShowLocationPicker}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select Delivery Location</DialogTitle>
          </DialogHeader>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={deliveryLatitude && deliveryLongitude ? { lat: deliveryLatitude, lng: deliveryLongitude } : null}
            showSkip={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantPage;