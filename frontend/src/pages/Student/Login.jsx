import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { Eye, EyeOff, Loader2, ArrowRight, Hash, Calendar, Lock, ArrowLeft } from 'lucide-react';
import clinicLogo from '../../assets/clinic logo.jpg';
import pupbg from '../../assets/pupbg.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ student_id: '', birthday: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    const idRegex = /^\d{4}-\d{5}-BN-[01]$/;
    if (!form.student_id) newErrors.student_id = 'Student ID is required';
    else if (!idRegex.test(form.student_id)) newErrors.student_id = 'Format: 2016-00000-BN-0 or BN-1';
    if (!form.birthday) newErrors.birthday = 'Birthday is required';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 5) newErrors.password = 'Minimum 5 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'student_id') {
      formatted = value.toUpperCase().replace(/\s/g, '');
      if (formatted.length === 4 && value.length > (form.lastLength || 0) && !formatted.includes('-')) formatted += '-';
      if (formatted.length === 10 && value.length > (form.lastLength || 0) && formatted.split('-').length === 2) formatted += '-';
      form.lastLength = formatted.length;
    }
    setForm({ ...form, [name]: formatted });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMessage('');

    const timeoutId = setTimeout(() => {
      setMessage('Server is taking too long. Please check your connection and try again.');
      setLoading(false);
    }, 10000);

    try {
      // Convert birthday to YYYY-MM-DD format for backend
      let birthday = form.birthday;
      if (birthday && birthday.includes('/')) {
        const parts = birthday.split('/');
        birthday = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }

      const res = await authService.login(form.student_id, form.password, birthday);
      clearTimeout(timeoutId);

      if (res.success) {
        navigate('/student/dashboard');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.code === 'ECONNABORTED') {
        setMessage('Request timed out. Please check your connection.');
      } else if (!err.response) {
        setMessage('Cannot connect to server. Please make sure the server is running.');
      } else {
        setMessage(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      
      {/* LEFT SIDE — PUP Biñan Campus Background */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <img src={pupbg} alt="PUP Biñan Campus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/78 via-maroon-800/72 to-maroon-950/78"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)', backgroundSize: '50px 50px' }}></div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="mb-8 animate-bounce-in">
            <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl border-2 border-white/30 p-3">
              <img src={clinicLogo} alt="PUPBC CareLink logo" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-center mb-4 leading-tight animate-fadeInUp">
            PUPBC{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              CareLink
            </span>
          </h1>
          <p className="text-xl text-yellow-100 text-center mb-2 max-w-md animate-fadeInUp animation-delay-200">
            Polytechnic University of the Philippines
          </p>
          <p className="text-sm text-yellow-200 text-center mb-8 max-w-md animate-fadeInUp animation-delay-200">
            Biñan Campus
          </p>
          <div className="space-y-4 w-full max-w-sm animate-fadeInUp animation-delay-400">
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm">Clinic & Health Services</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm">Medical Records & Appointments</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-sm">Secure Student Portal</span>
            </div>
          </div>
          <p className="text-yellow-200/70 text-sm mt-12 text-center animate-fadeInUp animation-delay-600">
            &copy; 2026 PUPBC CareLink. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE — Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg mb-3 p-1.5">
              <img src={clinicLogo} alt="PUPBC CareLink logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">PUPBC CareLink</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Student Portal</p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-fadeInUp">
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back, Isko&apos;t Iska!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Login to access your student portal</p>
            </div>

            {/* Error/Success Message */}
            {message && (
              <div className={`mb-4 p-3 rounded-xl text-sm text-center animate-shake ${
                message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Student ID */}
              <div>
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300 pb-1 block">Student ID</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <input
                    className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all dark:bg-gray-700 dark:text-white ${
                      errors.student_id 
                        ? 'border-red-300 focus:ring-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-maroon-500 hover:border-maroon-300'
                    }`}
                    type="text"
                    name="student_id"
                    value={form.student_id}
                    onChange={handleChange}
                    placeholder="2016-00000-BN-0"
                    maxLength={17}
                    required
                  />
                </div>
                {errors.student_id && <p className="text-red-500 text-xs mt-1 ml-1">{errors.student_id}</p>}
              </div>

              {/* Birthday */}
              <div>
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300 pb-1 block">Birthday</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all dark:bg-gray-700 dark:text-white ${
                      errors.birthday 
                        ? 'border-red-300 focus:ring-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-maroon-500 hover:border-maroon-300'
                    }`}
                    type="date"
                    name="birthday"
                    value={form.birthday}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.birthday && <p className="text-red-500 text-xs mt-1 ml-1">{errors.birthday}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="font-semibold text-sm text-gray-700 dark:text-gray-300 pb-1 block">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    className={`w-full border rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 transition-all dark:bg-gray-700 dark:text-white ${
                      errors.password 
                        ? 'border-red-300 focus:ring-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-maroon-500 hover:border-maroon-300'
                    }`}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-semibold text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-maroon-950 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
              <span className="px-4 text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">or</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 transition-colors inline-flex items-center space-x-1">
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </p>
            </div>

          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-gray-400 dark:text-gray-500 hover:underline inline-flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Home</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;