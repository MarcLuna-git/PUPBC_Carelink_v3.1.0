import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message || 'OTP sent to your email.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fadeInUp">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <Mail className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Enter your email and we'll send you a reset code
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${message.includes('sent') || message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">Email Address</label>
            <input
              className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
            />
          </div>

          <button
            className="w-full py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 hover:shadow-lg transition"
            type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            <span>{loading ? 'Sending...' : 'Send OTP'}</span>
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

export default ForgotPassword;