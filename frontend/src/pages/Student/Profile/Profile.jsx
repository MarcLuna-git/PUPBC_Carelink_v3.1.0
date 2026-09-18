import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Bell, FileText, Megaphone, Settings, Moon, Sun, HelpCircle, Info, LogOut, ChevronRight, Heart, Phone, Shield, Calendar, Mail, MapPin, Activity } from 'lucide-react';
import api from '../../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [healthProfile, setHealthProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('carelink.student.health-profile') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('carelink.student.health-profile'));
  const [activeTab, setActiveTab] = useState('personal');
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  useEffect(() => {
    const fetchHealthProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/student/health-profile', { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success && response.data.data) {
          setHealthProfile(response.data.data);
          localStorage.setItem('carelink.student.health-profile', JSON.stringify(response.data.data));
        }
      } catch (err) { console.log('Health profile not found'); }
      finally { setLoading(false); }
    };
    fetchHealthProfile();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode; setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    window.dispatchEvent(new Event('darkModeChange'));
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  // ==================== DESKTOP — PURE PROFILE DETAILS ONLY ====================
  if (isDesktop) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        
        {/* Personal Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-5 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center shadow-lg text-2xl font-bold text-white">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.first_name} {user.last_name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.student_id}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{user.course} - {user.year}{user.section ? ' - ' + user.section : ''}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span>Birthday: {user.birthday || 'N/A'}</span></div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"><Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span className="truncate">{user.email || 'N/A'}</span></div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"><Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span>{user.mobile_number || 'N/A'}</span></div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"><Activity className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span className="capitalize">{user.gender || 'N/A'}</span></div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"><MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span>{user.profile?.address || 'No address set'}</span></div>
          </div>

          <Link to="/student/profile/edit" className="inline-flex items-center space-x-1 mt-4 text-sm text-maroon-600 dark:text-maroon-400 hover:underline"><span>Edit Profile</span><ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>

        {/* Health Profile Card */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse space-y-3">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        ) : healthProfile ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-4"><Heart className="w-5 h-5 text-maroon-600 dark:text-maroon-400" /><span>Medical & Emergency</span></h3>
            
            <div className="space-y-4">
              {/* Emergency Contact */}
              <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100 dark:border-red-800/20">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Emergency Contact</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400 dark:text-gray-500">Name</p><p className="font-semibold text-gray-900 dark:text-white">{healthProfile.emergency_name || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-gray-500">Relationship</p><p className="font-semibold text-gray-900 dark:text-white">{healthProfile.emergency_relationship || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-gray-500">Phone</p><p className="font-semibold text-gray-900 dark:text-white">{healthProfile.emergency_phone || 'N/A'}</p></div>
                </div>
              </div>

              {/* Allergies, Medications, Other */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Allergies</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.allergy_details || 'None'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Medications</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.medications || 'None'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Other Conditions</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.other_medical_history || 'None'}</p></div>
              </div>

              {/* Hospitalization, Surgery, COVID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Hospitalized</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.hospitalized ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Surgery</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.surgery ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">COVID-19</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.had_covid ? 'Yes' : 'No'}</p></div>
              </div>

              {/* Lifestyle */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Smoking</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.smoker ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Alcohol</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.alcohol ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Disability</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.has_disability ? 'Yes' : 'No'}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3"><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Occupation</p><p className="text-sm font-medium text-gray-900 dark:text-white">{healthProfile.occupation || 'N/A'}</p></div>
              </div>

              <Link to="/student/health-profile" className="inline-flex items-center space-x-1 text-sm text-maroon-600 dark:text-maroon-400 hover:underline"><span>Update Health Profile</span><ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-6 border border-yellow-200 dark:border-yellow-800/30 text-center">
            <Heart className="w-10 h-10 text-yellow-500 dark:text-yellow-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Health Profile Not Completed</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Complete your health profile for better care.</p>
            <Link to="/student/health-profile" className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-xl hover:bg-yellow-600 transition">Complete Now</Link>
          </div>
        )}
      </div>
    );
  }

  // ==================== MOBILE — TABS + MENU ====================
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      
      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center shadow-lg text-xl font-bold text-white">{user.first_name?.[0]}{user.last_name?.[0]}</div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.first_name} {user.last_name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.student_id}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{user.course} - {user.year}{user.section}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('personal')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'personal' ? 'bg-maroon-800 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>Personal Info</button>
        <button onClick={() => setActiveTab('medical')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'medical' ? 'bg-maroon-800 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>Medical & Emergency</button>
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Details</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Full Name', value: `${user.first_name} ${user.middle_name||''} ${user.last_name}` },
              { label: 'Student ID', value: user.student_id },
              { label: 'Course', value: `${user.course} - ${user.year}${user.section||''}` },
              { label: 'Birthday', value: user.birthday || 'N/A' },
              { label: 'Gender', value: user.gender || 'N/A' },
              { label: 'Email', value: user.email || 'N/A' },
              { label: 'Phone', value: user.mobile_number || 'N/A' },
              { label: 'Address', value: user.profile?.address || 'Not set' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-400 dark:text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
          <Link to="/student/profile/edit" className="inline-flex items-center space-x-1 mt-4 text-sm text-maroon-600 dark:text-maroon-400 hover:underline">Edit Profile<ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>
      )}

      {/* Medical Tab */}
      {activeTab === 'medical' && (
        loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse space-y-3">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        ) : healthProfile ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" />Emergency Contact</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Name</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.emergency_name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Relationship</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.emergency_relationship || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Phone</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.emergency_phone || 'N/A'}</span></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-maroon-500" />Medical Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Allergies</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.allergy_details || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Medications</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.medications || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Other Conditions</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.other_medical_history || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Hospitalized</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.hospitalized ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Surgery</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.surgery ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">COVID-19</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.had_covid ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Smoking</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.smoker ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Alcohol</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.alcohol ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">Disability</span><span className="font-medium text-gray-900 dark:text-white">{healthProfile.has_disability ? 'Yes' : 'No'}</span></div>
              </div>
              <Link to="/student/health-profile" className="inline-flex items-center space-x-1 mt-4 text-sm text-maroon-600 dark:text-maroon-400 hover:underline">Update Health Profile<ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-6 border border-yellow-200 dark:border-yellow-800/30 text-center">
            <Heart className="w-10 h-10 text-yellow-500 dark:text-yellow-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Health Profile Not Completed</p>
            <Link to="/student/health-profile" className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-xl">Complete Now</Link>
          </div>
        )
      )}

      {/* Menu Sections */}
      {[
        { title: 'Account', items: [
          { icon: User, label: 'Personal Information', desc: 'Name, ID, course, birthday, mobile', action: () => setActiveTab('personal') },
          { icon: Heart, label: 'Medical & Emergency', desc: 'Health profile, emergency contacts', action: () => setActiveTab('medical') },
        ]},
        { title: 'Content', items: [
          { icon: Bell, label: 'Notifications', desc: 'Appointment alerts', path: '/student/alerts' },
          { icon: FileText, label: 'Health Records', desc: 'Consultation history', path: '/student/health-records' },
          { icon: Megaphone, label: 'Announcements', desc: 'Clinic updates', path: '/student/announcements' },
        ]},
        { title: 'Preferences', items: [
          { icon: Settings, label: 'Settings', desc: 'Password, email, appearance', path: '/student/settings' },
          { icon: darkMode ? Sun : Moon, label: darkMode ? 'Light Mode' : 'Dark Mode', desc: darkMode ? 'Switch to Light' : 'Switch to Dark', action: toggleDarkMode, isToggle: true },
        ]},
        { title: 'Support', items: [
          { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs', path: '/student/help' },
          { icon: Info, label: 'About', desc: 'Version, terms', path: '/student/about' },
        ]},
      ].map((section, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">{section.title}</p>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {section.items.map((item, j) => (
              item.isToggle ? (
                <button key={j} onClick={item.action} className="w-full flex items-center space-x-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-b border-gray-50 dark:border-gray-700/50 last:border-b-0">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center"><item.icon className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" /></div>
                  <div className="flex-1 text-left"><p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p><p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p></div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-maroon-800' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></div></div>
                </button>
              ) : (
                <Link key={j} to={item.path || '#'} onClick={item.action || undefined} className="flex items-center space-x-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-b border-gray-50 dark:border-gray-700/50 last:border-b-0">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center"><item.icon className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p><p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p></div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-500" />
                </Link>
              )
            ))}
          </div>
        </div>
      ))}

      {/* Logout — Mobile only */}
      <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition">
        <LogOut className="w-5 h-5" /><span>Logout</span>
      </button>
    </div>
  );
};

export default Profile;