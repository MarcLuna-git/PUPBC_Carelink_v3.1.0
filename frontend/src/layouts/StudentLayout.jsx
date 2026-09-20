import authService from '../services/authService';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Calendar, QrCode, User, Bell, Sun, Moon, LogOut, Activity, FileText, Settings, HelpCircle, Info, Megaphone } from 'lucide-react';
import api from '../services/api';

const StudentLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    const handleDarkModeChange = () => {
      const isDark = localStorage.getItem('darkMode') === 'true';
      setDarkMode(isDark);
    };
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await api.get('/notifications?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const data = response.data.data;
          const items = Array.isArray(data) ? data : (data?.data || []);
          setUnreadCount(items.filter(n => !n.read).length);
        }
      } catch (err) {
      }
    };
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event('darkModeChange'));
  };

  const handleLogout = async () => {
    await authService.logout();
    document.documentElement.classList.remove('dark');
    navigate('/login');
  };

  const desktopNavItems = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/student/qr', icon: QrCode, label: 'My QR Code' },
    { path: '/student/health-records', icon: FileText, label: 'Health Records' },
    { path: '/student/alerts', icon: Bell, label: 'Notifications' },
    { path: '/student/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/student/profile', icon: User, label: 'Profile' },
    { path: '/student/settings', icon: Settings, label: 'Settings' },
    { path: '/student/help', icon: HelpCircle, label: 'Help' },
    { path: '/student/about', icon: Info, label: 'About' },
  ];

  const mobileNavItems = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/student/appointments', icon: Calendar, label: 'Book' },
    { path: '/student/qr', icon: QrCode, label: 'QR' },
    { path: '/student/health-records', icon: FileText, label: 'Records' },
    { path: '/student/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-gray-950 flex flex-col transition-colors duration-300">
      
      <div className="hidden lg:flex">
        <aside className={`w-64 flex flex-col min-h-screen fixed inset-y-0 left-0 z-40 shadow-2xl transition-all duration-300 ${
          darkMode 
            ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 shadow-black/30' 
            : 'bg-gradient-to-b from-maroon-800 to-maroon-900 shadow-maroon-900/30'
        }`}>
          
          <div className={`h-16 flex items-center px-5 border-b transition-colors ${
            darkMode ? 'border-white/5' : 'border-white/10'
          }`}>
            <Link to="/student/dashboard" className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                darkMode ? 'bg-white/10' : 'bg-white/20'
              }`}>
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-lg transition-colors ${
                darkMode ? 'text-white/90' : 'text-white'
              }`}>CareLink</span>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {desktopNavItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.path) 
                    ? darkMode 
                      ? 'bg-white/10 text-white shadow-lg' 
                      : 'bg-white/20 text-white shadow-lg'
                    : darkMode
                      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {item.path === '/student/alerts' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className={`p-3 border-t space-y-2 transition-colors ${
            darkMode ? 'border-white/5' : 'border-white/10'
          }`}>
            <Link to="/student/profile" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-white/5' : 'hover:bg-white/10'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                darkMode ? 'bg-white/10' : 'bg-white/20'
              }`}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.first_name} {user.last_name}</p>
                <p className={`text-xs truncate transition-colors ${
                  darkMode ? 'text-gray-500' : 'text-white/50'
                }`}>{user.student_id}</p>
              </div>
            </Link>
            <button onClick={handleLogout}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm transition-colors w-full ${
                darkMode 
                  ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400' 
                  : 'text-white/80 hover:bg-red-500/20 hover:text-red-200'
              }`}>
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="lg:hidden flex items-center space-x-3">
            <div className="w-8 h-8 bg-maroon-800 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{greeting},</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.first_name}</p>
            </div>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {greeting}, <span className="text-maroon-800 dark:text-maroon-400">{user.first_name}!</span>
            </p>
          </div>

          <div className="flex items-center space-x-1">
            <Link to="/student/alerts" className="relative p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto pb-28 lg:pb-6 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-200/50 dark:border-gray-700/50 px-2 py-2">
          <div className="flex items-center justify-around">
            {mobileNavItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`relative flex flex-col items-center space-y-1 px-2 py-2 rounded-2xl transition-all duration-300 ${
                  isActive(item.path) ? 'text-maroon-800 dark:text-maroon-400' : 'text-gray-400 dark:text-gray-500'
                }`}>
                {isActive(item.path) && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-maroon-50 dark:bg-maroon-900/30 rounded-2xl" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] font-semibold relative z-10">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

    </div>
  );
};

export default StudentLayout;