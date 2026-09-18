import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2, Heart, Shield, ClipboardList, AlertCircle, Info } from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`} />
);

const HealthProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isFemale = user.gender === 'female' || user.gender === 'Female';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const totalSteps = 6;

  const [form, setForm] = useState({
    // Step 1: Emergency Contact
    emergency_name: '', emergency_relationship: '', emergency_phone: '',
    // Step 2: Medical History
    medical_history: [],
    allergy_details: '',
    other_medical_history: '',
    medications: '',
    // Step 3: Hospitalization, Surgery, COVID
    hospitalized: false, hospitalization_date: '', hospitalization_diagnosis: '',
    surgery: false, surgery_date: '', surgery_diagnosis: '',
    had_covid: false, covid_date: '', covid_diagnosis: '',
    // Step 4: Personal & Social History
    occupation: '', marital_status: '',
    tobacco_use: '', tobacco_amount: '', tobacco_duration: '',
    alcohol_use: '', other_substance_use: '',
    has_disability: false, disability_details: '',
    // Female-only
    last_menstrual_period: '', has_children: false, number_of_children: '',
    age_first_pregnancy: '', gravidity: false, term: false, premature: false,
    abortion: false, living_children: false,
    // Step 5: Family History
    family_history: [],
    // Step 6: Consent
    consent_signature: '', agree_privacy: false, agree_terms: false,
    consent_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    api.get('/student/health-profile').then(({ data }) => {
      if (active && data.data) setForm(current => Object.fromEntries(Object.entries(current).map(([key, initial]) => {
        let value = data.data[key] ?? initial;
        if (key.includes('date') || key === 'last_menstrual_period') value = typeof value === 'string' ? value.slice(0, 10) : value;
        return [key, value];
      })));
    }).catch(() => { if (active) setMessage('Unable to load saved health profile. Please refresh before editing.'); }).finally(() => { if (active) setPageLoading(false); });
    return () => { active = false; };
  }, []);

  // ==================== LISTS ====================
  const medicalHistoryList = [
    "Convulsion / Epilepsy", "Tonsillitis (Recurrent)", "Hypertension (High Blood Pressure)",
    "Heart Disease", "Bronchial Asthma", "Tuberculosis", "COVID-19", "Pneumonia",
    "Bleeding Tendencies", "Diabetes Mellitus (High Blood Sugar)", "Kidney Disease",
    "Hernia", "Hemorrhoids (Almoranas)"
  ];

  const familyHistoryList = [
    "Hypertension", "Heart Disease", "Kidney Problem", "Anemia",
    "Asthma", "Diabetes Mellitus", "Epilepsy", "Tuberculosis"
  ];

  // ==================== TOGGLE FUNCTIONS ====================
  const handleMedicalHistoryToggle = (condition) => {
    const current = form.medical_history;
    setForm({ ...form, medical_history: current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition] });
  };

  const handleFamilyHistoryToggle = (condition) => {
    const current = form.family_history;
    setForm({ ...form, family_history: current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition] });
  };

  // ==================== VALIDATION ====================
  const validateStep = (s) => {
    const newErrors = {};
    
    if (s === 1) {
      if (!form.emergency_name.trim()) newErrors.emergency_name = 'Full name is required';
      else if (!/^[A-Za-z\s\-'.]+$/.test(form.emergency_name)) newErrors.emergency_name = 'Letters, spaces, hyphens, apostrophes only';
      if (!form.emergency_relationship) newErrors.emergency_relationship = 'Relationship is required';
      if (!form.emergency_phone.trim()) newErrors.emergency_phone = 'Phone number is required';
      else if (!/^09\d{9}$/.test(form.emergency_phone.replace(/\s/g, ''))) newErrors.emergency_phone = 'Must be 11 digits starting with 09';
    }
    
    if (s === 6) {
      if (!form.consent_signature.trim()) newErrors.consent_signature = 'Full name is required as signature';
      else if (!/^[A-Za-z\s\-'.]+$/.test(form.consent_signature)) newErrors.consent_signature = 'Letters, spaces, hyphens, apostrophes only';
      if (!form.agree_privacy) newErrors.agree_privacy = 'You must agree to the Privacy Policy';
      if (!form.agree_terms) newErrors.agree_terms = 'You must agree to the Terms of Service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== HANDLERS ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formatted = type === 'checkbox' ? checked : value;

    if (name === 'emergency_phone') formatted = value.replace(/\D/g, '').slice(0, 11);
    if (['emergency_name', 'consent_signature'].includes(name)) formatted = value.replace(/[^A-Za-z\s\-'.]/g, '');

    setForm({ ...form, [name]: formatted });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const nextStep = () => { if (validateStep(step)) { setStep(step + 1); setMessage(''); } };
  const prevStep = () => { setStep(step - 1); setMessage(''); };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;
    setLoading(true); setMessage('');

    try {
      const token = localStorage.getItem('token');
      let payload = { ...form };
      
      if (!isFemale) {
        ['last_menstrual_period','has_children','number_of_children','age_first_pregnancy','gravidity','term','premature','abortion','living_children'].forEach(f => delete payload[f]);
      }

      let response;
      try {
        response = await api.put('/student/health-profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      } catch (updateErr) {
        if (updateErr.response?.status === 404) {
          response = await api.post('/student/health-profile', payload, { headers: { Authorization: `Bearer ${token}` } });
        } else throw updateErr;
      }

      if (response.data.success) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, profile: { ...(currentUser.profile || {}), health_profile_completed: true } }));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('healthProfileUpdated'));
        setMessageType('success');
        setMessage('Health Profile completed! Redirecting to dashboard...');
        setTimeout(() => navigate('/student/dashboard'), 1500);
      }
    } catch (err) {
      setMessageType('error');
      setErrors(Object.fromEntries(Object.entries(err.response?.data?.errors || {}).map(([key, values]) => [key, values[0]])));
      setMessage(Object.values(err.response?.data?.errors || {}).flat().join(' ') || err.response?.data?.message || 'Failed to save.');
    } finally { setLoading(false); }
  };

  // ==================== RENDER HELPERS ====================
  const steps = ['Emergency', 'Medical', 'History', 'Personal', 'Family', 'Consent'];
  const progress = Math.round((step / totalSteps) * 100);
  const inputClass = (field) => `w-full border rounded-2xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-maroon-500 transition ${errors[field] ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200'}`;
  const labelClass = 'text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5';
  const errorClass = 'text-red-500 text-xs mt-0.5';
  const optionalClass = 'text-[10px] text-gray-400 dark:text-gray-500 ml-1 font-normal italic';

  const YesNoButtons = ({ name, value, onChange }) => (
    <div className="flex items-center space-x-3">
      <button type="button" onClick={() => onChange({...form, [name]: false})} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${!value ? 'bg-maroon-800 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>No</button>
      <button type="button" onClick={() => onChange({...form, [name]: true})} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${value ? 'bg-maroon-800 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>Yes</button>
    </div>
  );

  const CheckboxGrid = ({ items, selected, onToggle }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item) => {
        const isSelected = selected.includes(item);
        return (
          <button key={item} type="button" onClick={() => onToggle(item)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border text-left text-sm font-medium transition-all ${
              isSelected ? 'bg-maroon-50 border-maroon-300 text-maroon-800 dark:bg-maroon-900/20 dark:border-maroon-600 dark:text-maroon-300'
              : 'bg-white border-gray-200 text-gray-600 hover:border-maroon-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
            }`}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${isSelected ? 'bg-maroon-800 border-maroon-800 dark:bg-maroon-600 dark:border-maroon-600' : 'border-gray-300 dark:border-gray-500'}`}>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span>{item}</span>
          </button>
        );
      })}
    </div>
  );

  // ==================== PAGE SKELETON LOADING ====================
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 lg:p-8">
          {/* Progress Bar Skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between mt-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-3 w-12" />)}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Navigation Skeleton */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 lg:p-8">
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2"><span>Step {step} of {totalSteps}</span><span>{progress}%</span></div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <motion.div className="h-2 bg-gradient-to-r from-maroon-800 to-maroon-900 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => <span key={i} className={`text-[10px] font-medium hidden sm:block ${step > i ? 'text-maroon-800 dark:text-maroon-400' : 'text-gray-300 dark:text-gray-600'}`}>{s}</span>)}
            <span className="text-[10px] font-medium sm:hidden">{steps[step-1]}</span>
          </div>
        </div>

        {message && <div className={`p-3 rounded-2xl text-sm text-center mb-4 ${messageType === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{message}</div>}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><Shield className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Emergency Contact</span></h3>
                <p className="text-xs text-gray-400">Who should we contact in case of emergency?</p>
                <div>
                  <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
                  <input className={inputClass('emergency_name')} name="emergency_name" value={form.emergency_name} onChange={handleChange} placeholder="Juan Dela Cruz" maxLength={100} />
                  {errors.emergency_name && <p className={errorClass}>{errors.emergency_name}</p>}
                </div>
                <div>
                  <label className={labelClass}>Relationship <span className="text-red-400">*</span></label>
                  <select className={inputClass('emergency_relationship')} name="emergency_relationship" value={form.emergency_relationship} onChange={handleChange}>
                    <option value="">Select</option><option>Parent</option><option>Guardian</option><option>Sibling</option><option>Spouse</option><option>Relative</option><option>Friend</option><option>Other</option>
                  </select>
                  {errors.emergency_relationship && <p className={errorClass}>{errors.emergency_relationship}</p>}
                </div>
                <div>
                  <label className={labelClass}>Phone Number <span className="text-red-400">*</span></label>
                  <input className={inputClass('emergency_phone')} name="emergency_phone" value={form.emergency_phone} onChange={handleChange} placeholder="09123456789" maxLength={11} inputMode="numeric" />
                  {errors.emergency_phone && <p className={errorClass}>{errors.emergency_phone}</p>}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><ClipboardList className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Medical History</span></h3>
                <p className="text-xs text-gray-400">Please check all illnesses that apply to you.</p>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">A. Past Medical History</label>
                  <CheckboxGrid items={medicalHistoryList} selected={form.medical_history} onToggle={handleMedicalHistoryToggle} />
                  {form.medical_history.length > 0 && <p className="text-xs text-maroon-600 mt-2">Selected: {form.medical_history.join(', ')}</p>}
                </div>
                <div><label className={labelClass}>B. Allergy to <span className={optionalClass}>(optional)</span></label><input className={inputClass('allergy_details')} name="allergy_details" value={form.allergy_details} onChange={handleChange} placeholder="Penicillin, Seafood, Dust, None" maxLength={255} /></div>
                <div><label className={labelClass}>C. Other Illness <span className={optionalClass}>(optional)</span></label><input className={inputClass('other_medical_history')} name="other_medical_history" value={form.other_medical_history} onChange={handleChange} placeholder="Specify other illness..." maxLength={255} /></div>
                <div><label className={labelClass}>D. Current Medications <span className={optionalClass}>(optional)</span></label><input className={inputClass('medications')} name="medications" value={form.medications} onChange={handleChange} placeholder="List medications or type None" maxLength={500} /></div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><AlertCircle className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Hospitalization, Surgery & COVID-19</span></h3>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-2xl p-3 flex items-start space-x-2"><Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /><p className="text-xs text-blue-700 dark:text-blue-400">All questions optional.</p></div>
                {[
                  { label: 'Have you been hospitalized?', name: 'hospitalized', dateName: 'hospitalization_date', diagName: 'hospitalization_diagnosis' },
                  { label: 'Have you undergone surgery?', name: 'surgery', dateName: 'surgery_date', diagName: 'surgery_diagnosis' },
                ].map(item => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">{item.label}</span><YesNoButtons name={item.name} value={form[item.name]} onChange={setForm} /></div>
                    {form[item.name] && (<><div><label className={labelClass}>Date</label><input type="date" className={inputClass(item.dateName)} name={item.dateName} value={form[item.dateName]} onChange={handleChange} /></div><div><label className={labelClass}>Diagnosis</label><input className={inputClass(item.diagName)} name={item.diagName} value={form[item.diagName]} onChange={handleChange} placeholder="Diagnosis..." maxLength={255} /></div></>)}
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">Have you tested positive for COVID-19?</span><YesNoButtons name="had_covid" value={form.had_covid} onChange={setForm} /></div>
                  {form.had_covid && (<><div><label className={labelClass}>Date</label><input type="date" className={inputClass('covid_date')} name="covid_date" value={form.covid_date} onChange={handleChange} /></div><div><label className={labelClass}>Diagnosis</label><input className={inputClass('covid_diagnosis')} name="covid_diagnosis" value={form.covid_diagnosis} onChange={handleChange} placeholder="Diagnosis..." maxLength={255} /></div></>)}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><Heart className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Personal & Social History</span></h3>
                <p className="text-xs text-gray-400">Optional. Helps us provide better care.</p>
                <div><label className={labelClass}>Occupation <span className={optionalClass}>(optional)</span></label><input className={inputClass('occupation')} name="occupation" value={form.occupation} onChange={handleChange} placeholder="Your occupation" maxLength={255} /></div>
                <div><label className={labelClass}>Marital Status <span className={optionalClass}>(optional)</span></label><select className={inputClass('marital_status')} name="marital_status" value={form.marital_status} onChange={handleChange}><option value="">Select</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option><option>Prefer not to say</option></select></div>
                <div>
                  <label className={labelClass}>Tobacco Use <span className={optionalClass}>(optional)</span></label>
                  <div className="flex gap-2">{['Never', 'Past', 'Present'].map(opt => <button key={opt} type="button" onClick={() => setForm({...form, tobacco_use: opt})} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${form.tobacco_use === opt ? 'bg-maroon-800 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>{opt}</button>)}</div>
                  {(form.tobacco_use === 'Past' || form.tobacco_use === 'Present') && (<div className="grid grid-cols-2 gap-3 mt-3"><div><label className={labelClass}>How much?</label><input className={inputClass('tobacco_amount')} name="tobacco_amount" value={form.tobacco_amount} onChange={handleChange} /></div><div><label className={labelClass}>How long?</label><input className={inputClass('tobacco_duration')} name="tobacco_duration" value={form.tobacco_duration} onChange={handleChange} /></div></div>)}
                </div>
                <div><label className={labelClass}>Alcohol Use <span className={optionalClass}>(optional)</span></label><select className={inputClass('alcohol_use')} name="alcohol_use" value={form.alcohol_use} onChange={handleChange}><option value="">Select</option><option>None</option><option>Occasional</option><option>Daily</option></select></div>
                <div><label className={labelClass}>Other Substance Use <span className={optionalClass}>(optional)</span></label><textarea className={inputClass('other_substance_use')} name="other_substance_use" value={form.other_substance_use} onChange={handleChange} rows={2} placeholder="Specify if any..." /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">Do you have a disability?</span><YesNoButtons name="has_disability" value={form.has_disability} onChange={setForm} /></div>
                  {form.has_disability && <div><label className={labelClass}>Please describe</label><input className={inputClass('disability_details')} name="disability_details" value={form.disability_details} onChange={handleChange} placeholder="Type of disability..." maxLength={500} /></div>}
                </div>
                {isFemale && (
                  <div className="border-t border-pink-200 dark:border-pink-800/30 pt-4 mt-4">
                    <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-3">Female Health Information <span className={optionalClass}>(optional)</span></p>
                    <div className="space-y-3">
                      <div><label className={labelClass}>Last Menstrual Period</label><input type="date" className={inputClass('last_menstrual_period')} name="last_menstrual_period" value={form.last_menstrual_period} onChange={handleChange} /></div>
                      <div className="space-y-2"><div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">Do you have children?</span><YesNoButtons name="has_children" value={form.has_children} onChange={setForm} /></div>
                        {form.has_children && (<div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Number of Children</label><input className={inputClass('number_of_children')} name="number_of_children" value={form.number_of_children} onChange={handleChange} type="number" min="0" /></div><div><label className={labelClass}>Age on First Pregnancy</label><input className={inputClass('age_first_pregnancy')} name="age_first_pregnancy" value={form.age_first_pregnancy} onChange={handleChange} type="number" min="0" /></div></div>)}
                      </div>
                      <div><label className={labelClass}>Obstetric History</label><div className="grid grid-cols-2 gap-2">{[{ name: 'gravidity', label: 'Gravidity' },{ name: 'term', label: 'Term' },{ name: 'premature', label: 'Premature' },{ name: 'abortion', label: 'Abortion' },{ name: 'living_children', label: 'Living Children' }].map(item => (<label key={item.name} className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"><input type="checkbox" name={item.name} checked={form[item.name]} onChange={handleChange} className="w-4 h-4 rounded accent-maroon-800" /><span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span></label>))}</div></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><ClipboardList className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Family Medical History</span></h3>
                <p className="text-xs text-gray-400">Select any conditions present in your immediate family. Optional.</p>
                <CheckboxGrid items={familyHistoryList} selected={form.family_history} onToggle={handleFamilyHistoryToggle} />
                {form.family_history.length > 0 && <p className="text-xs text-maroon-600 mt-2">Selected: {form.family_history.join(', ')}</p>}
              </div>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><Check className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Consent & Signature</span></h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl p-4 text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed"><strong>Important:</strong> I certify that all information is true. I consent to data processing per RA 10173.</div>
                <div><label className={labelClass}>Full Name (Electronic Signature) <span className="text-red-400">*</span></label><input className={inputClass('consent_signature')} name="consent_signature" value={form.consent_signature} onChange={handleChange} placeholder="Type your full name" maxLength={100} />{errors.consent_signature && <p className={errorClass}>{errors.consent_signature}</p>}</div>
                <div><label className={labelClass}>Date</label><input className={inputClass('consent_date')} value={form.consent_date} disabled className="bg-gray-50 dark:bg-gray-600 text-gray-500 cursor-not-allowed" /></div>
                <div className="flex items-start space-x-2"><input type="checkbox" name="agree_privacy" checked={form.agree_privacy} onChange={handleChange} className="mt-1 w-4 h-4 rounded accent-maroon-800 flex-shrink-0" /><span className="text-xs text-gray-500 dark:text-gray-400">I agree to the <span className="text-maroon-600 dark:text-maroon-400 underline">Privacy Policy</span> <span className="text-red-400">*</span></span></div>{errors.agree_privacy && <p className={errorClass}>{errors.agree_privacy}</p>}
                <div className="flex items-start space-x-2"><input type="checkbox" name="agree_terms" checked={form.agree_terms} onChange={handleChange} className="mt-1 w-4 h-4 rounded accent-maroon-800 flex-shrink-0" /><span className="text-xs text-gray-500 dark:text-gray-400">I agree to the <span className="text-maroon-600 dark:text-maroon-400 underline">Terms of Service</span> <span className="text-red-400">*</span></span></div>{errors.agree_terms && <p className={errorClass}>{errors.agree_terms}</p>}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          {step > 1 ? <button onClick={prevStep} className="flex items-center space-x-1 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><ArrowLeft className="w-4 h-4" /><span>Back</span></button> : <div />}
          {step < totalSteps ? (
            <button onClick={nextStep} className="flex items-center space-x-1 px-6 py-2.5 bg-maroon-800 text-white text-sm font-semibold rounded-xl hover:bg-maroon-900"><span>Next</span><ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex items-center space-x-1 px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 shadow-lg shadow-green-600/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{loading ? 'Saving...' : 'Submit Health Profile'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default HealthProfile;