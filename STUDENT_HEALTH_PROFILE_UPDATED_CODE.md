# Student Health Profile changes

Complete updated code for every changed source file follows below. Existing HealthProfile.jsx edits were preserved; the pre-existing Notifications.jsx changes were not touched.

## Fixes
- Authenticated students can open the Health Profile form whether their profile is missing, incomplete, or complete. The former onboarding route redirected completed students away from the editor. The existing Appointments and QR completion guards remain in place.
- Creates use POST; saved records use PUT. The existing unique user_id constraint and a creation transaction locking the user row prevent duplicate records. A conflict requires reloading before editing.
- Medical and family history selections, allergies, medications, optional health information, and consent remain editable. Legacy history selections and emergency relationships remain visible. Equivalent +63 emergency numbers load in the required local format.
- Frontend validation follows backend length, date, number, contact, and consent rules. Errors return students to the relevant step. Model limits now respect the shorter database columns.
- Student API date fields use YYYY-MM-DD to prevent UTC serialization moving a calendar date backwards. The success/data envelope, status response, and HTTP methods are unchanged. Nurse API date serialization is unchanged.

## Manual tests
1. Sign in as an existing student without a health profile. Open /student/health-profile directly and confirm the six-step form opens. Appointments must still require completion.
2. Complete emergency contact and consent. Enter medical history, allergy details, medications, past dates, and family history. Submit; confirm one POST succeeds and Appointments opens.
3. Reopen /student/health-profile as that completed student. Confirm no redirect occurs and saved values and dates load. Edit family history, medications, and allergy details; submit and reload. Confirm the PUT response has the same profile ID.
4. Clear all family and medical history selections; save and reload. Both should remain empty. Check female health fields with a female student account.
5. Test missing contact/consent, an invalid phone, a future medical date, number of children above 30, and age at first pregnancy below 1 or above 100. Confirm validation blocks submission and identifies the step. Names containing accented letters should work.
6. With a student who has an incomplete saved profile, load and complete it. Confirm the ID remains unchanged. With two tabs initially showing no profile, save in one then submit the other; the second should require a reload and there must still be only one profile row.
7. Simulate a failed profile GET; confirm editing stays unavailable and Retry reloads safely. Log out/in and verify completion still permits Appointments while incomplete profiles remain blocked. Check that the Nurse student record shows the saved family and medical history.

## Verification and database
- Production frontend build passed. Targeted frontend lint reported only an existing unused catch parameter in App.jsx. PHP syntax checks passed.
- Database-independent checks passed for valid/invalid profile validation, database string limits, family history, calendar dates, and partial-update validation.
- Feature tests could not run assertions: the configured isolated MySQL test database at 127.0.0.1:3307 refused connections, both inside and outside the sandbox.
- No migration or application database command is required. Once the configured test database is available and migrated, run from backend:

```powershell
& 'C:/wamp64/bin/php/php8.2.26/php.exe' vendor/bin/phpunit tests/Feature/StudentHealthProfileTest.php
```

## Shared dependencies
No Nurse portal files or routes changed. HealthProfile is a shared model, but only submission validation limits changed; its fields, casts, completion rules, and relationships are unchanged. Only the Student controller currently calls validationRules(). Authentication, appointment, QR, queue, and notification implementation files were not edited. Full database-backed integration verification remains pending.

## frontend/src/App.jsx

```jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from 'react-router-dom';

import { useCallback, useEffect, useState } from 'react';

import Landing from './pages/Landing/Landing';

import Login from './pages/Student/Login';
import Register from './pages/Student/Register';
import ForgotPassword from './pages/Student/ForgotPassword';
import ResetPassword from './pages/Student/ResetPassword';

import Welcome from './pages/Student/Welcome/Welcome';
import HealthProfile from './pages/Student/HealthProfile/HealthProfile';
import Appointments from './pages/Student/Appointments/Appointments';
import QR from './pages/Student/QR/QR';
import Profile from './pages/Student/Profile/Profile';
import ProfileEdit from './pages/Student/ProfileEdit/ProfileEdit';
import Alerts from './pages/Student/Alerts/Alerts';
import Announcements from './pages/Student/Announcements/Announcements';
import HealthRecords from './pages/Student/HealthRecords/HealthRecords';
import Settings from './pages/Student/Settings/Settings';
import Help from './pages/Student/Help/Help';
import About from './pages/Student/About/About';

import StudentLayout from './layouts/StudentLayout';

import NurseLogin from './pages/Admin/Login/NurseLogin';
import NurseDashboard from './pages/Admin/Dashboard/NurseDashboard';
import NurseAppointments from './pages/Admin/Appointments/NurseAppointments';
import NurseStudents from './pages/Admin/Students/NurseStudents';
import NurseConsultation from './pages/Admin/Consultation/NurseConsultation';
import NurseMedicine from './pages/Admin/Medicine/NurseMedicine';
import NurseRecords from './pages/Admin/Records/NurseRecords';
import NurseNotifications from './pages/Admin/Notifications/NurseNotifications';
import NurseAnnouncements from './pages/Admin/Announcements/NurseAnnouncements';
import NurseSettings from './pages/Admin/Settings/NurseSettings';

import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import KioskPage from './pages/Kiosk/KioskPage';
import AppErrorBoundary from './components/AppErrorBoundary';

import api from './services/api';

/*
 * ============================================================
 * HEALTH PROFILE STATUS
 * ============================================================
 *
 * IMPORTANT:
 * The backend/database is the source of truth.
 *
 * We do NOT rely only on:
 * user.profile.health_profile_completed
 *
 * because localStorage can be stale on:
 * - another device
 * - another browser
 * - an old login session
 *
 * Backend endpoint:
 * GET /api/student/health-profile/status
 *
 * Expected:
 * {
 *   success: true,
 *   data: {
 *     exists: true|false,
 *     completed: true|false
 *   }
 * }
 */

/*
 * Cache only COMPLETED=true results.
 *
 * Why:
 * - completed students avoid a second duplicate request when
 *   /student redirects immediately to /student/appointments.
 *
 * We intentionally DO NOT cache incomplete=false.
 *
 * This prevents this sequence:
 * 1. student is incomplete
 * 2. backend returns false
 * 3. student completes Health Profile
 * 4. old cached false incorrectly blocks Appointments
 *
 * Cache is also tied to the current auth token so another
 * student cannot inherit another user's result.
 */
let completedHealthProfileCache = {
  token: null,
  completed: false,
  fetchedAt: 0,
};

const COMPLETED_STATUS_CACHE_MS = 60 * 1000;

/*
 * Safely read the locally stored authenticated user.
 *
 * Local data is used only for UI synchronization.
 * It is NOT the final authority for Health Profile completion.
 */
const getStoredStudent = () => {
  try {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

/*
 * Normalize boolean/integer/string representations.
 */
const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === '1' ||
  value === 'true';

/*
 * Synchronize the backend result into localStorage.
 *
 * This keeps older Student pages that still read:
 *
 * user.profile.health_profile_completed
 *
 * consistent with the actual DB value.
 */
const syncStoredHealthProfileStatus = (completed) => {
  try {
    const currentUser = getStoredStudent();

    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,

      profile: {
        ...(currentUser.profile || {}),
        health_profile_completed: Boolean(completed),
      },
    };

    localStorage.setItem(
      'user',
      JSON.stringify(updatedUser)
    );

    /*
     * Same-tab storage events do not fire automatically,
     * so notify any Student components listening for updates.
     */
    window.dispatchEvent(
      new CustomEvent('carelink:student-user-updated', {
        detail: {
          user: updatedUser,
        },
      })
    );
  } catch {
    /*
     * Failure to synchronize localStorage must never block
     * the actual backend-derived routing decision.
     */
  }
};

/*
 * Fetch authoritative completion state.
 */
const fetchHealthProfileStatus = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authenticated Student session.');
  }

  const now = Date.now();

  const hasValidCompletedCache =
    completedHealthProfileCache.token === token &&
    completedHealthProfileCache.completed === true &&
    now - completedHealthProfileCache.fetchedAt <
      COMPLETED_STATUS_CACHE_MS;

  if (hasValidCompletedCache) {
    return {
      exists: true,
      completed: true,
    };
  }

  const response = await api.get(
    '/student/health-profile/status'
  );

  const data = response.data?.data || {};

  const status = {
    exists: toBoolean(data.exists),
    completed: toBoolean(data.completed),
  };

  /*
   * Cache TRUE only.
   */
  if (status.completed) {
    completedHealthProfileCache = {
      token,
      completed: true,
      fetchedAt: now,
    };
  } else {
    /*
     * Never preserve an incomplete result.
     */
    completedHealthProfileCache = {
      token: null,
      completed: false,
      fetchedAt: 0,
    };
  }

  syncStoredHealthProfileStatus(status.completed);

  return status;
};

/*
 * ============================================================
 * STATUS HOOK
 * ============================================================
 */

const useStudentHealthProfileStatus = () => {
  const [state, setState] = useState({
    loading: true,
    completed: false,
    exists: false,
    error: '',
  });

  const checkStatus = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const status = await fetchHealthProfileStatus();

      setState({
        loading: false,
        completed: status.completed,
        exists: status.exists,
        error: '',
      });
    } catch (error) {
      /*
       * Do not expose raw Axios / SQL / Laravel messages.
       */
      setState({
        loading: false,
        completed: false,
        exists: false,
        error:
          'We could not verify your Health Profile. Please try again.',
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    ...state,
    retry: checkStatus,
  };
};

/*
 * ============================================================
 * LOADING STATE
 * ============================================================
 */

const StudentRouteLoading = ({
  message = 'Preparing your student portal...',
}) => (
  <div className="flex min-h-[55vh] items-center justify-center px-4">
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 dark:bg-maroon-950/30">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-maroon-200 border-t-maroon-700 dark:border-maroon-900 dark:border-t-maroon-300" />
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
        {message}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Checking your clinic profile...
      </p>
    </div>
  </div>
);

/*
 * ============================================================
 * SAFE STATUS ERROR
 * ============================================================
 */

const StudentRouteStatusError = ({ retry }) => (
  <div className="flex min-h-[55vh] items-center justify-center px-4">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl dark:bg-red-950/30">
        !
      </div>

      <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
        Unable to verify your Health Profile
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
        Please check your connection and try again. Your saved
        information has not been changed.
      </p>

      <button
        type="button"
        onClick={retry}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-maroon-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-500/30"
      >
        Try Again
      </button>
    </div>
  </div>
);

/*
 * ============================================================
 * /student
 * ============================================================
 *
 * First-time / incomplete:
 *   → /student/health-profile
 *
 * Completed in the ACTUAL database:
 *   → /student/appointments
 *
 * Works even when the student logs in using another device,
 * because the backend is checked after authentication.
 */
const StudentHomeRedirect = () => {
  const {
    loading,
    completed,
    error,
    retry,
  } = useStudentHealthProfileStatus();

  if (loading) {
    return (
      <StudentRouteLoading message="Opening your student portal..." />
    );
  }

  if (error) {
    return <StudentRouteStatusError retry={retry} />;
  }

  return (
    <Navigate
      to={
        completed
          ? '/student/appointments'
          : '/student/health-profile'
      }
      replace
    />
  );
};

/*
 * ============================================================
 * HEALTH PROFILE FORM
 * ============================================================
 *
 * Both incomplete and completed students can open the form.
 * HealthProfile loads the saved record itself. Completion is
 * required only for clinic services, never for editing this form.
 */
const HealthProfileOnboardingRoute = () => {
  return <HealthProfile />;
};

/*
 * ============================================================
 * CLINIC SERVICE GUARD
 * ============================================================
 *
 * Appointments / QR require a completed Health Profile.
 *
 * Backend/database remains authoritative.
 *
 * This guard deliberately performs the real status check
 * instead of trusting old localStorage data.
 */
const HealthProfileRequired = ({ children }) => {
  const {
    loading,
    completed,
    error,
    retry,
  } = useStudentHealthProfileStatus();

  if (loading) {
    return (
      <StudentRouteLoading message="Checking clinic access..." />
    );
  }

  if (error) {
    return <StudentRouteStatusError retry={retry} />;
  }

  if (!completed) {
    return (
      <Navigate
        to="/student/health-profile"
        replace
      />
    );
  }

  return children;
};

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ==================================================
              PUBLIC
          ================================================== */}

          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* ==================================================
              KIOSK
          ================================================== */}

          <Route
            path="/kiosk"
            element={<KioskPage />}
          />

          {/* ==================================================
              HIDDEN NURSE LOGIN
          ================================================== */}

          <Route
            path="/carelink-portal"
            element={<NurseLogin />}
          />

          {/* ==================================================
              STUDENT
          ================================================== */}

          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentLayout>
                  <Outlet />
                </StudentLayout>
              </ProtectedRoute>
            }
          >
            {/*
              Main Student landing route.

              DB determines whether this Student needs onboarding.
            */}
            <Route
              index
              element={<StudentHomeRedirect />}
            />

            {/*
              Existing route retained for compatibility.
            */}
            <Route
              path="welcome"
              element={<Welcome />}
            />

            {/*
              Health Profile completion and editing for all students.
            */}
            <Route
              path="health-profile"
              element={<HealthProfileOnboardingRoute />}
            />

            {/*
              Dashboard no longer exists in active Student UX.

              Old bookmarks safely resolve to the normal Student
              landing decision.
            */}
            <Route
              path="dashboard"
              element={<StudentHomeRedirect />}
            />

            {/*
              Clinic services requiring completed Health Profile.
            */}
            <Route
              path="appointments"
              element={
                <HealthProfileRequired>
                  <Appointments />
                </HealthProfileRequired>
              }
            />

            <Route
              path="qr"
              element={
                <HealthProfileRequired>
                  <QR />
                </HealthProfileRequired>
              }
            />

            {/* ==================================================
                STUDENT ACCOUNT
            ================================================== */}

            <Route
              path="profile"
              element={<Profile />}
            />

            <Route
              path="profile/edit"
              element={<ProfileEdit />}
            />

            {/* ==================================================
                ALERTS
            ================================================== */}

            {/*
              Bell destination.

              Alerts.jsx will be refined later so Notifications +
              Announcements feel like one unified Student inbox.
            */}
            <Route
              path="alerts"
              element={<Alerts />}
            />

            {/*
              Legacy route retained so existing links/bookmarks
              do not break.

              We can later redirect this to Alerts after reviewing
              the current Announcements implementation.
            */}
            <Route
              path="announcements"
              element={<Announcements />}
            />

            {/* ==================================================
                HEALTH RECORDS
            ================================================== */}

            <Route
              path="health-records"
              element={<HealthRecords />}
            />

            {/* ==================================================
                ACCOUNT CENTER
            ================================================== */}

            {/*
              These routes are intentionally NOT sidebar items.

              They are accessed from the upper-right Account menu.
            */}
            <Route
              path="settings"
              element={<Settings />}
            />

            <Route
              path="help"
              element={<Help />}
            />

            <Route
              path="about"
              element={<About />}
            />
          </Route>

          {/* ==================================================
              NURSE
              UNCHANGED
          ================================================== */}

          <Route
            path="/nurse"
            element={
              <ProtectedRoute role="nurse">
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={<NurseDashboard />}
            />

            <Route
              path="appointments"
              element={<NurseAppointments />}
            />

            <Route
              path="students"
              element={<NurseStudents />}
            />

            <Route
              path="consultation"
              element={<NurseConsultation />}
            />

            <Route
              path="medicines"
              element={<NurseMedicine />}
            />

            <Route
              path="records"
              element={<NurseRecords />}
            />

            <Route
              path="notifications"
              element={<NurseNotifications />}
            />

            <Route
              path="announcements"
              element={<NurseAnnouncements />}
            />

            <Route
              path="settings"
              element={<NurseSettings />}
            />
          </Route>

          {/* ==================================================
              404
          ================================================== */}

          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">
                    404
                  </h1>

                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Page not found
                  </p>

                  <a
                    href="/"
                    className="mt-4 inline-block font-medium text-maroon-700 hover:text-maroon-900 dark:text-maroon-300 dark:hover:text-maroon-200"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
```

