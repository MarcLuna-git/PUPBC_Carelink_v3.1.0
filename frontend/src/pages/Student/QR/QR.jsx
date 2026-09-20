import api from '../../../services/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Download, Printer, Copy, Check, Loader2, Shield, AlertCircle, Smartphone, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';
import clinicLogo from '../../../assets/clinic logo.jpg';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`} />
);

const QR = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const healthProfileDone = user?.profile?.health_profile_completed || false;
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [qrCodeHash, setQrCodeHash] = useState('');
  useEffect(() => { api.get('/student/qr').then(res => setQrCodeHash(res.data.data.qr_code_hash)).catch(() => setMessage('Unable to load your active QR code.')); }, []);
  const qrValue = JSON.stringify({
    student_id: user.student_id,
    name: `${user.first_name} ${user.last_name}`,
    hash: qrCodeHash,
  });

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(qrValue, {
          width: 400,
          margin: 2,
          color: { dark: '#5E1224', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    };
    if (qrCodeHash) generateQR();
    const timer = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, [qrCodeHash]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCodeHash);
    setCopied(true);
    setMessage('QR Code copied!');
    setTimeout(() => { setCopied(false); setMessage(''); }, 2000);
  };

  const handleDownload = () => {
    setLoading(true);
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `PUPBC-QR-${user.student_id}.png`;
    link.click();
    setTimeout(() => { 
      setLoading(false); 
      setMessage('Downloaded!'); 
      setTimeout(() => setMessage(''), 2000); 
    }, 500);
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>PUPBC QR Code</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',Arial,sans-serif;margin:0;background:#f8f8f8}
        .card{text-align:center;background:white;border-radius:24px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
        .logo{color:#5E1224;font-size:20px;font-weight:700;margin:0 0 4px 0}
        .sub{color:#888;font-size:13px;margin:0 0 24px 0}
        .name{font-size:18px;font-weight:700;color:#1a1a1a;margin:16px 0 4px 0}
        .id{color:#888;font-size:14px;margin:0}
        img{width:260px;height:260px;padding:12px;border:3px solid #5E1224;border-radius:20px}
        .footer{color:#aaa;font-size:11px;margin-top:20px}
      </style></head><body>
      <div class="card">
        <p class="logo">🏥 PUPBC CareLink</p>
        <p class="sub">Student QR Code</p>
        <img src="${qrDataUrl}" alt="QR"/>
        <p class="name">${user.first_name} ${user.last_name}</p>
        <p class="id">${user.student_id}</p>
        <p class="footer">PUP Biñan Campus • Clinic Management System</p>
      </div>
      <script>setTimeout(()=>{window.print();window.close()},800)</script></body></html>`);
    w.document.close();
  };

  if (!healthProfileDone) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Health Profile Required</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Complete your Health Profile to unlock your QR Code.</p>
          <Link to="/student/health-profile" className="inline-flex items-center space-x-2 mt-5 px-6 py-3 bg-maroon-800 text-white font-semibold rounded-2xl hover:bg-maroon-900 transition">
            <span>Complete Health Profile</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
        <div className="mb-6">
          <Skeleton className="h-7 w-36 mb-1.5" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-5">
                <Skeleton className="w-52 h-52 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-2xl" />
              </div>
              <Skeleton className="h-5 w-40 mx-auto mb-1" />
              <Skeleton className="h-4 w-24 mx-auto mb-1" />
              <Skeleton className="h-3 w-32 mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto pb-6">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My QR Code</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Scan this at the clinic kiosk to check in</p>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl text-sm font-medium text-center border border-green-200 dark:border-green-800/20">
          {message}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        
        <div className="lg:col-span-3 space-y-4">
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
            
            <div className="relative inline-block mb-5">
              <div className="bg-white border-[3px] border-maroon-800 dark:border-maroon-700 rounded-2xl p-3 sm:p-4 shadow-lg">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QR Code" 
                    className="w-44 h-44 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-maroon-800" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-maroon-800">
                  <img src={clinicLogo} alt="PUPBC CareLink" className="w-full h-full object-cover rounded-full" />
                </div>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.student_id}</p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
              {user.course} - {user.year}{user.section}
            </p>

            <div className="flex items-center justify-center gap-2 mt-4">
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-xl text-gray-500 dark:text-gray-400 font-mono max-w-[200px] truncate">
                {qrCodeHash}
              </code>
              <button 
                onClick={handleCopy} 
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copy QR Code">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownload} 
              disabled={loading || !qrDataUrl}
              className="flex items-center justify-center gap-2 py-3.5 bg-maroon-800 text-white font-semibold rounded-2xl hover:bg-maroon-900 transition shadow-lg shadow-maroon-800/20 disabled:opacity-50 text-sm sm:text-base">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{loading ? 'Downloading...' : 'Download'}</span>
            </button>
            <button 
              onClick={handlePrint} 
              disabled={!qrDataUrl}
              className="flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-gray-800 border-2 border-maroon-800 dark:border-maroon-700 text-maroon-800 dark:text-maroon-400 font-semibold rounded-2xl hover:bg-maroon-50 dark:hover:bg-maroon-900/20 transition text-sm sm:text-base">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-maroon-50 dark:bg-maroon-900/10 border border-maroon-200 dark:border-maroon-800/20 rounded-3xl p-5 sm:p-6">
            <h3 className="font-bold text-maroon-900 dark:text-maroon-400 mb-4 flex items-center gap-2 text-base sm:text-lg">
              <Smartphone className="w-5 h-5" />
              How to Use at Kiosk
            </h3>
            
            <div className="space-y-4">
              {[
                { step: 1, title: 'Go to Clinic Kiosk', desc: 'Find the self-service kiosk at the clinic entrance.' },
                { step: 2, title: 'Scan QR Code', desc: 'Hold this QR code up to the kiosk scanner to identify yourself.' },
                { step: 3, title: 'Get Queue Number', desc: 'An approved appointment for today is required. Confirm your visit and complete triage.' },
                { step: 4, title: 'Wait Your Turn', desc: 'The system auto-assigns priority or regular status. Wait for your name.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-maroon-200 dark:bg-maroon-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs sm:text-sm font-bold text-maroon-800 dark:text-maroon-400">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-3xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-yellow-800 dark:text-yellow-400">Keep This Private</p>
                <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-500 mt-1 leading-relaxed">
                  Do not share your QR code with anyone. Medical information is NOT stored in this code. This QR is for identification only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QR;