import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Search, Loader2, ArrowLeft, User, Camera, Keyboard, AlertCircle, CheckCircle, RefreshCw, Clock, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';
import KioskLayout from '../../layouts/KioskLayout';

const KioskScan = ({ onStudentFound, onBack, method: initialMethod }) => {
  const [methodTab, setMethodTab] = useState(initialMethod || 'manual');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanTimeout, setScanTimeout] = useState(false);
  const scannerRef = useRef(null);
  const timeoutRef = useRef(null);
  const isScanningRef = useRef(false); // Prevent multiple simultaneous scans
  const scanCooldownRef = useRef(false); // Cooldown after successful scan
  const qrRegionId = 'qr-reader-region';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQrScanner();
    };
  }, []);

  // Handle tab switch
  useEffect(() => {
    if (methodTab === 'qr') {
      // Delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        startQrScanner();
      }, 800);
      return () => clearTimeout(timer);
    } else {
      stopQrScanner();
    }
  }, [methodTab]);

  const startQrScanner = async () => {
    setError('');
    setScanTimeout(false);
    setCameraReady(false);
    isScanningRef.current = false;
    scanCooldownRef.current = false;

    try {
      // Stop any existing scanner first
      await stopQrScanner();

      // Wait a bit for DOM
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = document.getElementById(qrRegionId);
      if (!element) {
        console.error('QR reader element not found');
        setError('Scanner element not found. Please try manual entry.');
        return;
      }

      // Clear previous content
      element.innerHTML = '';

      const html5QrCode = new Html5Qrcode(qrRegionId, { verbose: false });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR Code scanned successfully!
          handleQRScanned(decodedText);
        },
        () => {
          // Scanning in progress — do nothing
        }
      );

      setCameraReady(true);

      // 15 second timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setScanTimeout(true);
      }, 15000);

    } catch (err) {
      console.error('QR Scanner error:', err);
      let errorMsg = 'Could not access camera.';
      
      if (err?.message?.includes('NotAllowed') || err?.name === 'NotAllowedError') {
        errorMsg = 'Camera access denied. Please allow camera in browser settings.';
      } else if (err?.message?.includes('NotFound') || err?.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      }
      
      setError(errorMsg);
      setCameraReady(false);
    }
  };

  const stopQrScanner = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setCameraReady(false);
    setScanTimeout(false);
  };

  const handleQRScanned = async (decodedText) => {
    // Prevent multiple simultaneous scans
    if (isScanningRef.current || scanCooldownRef.current) {
      return;
    }
    
    isScanningRef.current = true;
    
    try {
      await stopQrScanner();
      setLoading(true);
      setError('');


      let studentIdFromQR = decodedText.trim();
      let qrHash = null;
      
      // Try to extract student ID from JSON
      if (decodedText.includes('student_id') || decodedText.startsWith('{')) {
        try {
          const data = JSON.parse(decodedText);
          studentIdFromQR = data.student_id || data.id || data.studentId || decodedText;
          qrHash = data.hash || data.qr_hash || null;
        } catch (e) {
          // Not JSON, use raw text
        }
      } else {
        // Not JSON - might be a raw hash
        if (decodedText.includes('PUPBC-') || decodedText.length > 20) {
          qrHash = decodedText;
        }
      }


      // Try lookup with student_id first, then with hash
      const payload = { student_id: studentIdFromQR, method: 'qr', qr_hash: qrHash || decodedText.trim() };
      if (qrHash) {
        payload.qr_hash = qrHash;
      }

      const response = await api.post('/kiosk/lookup', payload);
      
      if (response.data.success) {
        scanCooldownRef.current = true;
        setSuccess(true);
        setTimeout(() => onStudentFound({ ...response.data.data, identity: payload }), 800);
      } else {
        throw new Error(response.data.message || 'QR not recognized');
      }
    } catch (err) {
      console.error('QR lookup error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'QR not recognized. Please try manual entry.';
      setError(errorMsg);
      
      // Reset scanning state
      isScanningRef.current = false;
      
      // Auto switch to manual after error
      setTimeout(() => setMethodTab('manual'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const retryScanner = () => {
    stopQrScanner();
    setError('');
    setScanTimeout(false);
    setCameraReady(false);
    isScanningRef.current = false;
    scanCooldownRef.current = false;
    setTimeout(() => startQrScanner(), 500);
  };

  const switchToManual = () => {
    stopQrScanner();
    setMethodTab('manual');
    setError('');
    isScanningRef.current = false;
    scanCooldownRef.current = false;
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    const trimmed = studentId.trim().toUpperCase();
    
    if (!trimmed || trimmed.length < 5) {
      setError('Please enter a valid Student ID (at least 5 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const payload = { student_id: trimmed, method: 'manual' };
      const response = await api.post('/kiosk/lookup', payload);
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => onStudentFound({ ...response.data.data, identity: payload }), 800);
      } else {
        throw new Error(response.data.message || 'Student not found');
      }
    } catch (err) {
      console.error('Manual lookup error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Student not found. Please check your Student ID.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KioskLayout>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500/30">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Student Found!</h2>
            <p className="text-white/40">Redirecting...</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { stopQrScanner(); onBack(); }}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition">
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </motion.button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Check In</h1>
                <p className="text-white/40 text-sm">Verify your identity</p>
              </div>
            </div>

            {/* Method Toggle */}
            <div className="flex bg-white/5 rounded-2xl p-1.5 mb-6 border border-white/10">
              <button onClick={() => setMethodTab('qr')}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  methodTab === 'qr' ? 'bg-yellow-400 text-maroon-900 shadow-lg' : 'text-white/40 hover:text-white/60'
                }`}>
                <Camera className="w-4 h-4" /> Scan QR
              </button>
              <button onClick={() => { setMethodTab('manual'); setError(''); }}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  methodTab === 'manual' ? 'bg-yellow-400 text-maroon-900 shadow-lg' : 'text-white/40 hover:text-white/60'
                }`}>
                <Keyboard className="w-4 h-4" /> Enter ID
              </button>
            </div>

            {/* QR Scanner Area */}
            {methodTab === 'qr' && (
              <div className="space-y-4">
                
                {/* Error State */}
                {error && !cameraReady && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10">
                    <CameraOff className="w-14 h-14 text-white/20 mx-auto mb-4" />
                    <h3 className="text-white font-semibold text-lg mb-2">Camera Issue</h3>
                    <p className="text-white/50 text-sm mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={retryScanner}
                        className="px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Retry
                      </button>
                      <button onClick={switchToManual}
                        className="px-6 py-3 bg-yellow-400 text-maroon-900 rounded-xl text-sm font-semibold hover:bg-yellow-300 transition">
                        Enter ID Instead
                      </button>
                    </div>
                  </div>
                )}

                {/* Scanner Container */}
                <div className="relative">
                  <div 
                    id={qrRegionId}
                    className="rounded-3xl overflow-hidden border-2 border-white/10 w-full bg-black"
                    style={{ minHeight: '320px' }}
                  />
                  
                  {/* Scanning overlay */}
                  {cameraReady && (
                    <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                      {/* Corner brackets */}
                      <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-yellow-400/60 rounded-tl-xl" />
                      <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-yellow-400/60 rounded-tr-xl" />
                      <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-yellow-400/60 rounded-bl-xl" />
                      <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-yellow-400/60 rounded-br-xl" />
                    </div>
                  )}

                  {/* Timeout */}
                  {scanTimeout && cameraReady && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-yellow-400/30 z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <p className="text-white/70 text-sm">Having trouble scanning?</p>
                      </div>
                      <button onClick={switchToManual}
                        className="w-full py-3 bg-yellow-400 text-maroon-900 rounded-xl text-sm font-semibold hover:bg-yellow-300 transition">
                        Switch to Manual Entry
                      </button>
                    </motion.div>
                  )}
                </div>

                <p className="text-white/20 text-xs text-center">
                  Camera opens automatically • Point at QR code
                </p>
              </div>
            )}

            {/* Manual Entry */}
            {methodTab === 'manual' && (
              <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleLookup}>
                <div className="mb-4">
                  <label className="text-white/50 text-sm font-medium block mb-2">Student ID</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                    <input
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-14 pr-5 py-5 text-xl text-white placeholder-white/15 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10 focus:outline-none transition uppercase"
                      type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                      placeholder="2023-00000-BN-0" maxLength={17} autoFocus />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-maroon-900 font-bold rounded-2xl text-lg transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-yellow-400/10">
                  {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Verifying...</> : <><Search className="w-6 h-6" /> Continue</>}
                </motion.button>
              </motion.form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </KioskLayout>
  );
};

export default KioskScan;
