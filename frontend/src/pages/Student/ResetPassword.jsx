import {
  useEffect,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
  Link,
} from 'react-router-dom';

import authService from '../../services/authService';

import {
  Key,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  Mail,
} from 'lucide-react';

const OTP_RESEND_COOLDOWN = 60;
const OTP_EXPIRY_MINUTES = 10;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail =
    location.state?.email || '';

  const initialOtpSent =
    Boolean(
      location.state?.otpSent
    );

  const [form, setForm] =
    useState({
      email: initialEmail,
      otp: '',
      password: '',
      password_confirmation:
        '',
    });

  const [message, setMessage] =
    useState('');

  const [messageType, setMessageType] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [
    resendingOtp,
    setResendingOtp,
  ] = useState(false);

  const [
    otpCooldown,
    setOtpCooldown,
  ] = useState(
    initialOtpSent
      ? OTP_RESEND_COOLDOWN
      : 0
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  // ==========================================
  // COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (otpCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(
      () => {
        setOtpCooldown(
          (current) => {
            if (current <= 1) {
              window.clearInterval(
                timer
              );

              return 0;
            }

            return (
              current - 1
            );
          }
        );
      },
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, [otpCooldown]);

  // ==========================================
  // CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    let nextValue = value;

    if (name === 'otp') {
      nextValue =
        value
          .replace(/\D/g, '')
          .slice(0, 6);
    }

    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    if (messageType === 'error') {
      setMessage('');
      setMessageType('');
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResendOtp =
    async () => {
      if (
        resendingOtp ||
        otpCooldown > 0
      ) {
        return;
      }

      const email =
        form.email.trim();

      if (!email) {
        setMessageType('error');

        setMessage(
          'Enter your email address first.'
        );

        return;
      }

      setResendingOtp(true);
      setMessage('');
      setMessageType('');

      // Old OTP should no longer be used
      // once resend is requested.
      setForm((previous) => ({
        ...previous,
        otp: '',
      }));

      try {
        const res =
          await authService
            .resendPasswordResetOtp(
              email
            );

        if (res.success) {
          setOtpCooldown(
            OTP_RESEND_COOLDOWN
          );

          setMessageType(
            'success'
          );

          setMessage(
            res.message ||
              `A new password reset code was sent. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`
          );
        } else {
          setMessageType(
            'error'
          );

          setMessage(
            res.message ||
              'Failed to resend OTP.'
          );
        }
      } catch (err) {
        setMessageType('error');

        setMessage(
          err.response?.data
            ?.message ||
            'Failed to resend OTP. Please try again.'
        );
      } finally {
        setResendingOtp(false);
      }
    };

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (
        !form.email.trim()
      ) {
        setMessageType('error');

        setMessage(
          'Email address is required.'
        );

        return;
      }

      if (
        !/^\d{6}$/.test(
          form.otp
        )
      ) {
        setMessageType('error');

        setMessage(
          'Enter the 6-digit OTP sent to your email.'
        );

        return;
      }

      if (
        form.password.length < 8
      ) {
        setMessageType('error');

        setMessage(
          'Password must be at least 8 characters.'
        );

        return;
      }

      if (
        form.password !==
        form.password_confirmation
      ) {
        setMessageType('error');

        setMessage(
          'Passwords do not match.'
        );

        return;
      }

      setLoading(true);
      setMessage('');
      setMessageType('');

      try {
        const res =
          await authService
            .resetPassword(
              form.email.trim(),
              form.otp,
              form.password,
              form.password_confirmation
            );

        if (res.success) {
          setMessageType(
            'success'
          );

          setMessage(
            res.message ||
              'Password reset successfully.'
          );

          window.setTimeout(
            () =>
              navigate('/login'),
            1500
          );
        } else {
          setMessageType(
            'error'
          );

          setMessage(
            res.message ||
              'Password reset failed.'
          );
        }
      } catch (err) {
        setMessageType('error');

        setMessage(
          err.response?.data
            ?.message ||
            'Password reset failed.'
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center px-4 py-8">

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fadeInUp">

        <div className="flex flex-col items-center mb-6">

          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg mb-3">

            <Key className="w-9 h-9 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Reset Password
          </h1>

          <p className="text-sm text-gray-500 mt-2 text-center">
            Enter the
            verification code
            sent to your email,
            then create your
            new password.
          </p>

          <p className="text-xs text-gray-400 mt-1">
            OTP valid for{' '}
            {OTP_EXPIRY_MINUTES}{' '}
            minutes.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm text-center ${
              messageType ===
              'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          {/* EMAIL */}
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">
              Email
            </label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                className="border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* OTP */}
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">
              OTP Code
            </label>

            <input
              className="border border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-[0.4em]"
              type="text"
              name="otp"
              value={
                form.otp
              }
              onChange={
                handleChange
              }
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              required
            />

            <div className="mt-2 text-center">

              {otpCooldown >
              0 ? (
                <p className="text-xs text-gray-500">
                  Resend code in{' '}
                  <strong>
                    {otpCooldown}s
                  </strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleResendOtp
                  }
                  disabled={
                    resendingOtp
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50"
                >
                  {resendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}

                  {resendingOtp
                    ? 'Resending...'
                    : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">
              New Password
            </label>

            <div className="relative">

              <input
                className="border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                name="password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="font-semibold text-sm text-gray-700 pb-1 block">
              Confirm Password
            </label>

            <div className="relative">

              <input
                className="border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                name="password_confirmation"
                value={
                  form.password_confirmation
                }
                onChange={
                  handleChange
                }
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {form.password &&
            form.password ===
              form.password_confirmation && (
              <p className="text-green-600 text-xs">
                Passwords match.
              </p>
            )}

          <button
            className="w-full py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 hover:shadow-lg transition"
            type="submit"
            disabled={
              loading ||
              resendingOtp
            }
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Key className="w-5 h-5" />
            )}

            <span>
              {loading
                ? 'Resetting...'
                : 'Reset Password'}
            </span>
          </button>
        </form>

        <div className="mt-6 text-center">

          <Link
            to="/login"
            className="text-sm text-gray-500 hover:underline inline-flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />

            <span>
              Back to Login
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;