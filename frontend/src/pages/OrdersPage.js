import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Package, Clock, MapPin, Star } from 'lucide-react';

const OrdersPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth?.user) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [auth]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const submitRating = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/orders/${selectedOrder.id}/rating`, {
        rating,
        review
      });
      toast.success('Thank you for your feedback!');
      setShowRating(false);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit rating');
    } finally {
      setLoading(false);
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

  const getStatusText = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-to-home-btn">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">No orders yet</p>
            <p className="text-gray-400 mb-6">Start ordering your favorite meals!</p>
            <Link to="/">
              <Button className="bg-orange-500 hover:bg-orange-600">Browse Restaurants</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-6 animate-fade-in"
                data-testid={`order-${order.id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{order.restaurant_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{order.delivery_slot}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.placed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Order Items:</p>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.name}</span>
                        <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.special_instructions && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Special Instructions:</p>
                    <p className="text-sm text-gray-600 italic">{order.special_instructions}</p>
                  </div>
                )}

                {/* Rating Section */}
                {order.status === 'delivered' && (
                  <div className="border-t pt-4">
                    {order.rating ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < order.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        {order.review && (
                          <p className="text-sm text-gray-600 italic">"({order.review})"</p>
                        )}
                      </div>
                    ) : (
                      <Button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRating(true);
                          setRating(5);
                          setReview('');
                        }}
                        variant="outline"
                        size="sm"
                        className="border-orange-500 text-orange-500 hover:bg-orange-50"
                        data-testid={`rate-order-${order.id}`}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Rate this order
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-md" data-testid="rating-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Rate Your Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">How was your experience?</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    data-testid={`star-${star}`}
                  >
                    <Star 
                      className={`w-10 h-10 cursor-pointer transition-colors ${
                        star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review (optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-testid="review-textarea"
              />
            </div>

            <Button 
              onClick={submitRating}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading}
              data-testid="submit-rating-btn"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;