import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { Key, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', otp: '', password: '', password_confirmation: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setMessage('Passwords do not match'); return;
    }
    setLoading(true); setMessage('');
    try {
      const res = await authService.resetPassword(form.email, form.otp, form.password, form.password_confirmation);
      setMessage(res.message);
      if (res.success) setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reset failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fadeInUp">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <Key className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-2 text-center">Enter the OTP and your new password</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">Email</label>
            <input className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">OTP Code</label>
            <input className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
              type="text" name="otp" value={form.otp} onChange={handleChange} maxLength={6} required />
          </div>
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">New Password</label>
            <div className="relative">
              <input className="border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">Confirm Password</label>
            <input className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required />
          </div>

          <button
            className="w-full py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 hover:shadow-lg transition"
            type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
            <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:underline inline-flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;