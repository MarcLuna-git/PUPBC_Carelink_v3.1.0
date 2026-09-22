import authService from '../services/authService';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  QrCode,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  Activity,
  FileText,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';

const StudentLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const savedMode =
      localStorage.getItem('darkMode') === 'true';

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
      const isDark =
        localStorage.getItem('darkMode') === 'true';

      setDarkMode(isDark);
    };

    window.addEventListener(
      'darkModeChange',
      handleDarkModeChange
    );

    return () =>
      window.removeEventListener(
        'darkModeChange',
        handleDarkModeChange
      );
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setUnreadCount(0);
          return;
        }

        const response = await api.get(
          '/student/notifications?limit=1',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setUnreadCount(
            Math.max(
              0,
              Number(response.data.unread_count) || 0
            )
          );
        }
      } catch {
        // Hindi dapat ma-block ang layout kapag notif request failed.
      }
    };

    const handleNotificationsUpdated = (event) => {
      const count = Number(
        event?.detail?.unreadCount
      );

      if (Number.isFinite(count)) {
        setUnreadCount(
          Math.max(0, count)
        );
        return;
      }

      fetchUnread();
    };

    const handleWindowFocus = () => {
      fetchUnread();
    };

    fetchUnread();

    const interval = setInterval(
      fetchUnread,
      30000
    );

    window.addEventListener(
      'carelink:notifications-updated',
      handleNotificationsUpdated
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        'carelink:notifications-updated',
        handleNotificationsUpdated
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );
    };
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;

    setDarkMode(newMode);

    localStorage.setItem(
      'darkMode',
      newMode.toString()
    );

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.dispatchEvent(
      new Event('darkModeChange')
    );
  };

  const handleLogout = async () => {
    await authService.logout();

    document.documentElement.classList.remove(
      'dark'
    );

    navigate('/login');
  };

  const desktopNavItems = [
    {
      path: '/student/appointments',
      icon: Calendar,
      label: 'Appointments',
    },
    {
      path: '/student/qr',
      icon: QrCode,
      label: 'My QR Code',
    },
    {
      path: '/student/health-records',
      icon: FileText,
      label: 'Health Records',
    },
  ];

  const mobileNavItems = [
    {
      path: '/student/appointments',
      icon: Calendar,
      label: 'Appointments',
    },
    {
      path: '/student/qr',
      icon: QrCode,
      label: 'QR',
    },
    {
      path: '/student/health-records',
      icon: FileText,
      label: 'Records',
    },
    {
      path: '/student/profile',
      icon: User,
      label: 'Profile',
    },
  ];

  const isActive = (path) => {
    if (path === '/student/profile') {
      return (
        location.pathname === '/student/profile' ||
        location.pathname.startsWith(
          '/student/profile/'
        ) ||
        location.pathname.startsWith(
          '/student/settings'
        ) ||
        location.pathname.startsWith(
          '/student/help'
        ) ||
        location.pathname.startsWith(
          '/student/about'
        )
      );
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const displayName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <aside
          className={`w-64 flex flex-col min-h-screen fixed inset-y-0 left-0 z-40 shadow-2xl transition-all duration-300 ${
            darkMode
              ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 shadow-black/30'
              : 'bg-gradient-to-b from-maroon-800 to-maroon-900 shadow-maroon-900/30'
          }`}
        >
          {/* Logo */}
          <div
            className={`h-16 flex items-center px-5 border-b transition-colors ${
              darkMode
                ? 'border-white/5'
                : 'border-white/10'
            }`}
          >
            <Link
              to="/student/appointments"
              className="flex items-center space-x-2.5"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? 'bg-white/10'
                    : 'bg-white/20'
                }`}
              >
                <Activity className="w-5 h-5 text-white" />
              </div>

              <div>
                <p className="font-bold text-lg leading-tight text-white">
                  CareLink
                </p>

                <p
                  className={`text-[10px] leading-tight ${
                    darkMode
                      ? 'text-gray-400'
                      : 'text-white/60'
                  }`}
                >
                  Student Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 p-3 pt-5 space-y-1.5 overflow-y-auto">
            <p
              className={`px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
                darkMode
                  ? 'text-gray-600'
                  : 'text-white/40'
              }`}
            >
              Student
            </p>

            {desktopNavItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? darkMode
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'bg-white text-maroon-900 shadow-lg shadow-black/10'
                      : darkMode
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      active && !darkMode
                        ? 'text-maroon-800'
                        : ''
                    }`}
                  />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      className={`w-4 h-4 ${
                        darkMode
                          ? 'text-white/60'
                          : 'text-maroon-700'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Profile / account */}
          <div
            className={`p-3 border-t space-y-2 ${
              darkMode
                ? 'border-white/5'
                : 'border-white/10'
            }`}
          >
            <Link
              to="/student/profile"
              className={`group flex items-center space-x-3 px-3 py-3 rounded-2xl transition-colors ${
                darkMode
                  ? 'hover:bg-white/5'
                  : 'hover:bg-white/10'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  darkMode
                    ? 'bg-white/10'
                    : 'bg-white/20'
                }`}
              >
                <User className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {displayName || 'Student'}
                </p>

                <p
                  className={`text-xs truncate ${
                    darkMode
                      ? 'text-gray-500'
                      : 'text-white/55'
                  }`}
                >
                  {user.student_id || 'Student Account'}
                </p>
              </div>

              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  darkMode
                    ? 'text-gray-600'
                    : 'text-white/40'
                }`}
              />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full ${
                darkMode
                  ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                  : 'text-white/75 hover:bg-red-500/20 hover:text-red-100'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-5 lg:px-7 sticky top-0 z-30">
          {/* Mobile title */}
          <div className="lg:hidden flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 bg-maroon-800 dark:bg-maroon-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {greeting},
              </p>

              <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                {user.first_name || 'Student'}
              </p>
            </div>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {greeting},{' '}
              <span className="font-semibold text-maroon-800 dark:text-maroon-300">
                {user.first_name || 'Student'}!
              </span>
            </p>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <Link
              to="/student/alerts"
              aria-label="Notifications"
              title="Notifications"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-maroon-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-maroon-500/40 transition-all"
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  {unreadCount > 9
                    ? '9+'
                    : unreadCount}
                </span>
              )}
            </Link>

            {/* Appearance */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={
                darkMode
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              title={
                darkMode
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-maroon-500/40 transition-all"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 lg:px-7 lg:py-6 pb-28 lg:pb-8 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -6,
              }}
              transition={{
                duration: 0.18,
              }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-gray-200 dark:border-gray-700 px-1.5 py-1.5">
          <div className="grid grid-cols-4 gap-1">
            {mobileNavItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className={`relative flex flex-col items-center justify-center gap-1 min-h-[54px] px-1 py-2 rounded-xl transition-all duration-200 ${
                    active
                      ? 'text-maroon-800 dark:text-maroon-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="student-mobile-active-tab"
                      className="absolute inset-0 bg-maroon-50 dark:bg-maroon-900/30 rounded-xl"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 32,
                      }}
                    />
                  )}

                  <item.icon className="w-5 h-5 relative z-10" />

                  <span className="text-[10px] leading-none font-semibold relative z-10 truncate max-w-full">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default StudentLayout;