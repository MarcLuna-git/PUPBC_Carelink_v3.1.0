import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, QrCode, FileText, Bell, Lock, ArrowRight, Menu, X, ChevronDown, ChevronUp,
  Users, Activity, Clock, HeartPulse, Star, MapPin, Phone, Mail, ExternalLink
} from 'lucide-react';
import clinicLogo from '../../assets/clinic logo.jpg';
import pupbg from '../../assets/pupbg.jpg';

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] } }),
  };

  const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

  const stats = [
    { icon: Users, value: '1,200+', label: 'Students Served' },
    { icon: Activity, value: '24/7', label: 'Online Access' },
    { icon: Lock, value: '100%', label: 'Secure Records' },
  ];

  const features = [
    { icon: Calendar, title: 'Appointment Booking', desc: 'Schedule clinic visits anytime, anywhere without waiting in line.' },
    { icon: QrCode, title: 'QR Check-in', desc: 'Fast and contactless check-in using your unique student QR code.' },
    { icon: FileText, title: 'Medical Records', desc: 'Access your complete medical history and consultation notes securely.' },
    { icon: Bell, title: 'Notifications', desc: 'Receive real-time updates on appointments, results, and announcements.' },
    { icon: Lock, title: 'Secure Data', desc: 'Your health information is encrypted and compliant with data privacy standards.' },
    { icon: HeartPulse, title: 'Health Monitoring', desc: 'Track your vitals and health stats with easy-to-read summaries.' },
  ];

  const steps = [
    { step: '01', title: 'Register Account', desc: 'Sign up using your student ID and verify your email.' },
    { step: '02', title: 'Book Appointment', desc: 'Choose your service, date, and preferred time slot.' },
    { step: '03', title: 'Visit Clinic', desc: 'Present your QR code at the clinic kiosk for fast check-in.' },
    { step: '04', title: 'Medical Record', desc: 'View your diagnosis, treatment, and prescriptions online.' },
  ];

  const whyUs = [
    { icon: Clock, title: 'Save Time', desc: 'No more waiting in line. Book appointments in minutes.' },
    { icon: Lock, title: 'Privacy First', desc: 'Encrypted, access-controlled data protection for your peace of mind.' },
    { icon: Users, title: 'Student-Focused', desc: 'Designed specifically for PUP Biñan students.' },
    { icon: Activity, title: 'Real-Time Updates', desc: 'Instant notifications for appointments and results.' },
  ];

  const testimonials = [
    { name: 'Maria Santos', course: 'BSIT 3-A', text: 'CareLink made it so easy to book my checkup. No more long lines at the clinic!', rating: 5 },
    { name: 'Juan Dela Cruz', course: 'BSCS 2-B', text: 'I love that I can access my medical records anytime. Very convenient!', rating: 5 },
    { name: 'Ana Reyes', course: 'BSN 4-C', text: 'The QR check-in is genius. Fast, contactless, and efficient.', rating: 4 },
  ];

  const faqs = [
    { q: 'How do I register for CareLink?', a: 'Simply click the Register button, fill in your student details, and verify your email with the OTP sent to your inbox.' },
    { q: 'Is my medical data secure?', a: 'Yes! All data is encrypted and stored securely. Only authorized clinic staff can access your records.' },
    { q: 'Can I cancel or reschedule an appointment?', a: 'Yes, you can cancel pending appointments anytime. To reschedule, cancel the existing one and book a new slot.' },
    { q: 'What if I forget my password?', a: 'Use the Forgot Password feature on the login page. An OTP will be sent to your registered email to reset your password.' },
    { q: 'Is CareLink free for students?', a: 'Yes! CareLink is completely free for all PUP Biñan students as part of the university health services.' },
  ];

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">

      {/* ============================================ */}
      {/* NAVBAR                                        */}
      {/* ============================================ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100 dark:border-gray-800'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className={`flex items-center space-x-2 flex-shrink-0 rounded-lg ${focusRing}`}>
              <img src={clinicLogo} alt="PUPBC CareLink" className="w-8 h-8 lg:w-10 lg:h-10 object-cover rounded-full" />
              <span className={`font-bold text-lg transition-colors ${scrolled ? 'text-maroon-800 dark:text-maroon-400' : 'text-white'}`}>PUPBC CareLink</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {['Features', 'How It Works', 'FAQ'].map(link => (
                <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${focusRing} ${
                    scrolled ? 'text-gray-600 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-maroon-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}>{link}</a>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login" className={`text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${focusRing} ${
                scrolled
                  ? 'text-maroon-800 dark:text-maroon-400 border border-maroon-200 dark:border-maroon-800 hover:bg-maroon-50 dark:hover:bg-maroon-900/20'
                  : 'text-white border border-white/30 hover:bg-white/10'
              }`}>Login</Link>
              <Link to="/register" className={`text-sm font-semibold text-maroon-900 bg-gradient-to-r from-yellow-400 to-yellow-500 px-5 py-2.5 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition shadow-lg shadow-yellow-400/20 ${focusRing}`}>Register</Link>
            </div>

            <button aria-label="Toggle menu" className={`md:hidden p-2 rounded-lg ${focusRing}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={`w-6 h-6 ${scrolled ? 'text-gray-800 dark:text-white' : 'text-white'}`} /> : <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-800 dark:text-white' : 'text-white'}`} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
              <div className="px-4 py-4 space-y-2">
                {['Features', 'How It Works', 'FAQ'].map(link => (
                  <a key={link} href={`#${link.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">{link}</a>
                ))}
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Link to="/login" className="flex-1 text-center font-semibold text-maroon-800 dark:text-maroon-400 py-3 rounded-xl border border-maroon-200 dark:border-maroon-800">Login</Link>
                  <Link to="/register" className="flex-1 text-center font-semibold text-white bg-maroon-800 py-3 rounded-xl">Register</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ============================================ */}
      {/* HERO — signature: an ECG/pulse line tracing through the headline */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img src={pupbg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/78 via-maroon-800/72 to-maroon-950/78"></div>

        {/* Signature pulse-line, drawn once on load, faint and ambient afterward */}
        <svg className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-40 opacity-20" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M0,80 L280,80 L320,80 L345,20 L370,140 L395,80 L440,80 L470,50 L500,110 L530,80 L1200,80"
            fill="none" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.3 }}
          />
        </svg>

        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-maroon-500/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center space-y-8">

            <motion.div variants={fadeUp} className="flex justify-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 p-2 lg:p-3 shadow-2xl">
                <img src={clinicLogo} alt="PUPBC CareLink logo" className="w-full h-full object-cover rounded-full" />
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-yellow-200">
                <HeartPulse className="w-4 h-4" />
                <span>QR-Integrated Health Information System</span>
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[0.9] tracking-tight">
              PUPBC CareLink:{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                A QR-Integrated Health Information System
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              PUPBC CareLink is the QR-integrated health information system with a self-service triage kiosk for the Polytechnic University of the Philippines, Biñan Campus Clinic. Book appointments, access medical records, and manage your health, all in one place.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className={`group inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-maroon-900 px-8 py-4 rounded-2xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-2xl shadow-yellow-400/20 hover:shadow-yellow-400/40 transform hover:-translate-y-0.5 ${focusRing}`}>
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login"
                className={`group inline-flex items-center justify-center space-x-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/60 backdrop-blur-sm transition-all duration-300 ${focusRing}`}>
                <span>Login to Portal</span>
                <ExternalLink className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}
              className="inline-flex flex-wrap justify-center gap-8 sm:gap-12 lg:gap-16 mt-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-8 sm:px-12 py-6 sm:py-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <stat.icon className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-yellow-200/70">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block" aria-hidden="true">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES                                      */}
      {/* ============================================ */}
      <section id="features" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-14 lg:mb-20">
            <motion.span variants={fadeUp} className="inline-block bg-maroon-50 dark:bg-maroon-900/20 text-maroon-800 dark:text-maroon-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Features</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">Everything You Need</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto text-lg">Manage your health conveniently with features built for student life.</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="group bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-gray-700/50 hover:shadow-2xl hover:shadow-maroon-800/5 hover:border-maroon-100 dark:hover:border-maroon-800/30 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-maroon-800/10">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS                                 */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-14 lg:mb-20">
            <motion.span variants={fadeUp} className="inline-block bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Process</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">How It Works</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto text-lg">Four simple steps to better healthcare.</motion.p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-maroon-800 to-yellow-400 hidden sm:block"></div>

            <div className="space-y-8 lg:space-y-12">
              {steps.map((s, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} custom={i}
                  className="flex items-start space-x-4 lg:space-x-6 relative">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center text-white font-extrabold text-base lg:text-lg flex-shrink-0 z-10 shadow-xl shadow-maroon-800/20">{s.step}</div>
                  <div className="bg-white dark:bg-gray-700 rounded-2xl p-5 lg:p-6 border border-gray-100 dark:border-gray-600 flex-1 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{s.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY CHOOSE CARELINK                          */}
      {/* ============================================ */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-14 lg:mb-20">
            <motion.span variants={fadeUp} className="inline-block bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Why Us</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">Why Choose CareLink?</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto text-lg">Built for students, designed for convenience.</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {whyUs.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-yellow-400/20 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-maroon-900" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS                                 */}
      {/* ============================================ */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-14 lg:mb-20">
            <motion.span variants={fadeUp} className="inline-block bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Testimonials</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">What Students Say</motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="bg-white dark:bg-gray-700 rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-xl transition-shadow duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => (<Star key={j} className={`w-4 h-4 ${j < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} />))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic mb-6">"{t.text}"</p>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-600">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.course}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ                                          */}
      {/* ============================================ */}
      <section id="faq" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-14 lg:mb-20">
            <motion.span variants={fadeUp} className="inline-block bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">FAQ</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">Frequently Asked Questions</motion.h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} custom={i}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}
                  className={`w-full flex items-center justify-between p-5 lg:p-6 text-left font-semibold text-gray-900 dark:text-white text-sm lg:text-base hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${focusRing}`}>
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                      className="px-5 lg:px-6 pb-5 lg:pb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA BANNER                                   */}
      {/* ============================================ */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-maroon-900 via-maroon-800 to-maroon-950 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-maroon-500/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">Ready to Take Control of Your Health?</motion.h2>
            <motion.p variants={fadeUp} className="text-yellow-200/80 mt-4 max-w-lg mx-auto text-lg">Join PUP Biñan students using CareLink for faster, easier clinic services.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/register" className={`group inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-maroon-900 px-8 py-4 rounded-2xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-2xl shadow-yellow-400/20 ${focusRing}`}>
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className={`inline-flex items-center justify-center space-x-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/60 transition-all duration-300 ${focusRing}`}>
                <span>Login</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                       */}
      {/* ============================================ */}
      <footer className="bg-gray-950 py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img src={clinicLogo} alt="PUPBC CareLink logo" className="w-10 h-10 object-cover rounded-full" />
              <span className="font-bold text-white text-xl">PUPBC CareLink</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">PUPBC CareLink: A QR-Integrated Health Information System with Self-Service Triage Kiosk for the PUP Biñan Campus Clinic.</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              <a href="#features" className="block hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="block hover:text-white transition-colors">How It Works</a>
              <a href="#faq" className="block hover:text-white transition-colors">FAQ</a>
              <Link to="/login" className="block hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="block hover:text-white transition-colors">Register</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 flex-shrink-0" /><span>PUP Biñan Campus Clinic</span></div>
              <div className="flex items-center space-x-2"><Phone className="w-4 h-4 flex-shrink-0" /><span>(043) 123-4567</span></div>
              <a href="mailto:pupbccarelink@gmail.com" className="flex items-center space-x-2 hover:text-white transition-colors"><Mail className="w-4 h-4 flex-shrink-0" /><span>pupbccarelink@gmail.com</span></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              <p className="hover:text-white cursor-pointer transition-colors">Privacy Policy</p>
              <p className="hover:text-white cursor-pointer transition-colors">Terms of Service</p>
              <p className="hover:text-white cursor-pointer transition-colors">Data Protection</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 lg:mt-16 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} PUPBC CareLink: A QR-Integrated Health Information System with Self-Service Triage Kiosk. All rights reserved. Polytechnic University of the Philippines — Biñan Campus.
        </div>
      </footer>

    </div>
  );
};

export default Landing;