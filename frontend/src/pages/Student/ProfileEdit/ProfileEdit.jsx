import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Users, Camera, Save, Loader2, Hash, GraduationCap, Calendar, Edit3, X, Shield, ArrowLeft } from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`} />
);

const ProfileEdit = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [profilePic, setProfilePic] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchHealthProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/student/health-profile', { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success && response.data.data) {
          setHealthProfile(response.data.data);
          setForm(prev => ({
            ...prev,
            guardian_name: response.data.data.emergency_name || '',
            guardian_contact: response.data.data.emergency_phone || '',
            emergency_contact_name: response.data.data.emergency_name || '',
            emergency_contact_number: response.data.data.emergency_phone || '',
          }));
        }
      } catch (err) { console.log('Health profile not found'); }
      finally { setFetching(false); }
    };
    fetchHealthProfile();
  }, []);

  const [form, setForm] = useState({
    mobile_number: user.mobile_number || '',
    address: user.profile?.address || '',
    guardian_name: '',
    guardian_contact: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setMessage('Image must be less than 2MB'); setMessageType('error'); return; }
      const reader = new FileReader();
      reader.onload = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true); setMessage('');
    try {
      const token = localStorage.getItem('token');
      await api.put('/student/profile', { mobile_number: form.mobile_number, address: form.address }, { headers: { Authorization: `Bearer ${token}` } });
      if (healthProfile) {
        await api.put('/student/health-profile', {
          emergency_contact_name: form.guardian_name || form.emergency_contact_name,
          emergency_contact_phone: form.guardian_contact || form.emergency_contact_number,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      const updatedUser = { ...user, mobile_number: form.mobile_number, profile: { ...(user.profile || {}), address: form.address } };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessageType('success');
      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally { setLoading(false); setTimeout(() => setMessage(''), 3000); }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      mobile_number: user.mobile_number || '',
      address: user.profile?.address || '',
      guardian_name: healthProfile?.emergency_name || '',
      guardian_contact: healthProfile?.emergency_phone || '',
      emergency_contact_name: healthProfile?.emergency_name || '',
      emergency_contact_number: healthProfile?.emergency_phone || '',
    });
    setMessage('');
  };

  const getAge = (birthday) => {
    if (!birthday) return 'N/A';
    const today = new Date(); const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const inputClass = "w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5";

  if (fetching) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-36 mb-1.5" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-20 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 text-center space-y-3">
              <Skeleton className="w-24 h-24 rounded-full mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-3">
              <Skeleton className="h-5 w-28" />
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[1,2].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-3">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 rounded-2xl" />
                  <Skeleton className="h-12 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 pb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/student/profile" className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Manage your personal information</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-maroon-800 text-white rounded-2xl font-semibold text-sm hover:bg-maroon-900 transition shadow-lg">
              <Edit3 className="w-4 h-4" /><span>Edit</span>
            </button>
          ) : (
            <>
              <button onClick={handleCancel} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"><X className="w-4 h-4" />Cancel</button>
              <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 bg-maroon-800 text-white rounded-2xl font-semibold text-sm hover:bg-maroon-900 transition shadow-lg disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-2xl text-sm text-center ${messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-maroon-100 dark:bg-maroon-900/30 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden border-4 border-white dark:border-gray-700 shadow-md">
                {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-maroon-600 dark:text-maroon-400" />}
              </div>
              {editing && (
                <button onClick={() => fileInputRef.current.click()} className="absolute bottom-1 right-1 w-8 h-8 bg-maroon-800 rounded-full flex items-center justify-center text-white hover:bg-maroon-900 transition shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">{user.first_name} {user.last_name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.student_id}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{user.course} - {user.year}{user.section}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Student Info</h3>
            <div className="space-y-2.5 text-sm">
              {[
                { icon: Hash, label: 'Student ID', value: user.student_id },
                { icon: GraduationCap, label: 'Course', value: `${user.course} - ${user.year}${user.section||''}` },
                { icon: Calendar, label: 'Birthday', value: user.birthday ? new Date(user.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                { icon: Calendar, label: 'Age', value: getAge(user.birthday) },
                { icon: User, label: 'Gender', value: user.gender || 'N/A' },
                { icon: Mail, label: 'Email', value: user.email },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />Personal Information
              {editing && <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(Editing)</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputClass} pl-10`} type="text" name="mobile_number" value={form.mobile_number} onChange={handleChange} placeholder="09XXXXXXXXX" disabled={!editing} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-gray-400" />
                  <textarea className={`${inputClass} pl-10 resize-none`} name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Enter your address" disabled={!editing} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />Emergency & Guardian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Guardian Name</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputClass} pl-10`} type="text" name="guardian_name" value={form.guardian_name} onChange={handleChange} placeholder="Guardian name" disabled={!editing} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Guardian Contact</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputClass} pl-10`} type="text" name="guardian_contact" value={form.guardian_contact} onChange={handleChange} placeholder="Guardian phone" disabled={!editing} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Emergency Contact Name</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputClass} pl-10`} type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Emergency contact name" disabled={!editing} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Emergency Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={`${inputClass} pl-10`} type="text" name="emergency_contact_number" value={form.emergency_contact_number} onChange={handleChange} placeholder="Emergency contact phone" disabled={!editing} />
                </div>
              </div>
            </div>
          </div>

          <Link to="/student/health-profile" className="block w-full text-center py-3 bg-maroon-50 dark:bg-maroon-900/20 text-maroon-700 dark:text-maroon-400 rounded-2xl font-semibold text-sm hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition">
            Update Full Health Profile →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;