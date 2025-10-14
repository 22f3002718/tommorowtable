import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ShoppingCart, Search, Clock, Star, MapPin, User, LogOut, Utensils, TrendingUp, Award, Zap } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const HomePage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  
  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API}/restaurants`);
      setRestaurants(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      toast.error('Failed to load restaurants');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const data = authMode === 'login' 
        ? { email, password }
        : { email, password, name, phone, role };

      const response = await axios.post(`${API}${endpoint}`, data);
      auth.login(response.data.token, response.data.user);
      toast.success(`Welcome ${response.data.user.name}!`);
      setShowAuth(false);
      
      // Navigate based on role
      if (response.data.user.role === 'vendor') {
        navigate('/vendor');
      } else if (response.data.user.role === 'rider') {
        navigate('/rider');
      } else if (response.data.user.role === 'admin') {
        navigate('/admin');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">localtokri</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Fresh breakfast delivered</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              {auth?.user ? (
                <>
                  {auth.user.role === 'customer' && (
                    <Link to="/orders">
                      <Button variant="ghost" size="sm" className="text-gray-700 hover:text-orange-500" data-testid="my-orders-btn">
                        My Orders
                      </Button>
                    </Link>
                  )}
                  {auth.user.role === 'vendor' && (
                    <Link to="/vendor">
                      <Button variant="outline" size="sm" data-testid="vendor-dashboard-btn">Vendor Dashboard</Button>
                    </Link>
                  )}
                  {auth.user.role === 'rider' && (
                    <Link to="/rider">
                      <Button variant="outline" size="sm" data-testid="rider-dashboard-btn">Rider Dashboard</Button>
                    </Link>
                  )}
                  {auth.user.role === 'admin' && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" data-testid="admin-dashboard-btn">Admin Dashboard</Button>
                    </Link>
                  )}
                  <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{auth.user.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={auth.logout} className="text-gray-600" data-testid="logout-btn">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowAuth(true)} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" data-testid="login-btn">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-3">
              Fresh Breakfast 
              <span className="block">Delivered Tomorrow</span>
            </h2>
            <p className="text-white/90 mb-6 text-sm md:text-base">
              Order before midnight • Delivery 7-11 AM
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Input
                type="text"
                placeholder="Search for restaurants or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 md:h-14 text-base bg-white border-0 shadow-xl rounded-xl focus:ring-2 focus:ring-white"
                data-testid="search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
            </div>
            <p className="text-xs md:text-sm font-semibold text-gray-900">Fast Delivery</p>
            <p className="text-xs text-gray-500 mt-1 hidden md:block">7-11 AM</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            </div>
            <p className="text-xs md:text-sm font-semibold text-gray-900">Fresh Food</p>
            <p className="text-xs text-gray-500 mt-1 hidden md:block">Quality First</p>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-md text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <p className="text-xs md:text-sm font-semibold text-gray-900">Top Rated</p>
            <p className="text-xs text-gray-500 mt-1 hidden md:block">Best Quality</p>
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Available Restaurants</h3>
        
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No restaurants found</p>
            <p className="text-gray-400 mt-2">Try a different search term or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRestaurants.map((restaurant) => (
              <Link 
                key={restaurant.id} 
                to={`/restaurant/${restaurant.id}`}
                className="restaurant-card"
                data-testid={`restaurant-card-${restaurant.id}`}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-orange-100">
                  <div className="h-48 bg-gradient-to-br from-orange-200 to-red-200 relative overflow-hidden">
                    {restaurant.image_url ? (
                      <img 
                        src={restaurant.image_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-16 h-16 text-orange-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold">{restaurant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium">
                        {restaurant.cuisine}
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>7-11 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md" data-testid="auth-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            <form onSubmit={handleAuth} className="mt-6 space-y-4">
              {authMode === 'register' && (
                <>
                  <Input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="name-input"
                  />
                  <Input
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="phone-input"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="role-select"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="rider">Rider</option>
                  </select>
                </>
              )}
              
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
              />

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600" 
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage;