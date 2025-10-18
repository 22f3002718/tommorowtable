import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { toast } from 'sonner';
import GoogleLocationPicker from './GoogleLocationPicker';

const FloatingCartButton = () => {
  const { cart, getCartTotal, getCartCount, getCartByVendor, addToCart, removeFromCart, clearCart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const DELIVERY_FEE = 11.0;

  if (getCartCount() === 0) {
    return null; // Don't show button if cart is empty
  }

  const handleLocationSelected = (address, lat, lng) => {
    setDeliveryAddress(address);
    setDeliveryLatitude(lat);
    setDeliveryLongitude(lng);
    setShowLocationPicker(false);
  };

  const handleCheckout = async () => {
    if (!auth?.user) {
      toast.error('Please login to place order');
      navigate('/');
      return;
    }

    if (!deliveryAddress) {
      setShowLocationPicker(true);
      return;
    }

    try {
      setIsProcessing(true);

      // Check wallet balance
      const userRes = await axios.get(`${API}/auth/me`);
      const walletBalance = userRes.data.wallet_balance || 0;
      const cartTotal = getCartTotal();
      const totalAmount = cartTotal + DELIVERY_FEE;

      if (walletBalance < totalAmount) {
        toast.error(
          `Insufficient wallet balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${walletBalance.toFixed(2)}`,
          { duration: 5000 }
        );
        setIsProcessing(false);
        return;
      }

      // Group orders by vendor
      const vendorGroups = getCartByVendor();
      
      // Generate unique cart ID
      const cartId = `CART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare multi-vendor order
      const orders = vendorGroups.map(group => ({
        restaurant_id: group.restaurant_id,
        items: group.items.map(item => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        delivery_address: deliveryAddress,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        special_instructions: '',
        cart_id: cartId
      }));

      // Place multi-vendor order
      const response = await axios.post(`${API}/orders/multi-vendor`, {
        orders: orders,
        delivery_fee: DELIVERY_FEE,
        cart_id: cartId
      });

      toast.success(`${response.data.message}! Total: ₹${response.data.total_amount.toFixed(2)}`);
      clearCart();
      setShowCheckout(false);
      setShowCart(false);
      navigate('/orders');
    } catch (error) {
      console.error('Order failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  const vendorGroups = getCartByVendor();
  const cartTotal = getCartTotal();
  const totalAmount = cartTotal + DELIVERY_FEE;

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setShowCart(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3 px-6 py-4"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-white text-green-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {getCartCount()}
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs opacity-90">View Cart</p>
            <p className="font-bold">₹{cartTotal.toFixed(2)}</p>
          </div>
        </button>
      </div>

      {/* Cart View Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-2xl font-bold">Your Cart ({getCartCount()} items)</span>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cart Items grouped by vendor */}
            {vendorGroups.map((group, idx) => (
              <div key={group.restaurant_id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900">{group.restaurant_name}</h3>
                </div>
                
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={`${item.restaurant_id}-${item.menu_item_id}`} className="flex items-center justify-between bg-white p-3 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">₹{item.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.menu_item_id, item.restaurant_id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart({ id: item.menu_item_id, name: item.name, price: item.price }, item.restaurant_id, item.restaurant_name)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        
                        <p className="font-bold text-green-700 min-w-[80px] text-right">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery Fee</span>
                <span>₹{DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span className="text-green-700">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearCart();
                  setShowCart(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => {
                  setShowCart(false);
                  setShowCheckout(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{getCartCount()} items from {vendorGroups.length} restaurant(s)</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{DELIVERY_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-700">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Delivery Address</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={deliveryAddress}
                  readOnly
                  placeholder="Select location on map"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full"
                >
                  {deliveryAddress ? 'Change Location' : 'Select Location'}
                </Button>
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={handleCheckout}
              disabled={isProcessing || !deliveryAddress}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isProcessing ? 'Processing...' : `Place Order - ₹${totalAmount.toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Picker Dialog */}
      <Dialog open={showLocationPicker} onOpenChange={setShowLocationPicker}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Delivery Location</DialogTitle>
          </DialogHeader>
          <GoogleLocationPicker onLocationSelected={handleLocationSelected} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingCartButton;