## frontend/src/pages/Student/HealthProfile/HealthProfile.jsx

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2, Heart, Shield, ClipboardList, AlertCircle, Info } from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`} />
);

const getManilaDateString = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const fieldSteps = {
  emergency_name: 1, emergency_relationship: 1, emergency_phone: 1,
  medical_history: 2, allergy_details: 2, other_medical_history: 2, medications: 2,
  hospitalized: 3, hospitalization_date: 3, hospitalization_diagnosis: 3,
  surgery: 3, surgery_date: 3, surgery_diagnosis: 3, had_covid: 3, covid_date: 3, covid_diagnosis: 3,
  occupation: 4, marital_status: 4, tobacco_use: 4, tobacco_amount: 4, tobacco_duration: 4,
  alcohol_use: 4, other_substance_use: 4, has_disability: 4, disability_details: 4,
  last_menstrual_period: 4, has_children: 4, number_of_children: 4, age_first_pregnancy: 4,
  gravidity: 4, term: 4, premature: 4, abortion: 4, living_children: 4,
  family_history: 5, consent_signature: 6, consent_date: 6, agree_privacy: 6, agree_terms: 6,
};

const textLimits = {
  emergency_name: 100, emergency_relationship: 100, consent_signature: 191,
  allergy_details: 191, other_medical_history: 191, hospitalization_diagnosis: 191,
  surgery_diagnosis: 191, covid_diagnosis: 191, occupation: 191,
  marital_status: 50, tobacco_use: 20, tobacco_amount: 100, tobacco_duration: 100, alcohol_use: 20,
  medications: 2000, other_substance_use: 2000, disability_details: 2000,
};

const HealthProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isFemale = user.gender === 'female' || user.gender === 'Female';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profileExists, setProfileExists] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const totalSteps = 6;

  const [form, setForm] = useState({
    emergency_name: '', emergency_relationship: '', emergency_phone: '',
    medical_history: [],
    allergy_details: '',
    other_medical_history: '',
    medications: '',
    hospitalized: false, hospitalization_date: '', hospitalization_diagnosis: '',
    surgery: false, surgery_date: '', surgery_diagnosis: '',
    had_covid: false, covid_date: '', covid_diagnosis: '',
    occupation: '', marital_status: '',
    tobacco_use: '', tobacco_amount: '', tobacco_duration: '',
    alcohol_use: '', other_substance_use: '',
    has_disability: false, disability_details: '',
    last_menstrual_period: '', has_children: false, number_of_children: '',
    age_first_pregnancy: '', gravidity: false, term: false, premature: false,
    abortion: false, living_children: false,
    family_history: [],
    consent_signature: '', agree_privacy: false, agree_terms: false,
    consent_date: getManilaDateString(),
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    setLoadFailed(false);
    api.get('/student/health-profile').then(({ data }) => {
      if (!active) return;
      if (data?.success !== true) throw new Error('Profile could not be loaded');
      setProfileExists(Boolean(data.data));
      if (data.data) {
        setForm(current => Object.fromEntries(Object.entries(current).map(([key, initial]) => {
          let value = data.data[key] ?? initial;
          // A saved profile may contain nulls or JSON-backed list values.
          if (key === 'medical_history' || key === 'family_history') {
            value = Array.isArray(value) ? value : [];
          } else if (key === 'consent_date') {
            value = getManilaDateString();
          } else if (key === 'emergency_phone') {
            value = String(value).replace(/[\s\-()]/g, '').replace(/^\+63/, '0');
          } else if (key.includes('date') || key === 'last_menstrual_period') {
            value = typeof value === 'string' ? value.slice(0, 10) : '';
          }
          return [key, value];
        })));
      }
      setMessage('');
    }).catch(() => {
      if (active) {
        // Never show an empty editable form when an existing record may have failed to load.
        setLoadFailed(true);
        setMessageType('error');
        setMessage('Your saved health profile could not be loaded. No changes have been made. Please try again.');
      }
    }).finally(() => { if (active) setPageLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

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

  const handleMedicalHistoryToggle = (condition) => {
    const current = form.medical_history;
    setForm({ ...form, medical_history: current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition] });
  };

  const handleFamilyHistoryToggle = (condition) => {
    const current = form.family_history;
    setForm({ ...form, family_history: current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition] });
  };

  const validateStep = (s) => {
    const newErrors = {};

    if (s === 1) {
      if (!form.emergency_name.trim()) newErrors.emergency_name = 'Full name is required';
      if (!form.emergency_relationship.trim()) newErrors.emergency_relationship = 'Relationship is required';
      if (!form.emergency_phone.trim()) newErrors.emergency_phone = 'Phone number is required';
      else if (!/^09\d{9}$/.test(form.emergency_phone)) newErrors.emergency_phone = 'Must be 11 digits starting with 09';
    }

    if (s === 6) {
      if (!form.consent_signature.trim()) newErrors.consent_signature = 'Full name is required as signature';
      if (!form.agree_privacy) newErrors.agree_privacy = 'You must agree to the Privacy Policy';
      if (!form.agree_terms) newErrors.agree_terms = 'You must agree to the Terms of Service';
    }

    Object.entries(textLimits).forEach(([field, limit]) => {
      if (fieldSteps[field] === s && [...form[field].trim()].length > limit) {
        newErrors[field] = `${field.replaceAll('_', ' ')} must be at most ${limit} characters`;
      }
    });
    ['hospitalization_date', 'surgery_date', 'covid_date', ...(isFemale ? ['last_menstrual_period'] : [])].forEach(field => {
      const value = form[field];
      if (fieldSteps[field] === s && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value > getManilaDateString())) {
        newErrors[field] = `${field.replaceAll('_', ' ')} must be a valid date no later than today`;
      }
    });
    if (s === 4 && isFemale) {
      [['number_of_children', 0, 30], ['age_first_pregnancy', 1, 100]].forEach(([field, min, max]) => {
        if (form[field] !== '' && (!/^\d+$/.test(String(form[field])) || Number(form[field]) < min || Number(form[field]) > max)) {
          newErrors[field] = `${field.replaceAll('_', ' ')} must be a whole number from ${min} to ${max}`;
        }
      });
    }
    if (s === 2 || s === 5) {
      const field = s === 2 ? 'medical_history' : 'family_history';
      if (form[field].some(value => typeof value !== 'string' || [...value].length > 255)) {
        newErrors[field] = 'Each history entry must be text of at most 255 characters';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formatted = type === 'checkbox' ? checked : value;

    if (name === 'emergency_phone') formatted = value.replace(/\D/g, '').slice(0, 11);

    setForm({ ...form, [name]: formatted });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const nextStep = () => { if (validateStep(step)) { setStep(step + 1); setMessage(''); } };
  const prevStep = () => { setStep(step - 1); setMessage(''); };

  const handleSubmit = async () => {
    if (loading || loadFailed) return;
    for (let currentStep = 1; currentStep <= totalSteps; currentStep++) {
      if (!validateStep(currentStep)) { setStep(currentStep); return; }
    }
    setLoading(true); setMessage('');

    try {
      const token = localStorage.getItem('token');
      let payload = { ...form, consent_date: getManilaDateString() };

      if (!isFemale) {
        ['last_menstrual_period','has_children','number_of_children','age_first_pregnancy','gravidity','term','premature','abortion','living_children'].forEach(f => delete payload[f]);
      }

      const response = await api[profileExists ? 'put' : 'post']('/student/health-profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.data.success) throw new Error('Profile could not be saved');

      if (response.data.success) {
        setProfileExists(true);
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, profile: { ...(currentUser.profile || {}), health_profile_completed: true } }));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('healthProfileUpdated'));
        setMessageType('success');
        setMessage('Health Profile completed! Redirecting to appointments...');
        setTimeout(() => navigate('/student/appointments'), 1500);
      }
    } catch (err) {
      setMessageType('error');
      if (err.response?.status === 409 || err.response?.status === 404) setLoadFailed(true);
      const firstInvalidField = Object.keys(err.response?.data?.errors || {})[0]?.split('.')[0];
      if (fieldSteps[firstInvalidField]) setStep(fieldSteps[firstInvalidField]);
      setErrors(Object.fromEntries(Object.entries(err.response?.data?.errors || {}).map(([key, values]) => [key, values[0]])));
      setMessage(Object.values(err.response?.data?.errors || {}).flat().join(' ') || err.response?.data?.message || 'Failed to save.');
    } finally { setLoading(false); }
  };

  const steps = ['Emergency', 'Medical', 'History', 'Personal', 'Family', 'Consent'];
  const progress = Math.round((step / totalSteps) * 100);
  const inputClass = (field) => `w-full border rounded-2xl px-4 py-3 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-maroon-500 transition ${errors[field] ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200'}`;
  const labelClass = 'text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5';
  const errorClass = 'text-red-500 text-xs mt-0.5';
  const optionalClass = 'text-[11px] text-gray-600 dark:text-gray-300 ml-1 font-normal italic';

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

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 lg:p-8">
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

          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
        <div role="alert" className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 lg:p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unable to load health profile</h2>
          <p className="text-sm text-gray-700 dark:text-gray-200">Your saved information is safe. To avoid accidentally replacing existing medical information, editing is unavailable until your record loads.</p>
          <button type="button" onClick={() => setReloadKey(key => key + 1)} className="px-5 py-3 rounded-xl bg-maroon-800 text-white font-semibold hover:bg-maroon-900">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 lg:p-8">

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
        {Object.keys(errors).length > 0 && <div role="alert" className="p-3 rounded-2xl text-sm mb-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">{Object.values(errors).filter(Boolean).join('. ')}</div>}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

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
                    {form.emergency_relationship && !['Parent', 'Guardian', 'Sibling', 'Spouse', 'Relative', 'Friend', 'Other'].includes(form.emergency_relationship) && <option>{form.emergency_relationship}</option>}
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

            {step === 2 && (
              <div className="space-y-5">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><ClipboardList className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Medical History</span></h3>
                <p className="text-xs text-gray-400">Please check all illnesses that apply to you.</p>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">A. Past Medical History</label>
                  <CheckboxGrid items={[...new Set([...medicalHistoryList, ...form.medical_history])]} selected={form.medical_history} onToggle={handleMedicalHistoryToggle} />
                  {form.medical_history.length > 0 && <p className="text-xs text-maroon-600 mt-2">Selected: {form.medical_history.join(', ')}</p>}
                </div>
                <div><label className={labelClass}>B. Allergy to <span className={optionalClass}>(optional)</span></label><input className={inputClass('allergy_details')} name="allergy_details" value={form.allergy_details} onChange={handleChange} placeholder="Penicillin, Seafood, Dust, None" maxLength={191} /></div>
                <div><label className={labelClass}>C. Other Illness <span className={optionalClass}>(optional)</span></label><input className={inputClass('other_medical_history')} name="other_medical_history" value={form.other_medical_history} onChange={handleChange} placeholder="Specify other illness..." maxLength={191} /></div>
                <div><label className={labelClass}>D. Current Medications <span className={optionalClass}>(optional)</span></label><input className={inputClass('medications')} name="medications" value={form.medications} onChange={handleChange} placeholder="List medications or type None" maxLength={2000} /></div>
              </div>
            )}

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
                    {form[item.name] && (<><div><label className={labelClass}>Date</label><input type="date" max={getManilaDateString()} className={inputClass(item.dateName)} name={item.dateName} value={form[item.dateName]} onChange={handleChange} /></div><div><label className={labelClass}>Diagnosis</label><input className={inputClass(item.diagName)} name={item.diagName} value={form[item.diagName]} onChange={handleChange} placeholder="Diagnosis..." maxLength={191} /></div></>)}
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">Have you tested positive for COVID-19?</span><YesNoButtons name="had_covid" value={form.had_covid} onChange={setForm} /></div>
                  {form.had_covid && (<><div><label className={labelClass}>Date</label><input type="date" max={getManilaDateString()} className={inputClass('covid_date')} name="covid_date" value={form.covid_date} onChange={handleChange} /></div><div><label className={labelClass}>Diagnosis</label><input className={inputClass('covid_diagnosis')} name="covid_diagnosis" value={form.covid_diagnosis} onChange={handleChange} placeholder="Diagnosis..." maxLength={191} /></div></>)}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><Heart className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Personal & Social History</span></h3>
                <p className="text-xs text-gray-400">Optional. Helps us provide better care.</p>
                <div><label className={labelClass}>Occupation <span className={optionalClass}>(optional)</span></label><input className={inputClass('occupation')} name="occupation" value={form.occupation} onChange={handleChange} placeholder="Your occupation" maxLength={191} /></div>
                <div><label className={labelClass}>Marital Status <span className={optionalClass}>(optional)</span></label><select className={inputClass('marital_status')} name="marital_status" value={form.marital_status} onChange={handleChange}><option value="">Select</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option><option>Prefer not to say</option></select></div>
                <div>
                  <label className={labelClass}>Tobacco Use <span className={optionalClass}>(optional)</span></label>
                  <div className="flex gap-2">{['Never', 'Past', 'Present'].map(opt => <button key={opt} type="button" onClick={() => setForm({...form, tobacco_use: opt})} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${form.tobacco_use === opt ? 'bg-maroon-800 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>{opt}</button>)}</div>
                  {(form.tobacco_use === 'Past' || form.tobacco_use === 'Present') && (<div className="grid grid-cols-2 gap-3 mt-3"><div><label className={labelClass}>How much?</label><input className={inputClass('tobacco_amount')} name="tobacco_amount" maxLength={100} value={form.tobacco_amount} onChange={handleChange} /></div><div><label className={labelClass}>How long?</label><input className={inputClass('tobacco_duration')} name="tobacco_duration" maxLength={100} value={form.tobacco_duration} onChange={handleChange} /></div></div>)}
                </div>
                <div><label className={labelClass}>Alcohol Use <span className={optionalClass}>(optional)</span></label><select className={inputClass('alcohol_use')} name="alcohol_use" value={form.alcohol_use} onChange={handleChange}><option value="">Select</option><option>None</option><option>Occasional</option><option>Daily</option></select></div>
                <div><label className={labelClass}>Other Substance Use <span className={optionalClass}>(optional)</span></label><textarea className={inputClass('other_substance_use')} name="other_substance_use" maxLength={2000} value={form.other_substance_use} onChange={handleChange} rows={2} placeholder="Specify if any..." /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">Do you have a disability?</span><YesNoButtons name="has_disability" value={form.has_disability} onChange={setForm} /></div>
                  {form.has_disability && <div><label className={labelClass}>Please describe</label><input className={inputClass('disability_details')} name="disability_details" value={form.disability_details} onChange={handleChange} placeholder="Type of disability..." maxLength={2000} /></div>}
                </div>
                {isFemale && (
                  <div className="border-t border-pink-200 dark:border-pink-800/30 pt-4 mt-4">
                    <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-3">Female Health Information <span className={optionalClass}>(optional)</span></p>
                    <div className="space-y-3">
                      <div><label className={labelClass}>Last Menstrual Period</label><input type="date" max={getManilaDateString()} className={inputClass('last_menstrual_period')} name="last_menstrual_period" value={form.last_menstrual_period} onChange={handleChange} /></div>
                      <div className="space-y-2"><div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"><span className="text-sm">Do you have children?</span><YesNoButtons name="has_children" value={form.has_children} onChange={setForm} /></div>
                        {form.has_children && (<div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Number of Children</label><input className={inputClass('number_of_children')} name="number_of_children" value={form.number_of_children} onChange={handleChange} type="number" min="0" max="30" step="1" /></div><div><label className={labelClass}>Age on First Pregnancy</label><input className={inputClass('age_first_pregnancy')} name="age_first_pregnancy" value={form.age_first_pregnancy} onChange={handleChange} type="number" min="1" max="100" step="1" /></div></div>)}
                      </div>
                      <div><label className={labelClass}>Obstetric History</label><div className="grid grid-cols-2 gap-2">{[{ name: 'gravidity', label: 'Gravidity' },{ name: 'term', label: 'Term' },{ name: 'premature', label: 'Premature' },{ name: 'abortion', label: 'Abortion' },{ name: 'living_children', label: 'Living Children' }].map(item => (<label key={item.name} className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"><input type="checkbox" name={item.name} checked={form[item.name]} onChange={handleChange} className="w-4 h-4 rounded accent-maroon-800" /><span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span></label>))}</div></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><ClipboardList className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Family Medical History</span></h3>
                <p className="text-xs text-gray-700 dark:text-gray-300">Select any conditions present in your immediate family. Leave unchecked if none are known. You can update this information later.</p>
                <CheckboxGrid items={[...new Set([...familyHistoryList, ...form.family_history])]} selected={form.family_history} onToggle={handleFamilyHistoryToggle} />
                {form.family_history.length > 0 && <p className="text-xs text-maroon-600 mt-2">Selected: {form.family_history.join(', ')}</p>}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2"><Check className="w-5 h-5 text-maroon-800 dark:text-maroon-400" /><span>Consent & Signature</span></h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl p-4 text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed"><strong>Important:</strong> I certify that all information is true. I consent to data processing per RA 10173.</div>
                <div><label className={labelClass}>Full Name (Electronic Signature) <span className="text-red-400">*</span></label><input className={inputClass('consent_signature')} name="consent_signature" value={form.consent_signature} onChange={handleChange} placeholder="Type your full name" maxLength={191} />{errors.consent_signature && <p className={errorClass}>{errors.consent_signature}</p>}</div>
                <div><label className={labelClass}>Date</label><input className={`${inputClass('consent_date')} bg-gray-50 dark:bg-gray-600 text-gray-500 cursor-not-allowed`} value={form.consent_date} disabled /></div>
                <div className="flex items-start space-x-2"><input type="checkbox" name="agree_privacy" checked={form.agree_privacy} onChange={handleChange} className="mt-1 w-4 h-4 rounded accent-maroon-800 flex-shrink-0" /><span className="text-xs text-gray-500 dark:text-gray-400">I agree to the <span className="text-maroon-600 dark:text-maroon-400 underline">Privacy Policy</span> <span className="text-red-400">*</span></span></div>{errors.agree_privacy && <p className={errorClass}>{errors.agree_privacy}</p>}
                <div className="flex items-start space-x-2"><input type="checkbox" name="agree_terms" checked={form.agree_terms} onChange={handleChange} className="mt-1 w-4 h-4 rounded accent-maroon-800 flex-shrink-0" /><span className="text-xs text-gray-500 dark:text-gray-400">I agree to the <span className="text-maroon-600 dark:text-maroon-400 underline">Terms of Service</span> <span className="text-red-400">*</span></span></div>{errors.agree_terms && <p className={errorClass}>{errors.agree_terms}</p>}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

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
```

## backend/app/Http/Controllers/Api/Student/HealthProfileController.php

```php
<?php
namespace App\Http\Controllers\Api\Student;
use App\Http\Controllers\Controller;
use App\Models\HealthProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
class HealthProfileController extends Controller
{
    public function show() { return response()->json(['success' => true, 'data' => $this->profileData(auth()->user()->healthProfile()->first())]); }
    public function checkStatus()
    {
        $profile = HealthProfile::where('user_id', auth()->id())->first();
        return response()->json(['success' => true, 'data' => ['exists' => (bool) $profile, 'completed' => $profile && $profile->isComplete()]]);
    }
    public function store(Request $request)
    {
        $profile = DB::transaction(function () use ($request) {
            // Lock the existing user row even when no health profile exists yet.
            User::whereKey(auth()->id())->lockForUpdate()->firstOrFail();
            abort_if(HealthProfile::where('user_id', auth()->id())->exists(), 409, 'Health profile already exists. Reload before editing.');
            $data = $request->validate(HealthProfile::validationRules());
            return HealthProfile::create(array_merge($data, ['user_id' => auth()->id(), 'completed_at' => now()]));
        });
        return response()->json(['success' => true, 'data' => $this->profileData($profile)], 201);
    }
    public function update(Request $request)
    {
        $profile = HealthProfile::where('user_id', auth()->id())->firstOrFail();
        // Dapat valid pa rin ang buong record at consent pagkatapos ng partial edit.
        $data = Validator::make(array_merge($this->profileData($profile), $request->all()), HealthProfile::validationRules())->validate();
        $profile->fill($data);
        $profile->completed_at = $profile->completed_at ?: now();
        $profile->save();
        return response()->json(['success' => true, 'data' => $this->profileData($profile->fresh())]);
    }

    private function profileData(?HealthProfile $profile): ?array
    {
        if (!$profile) return null;
        $data = $profile->toArray();
        // Calendar dates must not shift to the previous day when serialized in UTC.
        foreach (['hospitalization_date', 'surgery_date', 'covid_date', 'last_menstrual_period', 'consent_date'] as $field) {
            $data[$field] = $profile->$field ? $profile->$field->format('Y-m-d') : null;
        }
        return $data;
    }
}
```

## backend/app/Models/HealthProfile.php

```php
<?php

namespace App\Models;

use App\Casts\NormalizedArray;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class HealthProfile extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'user_id',

        'emergency_name',
        'emergency_relationship',
        'emergency_phone',

        'medical_history',
        'allergy_details',
        'other_medical_history',
        'medications',

        'hospitalized',
        'hospitalization_date',
        'hospitalization_diagnosis',

        'surgery',
        'surgery_date',
        'surgery_diagnosis',

        'had_covid',
        'covid_date',
        'covid_diagnosis',

        'occupation',
        'marital_status',

        'tobacco_use',
        'tobacco_amount',
        'tobacco_duration',

        'alcohol_use',
        'other_substance_use',

        'has_disability',
        'disability_details',

        'last_menstrual_period',
        'has_children',
        'number_of_children',
        'age_first_pregnancy',

        'gravidity',
        'term',
        'premature',
        'abortion',
        'living_children',

        'family_history',

        'consent_signature',
        'agree_privacy',
        'agree_terms',
        'consent_date',

        'completed_at',
    ];

    protected $casts = [
        'medical_history' => NormalizedArray::class,
        'family_history' => NormalizedArray::class,

        'hospitalized' => 'boolean',
        'surgery' => 'boolean',
        'had_covid' => 'boolean',
        'has_disability' => 'boolean',
        'has_children' => 'boolean',

        'gravidity' => 'boolean',
        'term' => 'boolean',
        'premature' => 'boolean',
        'abortion' => 'boolean',
        'living_children' => 'boolean',

        'agree_privacy' => 'boolean',
        'agree_terms' => 'boolean',

        'hospitalization_date' => 'date',
        'surgery_date' => 'date',
        'covid_date' => 'date',
        'last_menstrual_period' => 'date',
        'consent_date' => 'date',

        'completed_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    |
    | These rules are used when a Student actually submits or updates the
    | Health Profile.
    |
    | Do NOT use the complete validation rule set as the permanent onboarding
    | status check. Optional/historical values can legitimately differ over
    | time and should not unexpectedly send an already-completed Student back
    | through onboarding.
    |
    */

    public static function validationRules(): array
    {
        $rules = [
            'emergency_name' => [
                'required',
                'string',
                'max:100',
            ],

            'emergency_relationship' => [
                'required',
                'string',
                'max:100',
            ],

            'emergency_phone' => [
                'required',
                'string',

                /*
                 * Existing Health Profile form currently stores the
                 * Philippine local format:
                 *
                 * 09XXXXXXXXX
                 *
                 * We will centralize +63 normalization later when we
                 * update the contact/profile forms.
                 */
                'regex:/^09[0-9]{9}$/',
            ],

            'consent_signature' => [
                'required',
                'string',
                'max:191',
            ],

            'consent_date' => [
                'required',
                'date',
                'before_or_equal:today',
            ],

            'agree_privacy' => [
                'required',
                'accepted',
            ],

            'agree_terms' => [
                'required',
                'accepted',
            ],

            'medical_history' => [
                'nullable',
                'array',
            ],

            'medical_history.*' => [
                'string',
                'max:255',
            ],

            'family_history' => [
                'nullable',
                'array',
            ],

            'family_history.*' => [
                'string',
                'max:255',
            ],

            'number_of_children' => [
                'nullable',
                'integer',
                'min:0',
                'max:30',
            ],

            'age_first_pregnancy' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];

        foreach (
            [
                'hospitalized',
                'surgery',
                'had_covid',
                'has_disability',
                'has_children',
                'gravidity',
                'term',
                'premature',
                'abortion',
                'living_children',
            ] as $field
        ) {
            $rules[$field] = [
                'sometimes',
                'boolean',
            ];
        }

        foreach (
            [
                'hospitalization_date',
                'surgery_date',
                'covid_date',
                'last_menstrual_period',
            ] as $field
        ) {
            $rules[$field] = [
                'nullable',
                'date',
                'before_or_equal:today',
            ];
        }

        foreach (
            [
                'allergy_details',
                'other_medical_history',
                'hospitalization_diagnosis',
                'surgery_diagnosis',
                'covid_diagnosis',
                'occupation',
            ] as $field
        ) {
            $rules[$field] = [
                'nullable',
                'string',
                'max:191',
            ];
        }

        foreach (['marital_status' => 50, 'tobacco_use' => 20, 'tobacco_amount' => 100, 'tobacco_duration' => 100, 'alcohol_use' => 20] as $field => $limit) {
            $rules[$field] = ['nullable', 'string', 'max:' . $limit];
        }

        foreach (
            [
                'medications',
                'other_substance_use',
                'disability_details',
            ] as $field
        ) {
            $rules[$field] = [
                'nullable',
                'string',
                'max:2000',
            ];
        }

        return $rules;
    }

    /*
    |--------------------------------------------------------------------------
    | Health Profile Completion
    |--------------------------------------------------------------------------
    |
    | This determines whether the Student already completed the REQUIRED
    | onboarding Health Profile.
    |
    | Important distinction:
    |
    | validationRules()
    |     = validates a form submission/update
    |
    | isComplete()
    |     = determines whether onboarding has already been completed
    |
    | We intentionally do NOT rerun every optional medical-history validation
    | here. Otherwise a historical optional value can suddenly make an old,
    | already-saved profile "incomplete" during a future login.
    |
    */

    public function isComplete(): bool
    {
        /*
         * Required identity/contact portion of the Health Profile.
         */
        if (!$this->hasText($this->emergency_name)) {
            return false;
        }

        if (!$this->hasText($this->emergency_relationship)) {
            return false;
        }

        if (!$this->hasValidEmergencyPhone()) {
            return false;
        }

        /*
         * Required consent portion.
         */
        if (!$this->hasText($this->consent_signature)) {
            return false;
        }

        if (!$this->consent_date) {
            return false;
        }

        if (!$this->agree_privacy) {
            return false;
        }

        if (!$this->agree_terms) {
            return false;
        }

        /*
         * At this point, the required onboarding information exists.
         *
         * completed_at is useful as an audit timestamp, but it is NOT used
         * as the sole completion flag because older records may have received
         * a timestamp before all required fields were truly populated.
         */
        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function hasText($value): bool
    {
        return is_string($value)
            && trim($value) !== '';
    }

    private function hasValidEmergencyPhone(): bool
    {
        $phone = preg_replace(
            '/[\s\-\(\)]/',
            '',
            (string) $this->emergency_phone
        );

        /*
         * Current canonical local format.
         */
        if (preg_match('/^09\d{9}$/', $phone)) {
            return true;
        }

        /*
         * Backward/future compatibility for an equivalent Philippine +63
         * value if an existing record was normalized that way.
         *
         * Example:
         * +639123456789
         */
        if (preg_match('/^\+639\d{9}$/', $phone)) {
            return true;
        }

        return false;
    }
}
```

## backend/tests/Feature/StudentHealthProfileTest.php

```php
<?php

namespace Tests\Feature;

use App\Models\HealthProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class StudentHealthProfileTest extends TestCase
{
    use DatabaseTransactions;

    private function student(): User
    {
        return User::create([
            'student_id' => 'HEALTH-' . Str::random(10),
            'first_name' => 'Student', 'last_name' => 'Test',
            'email' => Str::uuid() . '@example.test',
            'password' => Hash::make('TestPassword123!'),
            'birthday' => '2002-05-15', 'role' => 'student', 'status' => 'active',
        ]);
    }

    private function healthData(): array
    {
        return [
            'emergency_name' => 'Peña Guardian', 'emergency_relationship' => 'Parent',
            'emergency_phone' => '09123456789', 'consent_signature' => 'Student Test',
            'consent_date' => today()->toDateString(), 'agree_privacy' => true, 'agree_terms' => true,
            'medical_history' => ['Bronchial Asthma'], 'family_history' => ['Hypertension'],
            'allergy_details' => 'Penicillin', 'medications' => 'Prescribed medication',
            'hospitalized' => true, 'hospitalization_date' => '2020-01-15',
            'surgery' => true, 'surgery_date' => '2021-02-16',
            'had_covid' => true, 'covid_date' => '2022-03-17',
            'last_menstrual_period' => '2023-04-18',
        ];
    }

    public function test_missing_profile_can_be_created_then_edited_without_duplicates(): void
    {
        $student = $this->student();
        $this->actingAs($student, 'api')->getJson('/api/student/health-profile')
            ->assertOk()->assertJsonPath('data', null);
        $this->getJson('/api/student/health-profile/status')->assertJsonPath('data.completed', false);
        $id = $this->postJson('/api/student/health-profile', $this->healthData())
            ->assertCreated()->assertJsonPath('data.family_history', ['Hypertension'])->json('data.id');
        $this->postJson('/api/student/health-profile', $this->healthData())->assertStatus(409);
        $this->putJson('/api/student/health-profile', ['family_history' => ['Asthma', 'Diabetes Mellitus']])
            ->assertOk()->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.medical_history', ['Bronchial Asthma'])
            ->assertJsonPath('data.allergy_details', 'Penicillin')
            ->assertJsonPath('data.medications', 'Prescribed medication');
        $this->getJson('/api/student/health-profile')->assertOk()
            ->assertJsonPath('data.family_history', ['Asthma', 'Diabetes Mellitus']);
        $this->putJson('/api/student/health-profile', ['family_history' => [], 'medical_history' => [], 'medications' => 'Updated'])
            ->assertOk()->assertJsonPath('data.family_history', [])->assertJsonPath('data.medications', 'Updated');
        $this->assertSame(1, HealthProfile::where('user_id', $student->id)->count());
        $this->getJson('/api/student/health-profile/status')->assertJsonPath('data.completed', true);
    }

    public function test_calendar_dates_survive_loading_and_partial_updates(): void
    {
        config(['app.timezone' => 'Asia/Manila']);
        date_default_timezone_set('Asia/Manila');
        $student = $this->student();
        $data = $this->healthData();
        $this->actingAs($student, 'api')->postJson('/api/student/health-profile', $data)->assertCreated();
        foreach (['get', 'put'] as $method) {
            $response = $method === 'get'
                ? $this->getJson('/api/student/health-profile')
                : $this->putJson('/api/student/health-profile', ['medications' => 'Updated']);
            $response->assertOk();
            foreach (['hospitalization_date', 'surgery_date', 'covid_date', 'last_menstrual_period', 'consent_date'] as $field) {
                $response->assertJsonPath('data.' . $field, $data[$field]);
                $this->assertSame($data[$field], $student->healthProfile()->first()->getRawOriginal($field));
            }
        }
    }

    public function test_incomplete_profile_can_be_loaded_and_completed_but_cannot_book_yet(): void
    {
        $student = $this->student();
        $profile = HealthProfile::create(['user_id' => $student->id, 'family_history' => ['Asthma']]);
        $this->actingAs($student, 'api')->getJson('/api/student/health-profile')
            ->assertOk()->assertJsonPath('data.family_history', ['Asthma']);
        $this->postJson('/api/student/appointments', [
            'service' => 'General Checkup', 'appointment_date' => today()->addDay()->toDateString(), 'time_slot' => '9:00 AM',
        ])->assertUnprocessable()->assertJsonPath('message', 'Complete your health profile before booking.');
        $this->putJson('/api/student/health-profile', $this->healthData())
            ->assertOk()->assertJsonPath('data.id', $profile->id);
        $this->getJson('/api/student/health-profile/status')->assertJsonPath('data.completed', true);
        $this->assertSame(1, HealthProfile::where('user_id', $student->id)->count());
    }

    public function test_invalid_edits_do_not_replace_saved_information(): void
    {
        $student = $this->student();
        $this->actingAs($student, 'api')->postJson('/api/student/health-profile', $this->healthData())->assertCreated();
        $this->putJson('/api/student/health-profile', [
            'agree_privacy' => false, 'emergency_phone' => '123', 'family_history' => 'Asthma',
            'number_of_children' => 31, 'age_first_pregnancy' => 0,
            'hospitalization_date' => today()->addDay()->toDateString(),
            'tobacco_amount' => str_repeat('x', 101), 'marital_status' => str_repeat('x', 51),
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'agree_privacy', 'emergency_phone', 'family_history', 'number_of_children',
            'age_first_pregnancy', 'hospitalization_date', 'tobacco_amount', 'marital_status',
        ]);
        $this->getJson('/api/student/health-profile')->assertOk()
            ->assertJsonPath('data.family_history', ['Hypertension'])->assertJsonPath('data.agree_privacy', true);
        $other = $this->student();
        $this->actingAs($other, 'api')->getJson('/api/student/health-profile')->assertJsonPath('data', null);
        $this->putJson('/api/student/health-profile', $this->healthData())->assertNotFound();
    }
}
```
