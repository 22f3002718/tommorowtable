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
              <img 
                src="/logo.jpg" 
                alt="Localtokri Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-lg"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Localtokri</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Local Essentials, Delivered</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              {auth?.user ? (
                <>
                  {auth.user.role === 'customer' && (
                    <Link to="/orders">
                      <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-600" data-testid="my-orders-btn">
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
                  <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{auth.user.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={auth.logout} className="text-gray-600" data-testid="logout-btn">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowAuth(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white" data-testid="login-btn">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white py-8 md:py-12">
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
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
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

      {/* Restaurants Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">
            {searchQuery ? `Search Results` : `Restaurants Near You`}
          </h3>
          {filteredRestaurants.length > 0 && (
            <span className="text-sm text-gray-500">{filteredRestaurants.length} available</span>
          )}
        </div>
        
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No restaurants found</p>
            <p className="text-gray-500 mt-1">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Link 
                key={restaurant.id} 
                to={`/restaurant/${restaurant.id}`}
                className="block group"
                data-testid={`restaurant-card-${restaurant.id}`}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="relative h-40 md:h-48 bg-gradient-to-br from-green-100 to-red-100 overflow-hidden">
                    {restaurant.image_url ? (
                      <img 
                        src={restaurant.image_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-12 h-12 md:w-16 md:h-16 text-green-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-md">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 truncate">{restaurant.name}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-1">{restaurant.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                        {restaurant.cuisine}
                      </span>
                      <div className="flex items-center text-gray-500 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" />
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

      {/* Bottom Navigation for Mobile - Only show for customers */}
      {auth?.user && auth.user.role === 'customer' && <BottomNav />}

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
                className="w-full bg-green-600 hover:bg-green-700" 
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