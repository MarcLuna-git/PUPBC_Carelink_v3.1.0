import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Stethoscope,
  Shield,
  ChevronRight,
  FileText,
  Edit3,
  Info,
} from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 ${className}`}
  />
);

const getLocalDateString = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const normalizeDateValue = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) {
      return match[1];
    }
  }

  return value;
};

// Clinic time is PH time. Explicit offset keeps Safari/iPhone parsing consistent.
const parseAppointmentDateTime = (dateValue, timeString) => {
  const dateString = normalizeDateValue(dateValue);

  if (!dateString || !timeString) {
    return null;
  }

  const timeMatch = timeString.match(
    /^(\d{1,2}):(\d{2})\s(AM|PM)$/i
  );

  if (!timeMatch) {
    return null;
  }

  let hour = Number(timeMatch[1]);
  const minute = timeMatch[2];
  const period = timeMatch[3].toUpperCase();

  if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  }

  const hourString = String(hour).padStart(2, '0');

  const parsed = new Date(
    `${dateString}T${hourString}:${minute}:00+08:00`
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const isSunday = (value) => {
  const dateString = normalizeDateValue(value);

  if (!dateString) {
    return false;
  }

  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  ).getUTCDay() === 0;
};

const safeApiMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (
    !message ||
    /SQLSTATE|Illuminate\\|select\s+.+\s+from|stack trace/i.test(message)
  ) {
    return fallback;
  }

  return message;
};

const formatDate = (dateValue, options = {}) => {
  const dateString = normalizeDateValue(dateValue);

  if (!dateString) {
    return 'N/A';
  }

  try {
    const [year, month, day] = dateString
      .split('-')
      .map(Number);

    const safeDate = new Date(
      Date.UTC(year, month - 1, day, 12, 0, 0)
    );

    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }).format(safeDate);
  } catch {
    return dateString;
  }
};

const Appointments = () => {
  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  const healthProfileDone =
    user?.profile?.health_profile_completed === true ||
    user?.profile?.health_profile_completed === 1 ||
    user?.profile?.health_profile_completed === '1';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const [pageLoading, setPageLoading] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(
            'carelink.student.appointments'
          ) || '[]'
        ).length === 0
      );
    } catch {
      return true;
    }
  });

  const [confirmCancel, setConfirmCancel] =
    useState(null);

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] =
    useState('success');

  const [appointments, setAppointments] =
    useState(() => {
      try {
        const cached = JSON.parse(
          localStorage.getItem(
            'carelink.student.appointments'
          ) || '[]'
        );

        return Array.isArray(cached)
          ? cached
          : [];
      } catch {
        return [];
      }
    });

  const [form, setForm] = useState({
    service: '',
    date: '',
    time: '',
    concern: '',
  });

  const [
    availableSlots,
    setAvailableSlots,
  ] = useState([]);

  const [
    slotsLoading,
    setSlotsLoading,
  ] = useState(false);

  const services = [
    'Consultation',
    'Medical Certificate',
    'Medical Clearance',
    'Follow-up Checkup',
    'Vaccination',
    'Other',
  ];

  const timeSlots = [
    '8:00 AM',
    '8:30 AM',
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
    '4:00 PM',
    '4:30 PM',
  ];

  const statusConfig = {
    approved: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle,
      label: 'Approved',
    },

    pending: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
      label: 'Pending Approval',
    },

    completed: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: CheckCircle,
      label: 'Completed',
    },

    cancelled: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
      label: 'Cancelled',
    },

    rejected: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
      label: 'Rejected',
    },

    expired: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      icon: Clock,
      label: 'Expired',
    },
  };

  const fetchAppointments =
    useCallback(async () => {
      try {
        const token =
          localStorage.getItem('token');

        const response = await api.get(
          '/student/appointments',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          const data = response.data.data;

          const normalized =
            Array.isArray(data)
              ? data
              : data?.data || [];

          setAppointments(normalized);

          localStorage.setItem(
            'carelink.student.appointments',
            JSON.stringify(normalized)
          );
        }
      } catch (err) {
        console.log(
          'Fetch appointments error:',
          err
        );
        setMessageType('error');
        setMessage(
          'Unable to load your appointment information. Please try again.'
        );
      } finally {
        setPageLoading(false);
      }
    }, []);

  const fetchAvailableSlots =
    useCallback(async (date) => {
      if (!date || isSunday(date)) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);

      try {
        const token =
          localStorage.getItem('token');

        const response = await api.get(
          `/student/available-slots?date=${date}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setAvailableSlots(
            response.data.data?.slots || []
          );
        }
      } catch (err) {
        console.log(
          'Fetch slots error:',
          err
        );
      } finally {
        setSlotsLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchAppointments();

    const interval = setInterval(
      fetchAppointments,
      10000
    );

    return () => clearInterval(interval);
  }, [fetchAppointments]);

  useEffect(() => {
    if (
      showForm &&
      form.date &&
      !isSunday(form.date)
    ) {
      fetchAvailableSlots(form.date);

      const interval = setInterval(
        () =>
          fetchAvailableSlots(form.date),
        30000
      );

      return () =>
        clearInterval(interval);
    }

    return undefined;
  }, [
    showForm,
    form.date,
    fetchAvailableSlots,
  ]);

  const orderedAppointments = useMemo(() => {
    const statusRank = {
      pending: 0,
      approved: 1,
      completed: 2,
      cancelled: 3,
      rejected: 4,
      expired: 5,
    };

    return [...appointments].sort((a, b) => {
      const rankDifference =
        (statusRank[a.status] ?? 99) -
        (statusRank[b.status] ?? 99);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      const aDate =
        parseAppointmentDateTime(
          a.appointment_date,
          a.time_slot
        )?.getTime() || 0;

      const bDate =
        parseAppointmentDateTime(
          b.appointment_date,
          b.time_slot
        )?.getTime() || 0;

      if (
        ['pending', 'approved'].includes(
          a.status
        )
      ) {
        return aDate - bDate;
      }

      return bDate - aDate;
    });
  }, [appointments]);

  const pendingAppointments = useMemo(
    () =>
      orderedAppointments.filter(
        (appointment) =>
          appointment.status === 'pending'
      ),
    [orderedAppointments]
  );

  const primaryPending =
    pendingAppointments[0] || null;

  const filteredAppointments =
    useMemo(() => {
      if (filter === 'all') {
        return orderedAppointments;
      }

      if (filter === 'past') {
        return orderedAppointments.filter(
          (appointment) => {
            const scheduledAt = parseAppointmentDateTime(
              appointment.appointment_date,
              appointment.time_slot
            );

            return [
              'completed',
              'cancelled',
              'rejected',
              'expired',
            ].includes(appointment.status) ||
              (scheduledAt && scheduledAt < new Date());
          }
        );
      }

      if (filter === 'approved') {
        return orderedAppointments.filter(
          (appointment) => {
            const scheduledAt = parseAppointmentDateTime(
              appointment.appointment_date,
              appointment.time_slot
            );

            return appointment.status === 'approved' &&
              scheduledAt &&
              scheduledAt >= new Date();
          }
        );
      }

      return orderedAppointments.filter(
        (appointment) =>
          appointment.status === filter
      );
    }, [filter, orderedAppointments]);

  const showMessage = (
    text,
    type = 'success',
    timeout = 3000
  ) => {
    setMessageType(type);
    setMessage(text);

    setTimeout(
      () => setMessage(''),
      timeout
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === 'date' &&
      value &&
      isSunday(value)
    ) {
      setForm((current) => ({
        ...current,
        date: '',
        time: '',
      }));

      setAvailableSlots([]);

      showMessage(
        'The clinic is closed on Sundays. Please choose Monday to Saturday.',
        'error'
      );

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'date'
        ? { time: '' }
        : {}),
    }));

    if (
      name === 'date' &&
      value
    ) {
      fetchAvailableSlots(value);
    }
  };

  const getSlotInfo = (time) => {
    const slot =
      availableSlots.find(
        (item) => item.time === time
      );

    if (!slot) {
      return {
        available: 10,
        booked: 0,
        isFull: false,
      };
    }

    return slot;
  };

  const getSlotColor = (time) => {
    const slot = getSlotInfo(time);

    if (slot.isFull) {
      return 'text-red-500';
    }

    if (slot.available <= 3) {
      return 'text-yellow-500';
    }

    return 'text-green-500';
  };

  const handleEditClick = (
    appointment
  ) => {
    setSelectedAppointment(null);

    setForm({
      service:
        appointment.service || '',
      date:
        normalizeDateValue(
          appointment.appointment_date
        ) || '',
      time:
        appointment.time_slot || '',
      concern:
        appointment.concern || '',
    });

    setEditingId(appointment.id);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.service ||
      !form.date ||
      !form.time
    ) {
      showMessage(
        'Please fill all required fields.',
        'error'
      );

      return;
    }

    if (isSunday(form.date)) {
      showMessage(
        'The clinic is closed on Sundays. Please choose Monday to Saturday.',
        'error'
      );

      return;
    }

    const slotInfo =
      getSlotInfo(form.time);

    if (slotInfo.isFull) {
      showMessage(
        'This time slot is already full. Please select a different time.',
        'error'
      );

      return;
    }

    const selectedSlot =
      parseAppointmentDateTime(
        form.date,
        form.time
      );

    if (
      !selectedSlot ||
      selectedSlot < new Date()
    ) {
      showMessage(
        'Please choose a present or future appointment time.',
        'error'
      );

      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token =
        localStorage.getItem('token');

      const payload = {
        service: form.service,
        appointment_date: form.date,
        time_slot: form.time,
        concern: form.concern || '',
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/student/appointments/${editingId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await api.post(
          '/student/appointments',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success) {
        showMessage(
          editingId
            ? 'Appointment updated!'
            : `Appointment booked! Ref: ${
                response.data.data
                  ?.reference_number ||
                'APT-NEW'
              }`
        );

        setShowForm(false);
        setEditingId(null);

        setForm({
          service: '',
          date: '',
          time: '',
          concern: '',
        });

        setAvailableSlots([]);

        await fetchAppointments();
      }
    } catch (err) {
      const validationErrors =
        err.response?.data?.errors;

      const validationMessage =
        validationErrors
          ? Object.values(validationErrors)
              .flat()
              .join(' ')
          : '';

      showMessage(
        validationMessage ||
          safeApiMessage(
            err,
            err.response
              ? `Failed to save appointment (HTTP ${err.response.status}).`
              : 'Cannot connect to the appointment service.'
          ) ||
          (err.response
            ? `Failed to save appointment (HTTP ${err.response.status}).`
            : 'Cannot connect to the appointment service.'),
        'error',
        4000
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) {
      return;
    }

    try {
      const token =
        localStorage.getItem('token');

      await api.patch(
        `/student/appointments/${confirmCancel}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showMessage(
        'Appointment cancelled.'
      );

      setConfirmCancel(null);
      setSelectedAppointment(null);

      await fetchAppointments();
    } catch (err) {
      showMessage(
        safeApiMessage(
          err,
          'Failed to cancel appointment.'
        ),
        'error'
      );
    }
  };

  const openNewBooking = () => {
    setShowForm((current) => !current);
    setEditingId(null);

    setForm({
      service: '',
      date: '',
      time: '',
      concern: '',
    });

    setAvailableSlots([]);
  };

  const renderStatusBadge = (
    appointment
  ) => {
    const config =
      statusConfig[
        appointment.status
      ] || statusConfig.pending;

    const StatusIcon =
      config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}
      >
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (!healthProfileDone) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/20">
            <Shield className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Health Profile Required
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            Complete your Health Profile before using clinic appointment services.
          </p>

          <Link
            to="/student/health-profile"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-maroon-800 px-6 py-3 font-semibold text-white transition hover:bg-maroon-900"
          >
            Complete Health Profile
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 px-4 pb-6 sm:px-0">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-1 h-7 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>

          <Skeleton className="h-10 w-24 rounded-2xl" />
        </div>

        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 pb-6 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appointments
          </h1>

          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-300">
            {appointments.length}{' '}
            appointment
            {appointments.length !== 1
              ? 's'
              : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={openNewBooking}
          className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${
            showForm
              ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              : 'bg-maroon-800 text-white shadow-lg shadow-maroon-800/20 hover:bg-maroon-900'
          }`}
        >
          {showForm ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}

          <span>
            {showForm
              ? 'Close'
              : 'Book'}
          </span>
        </button>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className={`rounded-2xl p-4 text-center text-sm font-medium ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ORIGINAL BOOKING UI */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <h3 className="mb-2 font-bold text-gray-900 dark:text-white">
              {editingId
                ? 'Edit Appointment'
                : 'Book New Appointment'}
            </h3>

            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/20 dark:bg-blue-900/10">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />

              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold">
                  Clinic Hours
                </p>

                <p>
                  Morning: 8:00 AM – 12:00 PM | Lunch: 12:00 PM – 1:00 PM | Afternoon: 1:00 PM – 5:00 PM
                </p>

                <p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">
                  Clinic is closed every Sunday.
                </p>
              </div>
            </div>

            {form.date && (
              <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-3 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-200">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Available
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  Filling up
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Full
                </span>

                {slotsLoading && (
                  <Loader2 className="ml-auto h-3 w-3 animate-spin text-gray-400" />
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Service */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Service *
                  </label>

                  <div className="relative">
                    <Stethoscope className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <select
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">
                        Select Service
                      </option>

                      {services.map(
                        (service) => (
                          <option
                            key={service}
                            value={service}
                          >
                            {service}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Date *
                  </label>

                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                      min={getLocalDateString()}
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Time *

                    {form.date &&
                      availableSlots.length >
                        0 && (
                        <span className="ml-1 font-normal text-gray-400">
                          (Max 10 per slot)
                        </span>
                      )}
                  </label>

                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <select
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      required
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">
                        Select Time
                      </option>

                      {timeSlots.map(
                        (time) => {
                          const slot =
                            getSlotInfo(time);

                          const slotDateTime =
                            form.date
                              ? parseAppointmentDateTime(
                                  form.date,
                                  time
                                )
                              : null;

                          const isPast =
                            Boolean(
                              slotDateTime
                            ) &&
                            slotDateTime <
                              new Date();

                          const unavailable =
                            slot.isFull ||
                            isPast;

                          return (
                            <option
                              key={time}
                              value={time}
                              disabled={
                                unavailable
                              }
                            >
                              {time}{' '}
                              {form.date
                                ? isPast
                                  ? '(Past)'
                                  : unavailable
                                    ? '(Full)'
                                    : `(${slot.available}/10 slots)`
                                : ''}
                            </option>
                          );
                        }
                      )}
                    </select>
                  </div>

                  {form.date &&
                    form.time && (
                      <div className="mt-2">
                        {(() => {
                          const slot =
                            getSlotInfo(
                              form.time
                            );

                          const pct =
                            Math.min(
                              100,
                              (slot.booked /
                                10) *
                                100
                            );

                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span
                                  className={getSlotColor(
                                    form.time
                                  )}
                                >
                                  {slot.isFull
                                    ? '🔴 Full'
                                    : slot.available <=
                                        3
                                      ? '🟡 Filling up'
                                      : '🟢 Available'}
                                </span>

                                <span className="text-gray-400">
                                  {slot.booked}
                                  /10 booked
                                </span>
                              </div>

                              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    slot.isFull
                                      ? 'bg-red-500'
                                      : slot.available <=
                                          3
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${pct}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                </div>

                {/* Reason */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Reason
                  </label>

                  <textarea
                    name="concern"
                    value={form.concern}
                    onChange={handleChange}
                    rows={2}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your concern..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-800 py-3 font-semibold text-white transition hover:bg-maroon-900 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Saving...
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />

                    <span>
                      {editingId
                        ? 'Update Appointment'
                        : 'Confirm Booking'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact pending attention strip */}
      {primaryPending && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10">
          <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Clock className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Pending Approval
                  </p>

                  {pendingAppointments.length >
                    1 && (
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      +
                      {pendingAppointments.length -
                        1}{' '}
                      more
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {primaryPending.service ||
                      'Appointment'}
                  </span>

                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {formatDate(
                      primaryPending.appointment_date,
                      {
                        weekday: 'short',
                      }
                    )}
                  </span>

                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {primaryPending.time_slot ||
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedAppointment(
                  primaryPending
                )
              }
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-gray-800 dark:text-amber-200 dark:hover:bg-gray-700"
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Appointment table + desktop side details */}
      <div
        className={`grid gap-4 ${
          selectedAppointment
            ? 'lg:grid-cols-[minmax(0,1fr)_380px]'
            : 'lg:grid-cols-1'
        }`}
      >
        {/* Appointment table */}
        <div
          className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${
            selectedAppointment
              ? 'w-full'
              : 'w-full lg:max-w-5xl'
          }`}
        >
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                My Appointments
              </h2>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Pending requests are shown first.
              </p>
            </div>

            <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
              {[
                ['all', 'All'],
                [
                  'pending',
                  `Pending${
                    pendingAppointments.length
                      ? ` (${pendingAppointments.length})`
                      : ''
                  }`,
                ],
                [
                  'approved',
                  'Upcoming',
                ],
                ['past', 'Past'],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(value)
                    }
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      filter === value
                        ? 'bg-maroon-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredAppointments.length ===
          0 ? (
            <div className="px-5 py-10 text-center">
              <Calendar className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />

              <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                No appointments found
              </p>
            </div>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/60">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2.5">
                        Date
                      </th>

                      <th className="px-4 py-2.5">
                        Service
                      </th>

                      <th className="px-4 py-2.5">
                        Time
                      </th>

                      <th className="px-4 py-2.5">
                        Status
                      </th>

                      <th className="px-4 py-2.5">
                        Queue
                      </th>

                      <th className="px-4 py-2.5 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAppointments.map(
                      (appointment) => {
                        const selected =
                          selectedAppointment?.id ===
                          appointment.id;

                        return (
                          <tr
                            key={
                              appointment.id
                            }
                            onClick={() =>
                              setSelectedAppointment(
                                appointment
                              )
                            }
                            className={`cursor-pointer transition ${
                              selected
                                ? 'bg-maroon-50 dark:bg-maroon-900/15'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                            }`}
                          >
                            <td className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(
                                appointment.appointment_date
                              )}
                            </td>

                            <td className="px-4 py-2.5">
                              <p className="max-w-[170px] truncate text-sm font-medium text-gray-900 dark:text-white">
                                {appointment.service ||
                                  'Appointment'}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                              {appointment.time_slot ||
                                'N/A'}
                            </td>

                            <td className="px-4 py-2.5">
                              {renderStatusBadge(
                                appointment
                              )}
                            </td>

                            <td className="px-4 py-2.5">
                              {appointment.queue
                                ?.queue_number ? (
                                <div>
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                                    {
                                      appointment
                                        .queue
                                        .queue_number
                                    }
                                  </p>

                                  <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                                    {appointment
                                      .queue
                                      .queue_type ||
                                      'Queue'}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  —
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  setSelectedAppointment(
                                    appointment
                                  );
                                }}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                  selected
                                    ? 'bg-maroon-100 text-maroon-900 dark:bg-maroon-900/30 dark:text-maroon-200'
                                    : 'text-maroon-700 hover:bg-maroon-50 dark:text-maroon-300 dark:hover:bg-maroon-900/20'
                                }`}
                              >
                                {selected
                                  ? 'Selected'
                                  : 'View'}

                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">
                {filteredAppointments.map(
                  (appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() =>
                        setSelectedAppointment(
                          appointment
                        )
                      }
                      className="w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {appointment.service ||
                              'Appointment'}
                          </p>

                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                            {formatDate(
                              appointment.appointment_date
                            )}{' '}
                            ·{' '}
                            {appointment.time_slot ||
                              'N/A'}
                          </p>

                          <div className="mt-2">
                            {renderStatusBadge(
                              appointment
                            )}
                          </div>

                          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {appointment.queue
                              ?.queue_number
                              ? `Queue ${appointment.queue.queue_number}`
                              : 'Queue assigned after clinic check-in'}
                          </p>
                        </div>

                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                      </div>
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Desktop details panel */}
        <AnimatePresence mode="wait">
          {selectedAppointment && (
            <motion.aside
              key={selectedAppointment.id}
              initial={{
                opacity: 0,
                x: 18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 18,
              }}
              transition={{
                duration: 0.18,
              }}
              className="hidden lg:block"
            >
              <div className="sticky top-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                  <div className="min-w-0">
                    {renderStatusBadge(
                      selectedAppointment
                    )}

                    <h3 className="mt-2 truncate text-base font-bold text-gray-900 dark:text-white">
                      {selectedAppointment.service ||
                        'Appointment'}
                    </h3>

                    <p className="mt-1 text-[10px] font-mono text-gray-400">
                      Ref:{' '}
                      {selectedAppointment.reference_number ||
                        'N/A'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAppointment(
                        null
                      )
                    }
                    aria-label="Close appointment details"
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-4">
                  {selectedAppointment.status ===
                    'pending' && (
                    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800/30 dark:bg-yellow-900/10">
                      <div className="flex gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />

                        <div>
                          <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300">
                            Waiting for Approval
                          </p>

                          <p className="mt-1 text-xs leading-5 text-yellow-700 dark:text-yellow-400">
                            Clinic staff still needs to review this request.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAppointment.status ===
                    'approved' && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800/30 dark:bg-green-900/10">
                      <div className="flex gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />

                        <div>
                          <p className="text-xs font-bold text-green-800 dark:text-green-300">
                            Appointment Approved
                          </p>

                          <p className="mt-1 text-xs leading-5 text-green-700 dark:text-green-400">
                            Use your CareLink QR at the clinic on the approved date.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAppointment.status ===
                    'completed' && (
                    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/30 dark:bg-blue-900/10">
                      <div className="flex gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />

                        <div>
                          <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                            Visit Completed
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">
                            Consultation information can be reviewed in Health Records.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {[
                    'cancelled',
                    'rejected',
                    'expired',
                  ].includes(
                    selectedAppointment.status
                  ) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/30 dark:bg-red-900/10">
                      <div className="flex gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />

                        <p className="text-xs font-bold text-red-800 dark:text-red-300">
                          {
                            statusConfig[
                              selectedAppointment
                                .status
                            ]?.label
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Date
                          </p>

                          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(
                              selectedAppointment.appointment_date
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Time
                          </p>

                          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                            {selectedAppointment.time_slot ||
                              'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 text-gray-400" />

                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Concern
                          </p>

                          <p className="mt-0.5 break-words text-sm leading-5 text-gray-700 dark:text-gray-200">
                            {selectedAppointment.concern ||
                              'No concern specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Queue Status
                    </p>

                    {selectedAppointment.queue
                      ?.queue_number ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-2xl font-black text-maroon-800 dark:text-maroon-300">
                            {
                              selectedAppointment
                                .queue
                                .queue_number
                            }
                          </p>

                          <p className="text-[10px] font-semibold uppercase text-gray-400">
                            {selectedAppointment
                              .queue.queue_type ||
                              'Queue'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {selectedAppointment
                              .queue.status ===
                            'serving'
                              ? 'Your Turn'
                              : selectedAppointment
                                  .queue.status ||
                                'Waiting'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Queue number will be assigned after kiosk check-in and triage.
                      </p>
                    )}
                  </div>

                  {selectedAppointment.status ===
                    'approved' && (
                    <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        On your appointment day
                      </p>

                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-[10px] font-bold text-maroon-800 dark:bg-maroon-900/30 dark:text-maroon-300">
                          1
                        </span>

                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                          Arrive 10–15 minutes before your scheduled time.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-[10px] font-bold text-maroon-800 dark:bg-maroon-900/30 dark:text-maroon-300">
                          2
                        </span>

                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                          Scan your QR at the clinic kiosk.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-[10px] font-bold text-maroon-800 dark:bg-maroon-900/30 dark:text-maroon-300">
                          3
                        </span>

                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                          Wait for your regular or priority queue number.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {selectedAppointment.status ===
                      'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleEditClick(
                              selectedAppointment
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-900"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit Appointment
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setConfirmCancel(
                              selectedAppointment.id
                            );

                            setSelectedAppointment(
                              null
                            );
                          }}
                          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800/30 dark:bg-red-900/10 dark:text-red-400"
                        >
                          Cancel Appointment
                        </button>
                      </>
                    )}

                    {selectedAppointment.status ===
                      'approved' && (
                      <Link
                        to="/student/qr"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-900"
                      >
                        Open My QR
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}

                    {selectedAppointment.status ===
                      'completed' && (
                      <Link
                        to="/student/health-records"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View Health Records
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Queue note */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-maroon-700 dark:text-maroon-300" />

          <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
            Queue numbers are assigned after successful kiosk check-in and clinic triage. Use your CareLink QR only on the date of an approved appointment.
          </p>
        </div>
      </div>

      {/* Mobile/tablet details modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm lg:hidden sm:items-center sm:p-4"
            onClick={() =>
              setSelectedAppointment(null)
            }
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 30,
                scale: 0.98,
              }}
              transition={{
                duration: 0.18,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="max-h-[90vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-800 sm:max-w-md sm:rounded-3xl"
            >
              <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div>
                  {renderStatusBadge(
                    selectedAppointment
                  )}

                  <h3 className="mt-2 text-base font-bold text-gray-900 dark:text-white">
                    {selectedAppointment.service ||
                      'Appointment'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAppointment(
                      null
                    )
                  }
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className="overflow-y-auto p-5"
                style={{
                  maxHeight:
                    'calc(90vh - 80px)',
                  WebkitOverflowScrolling:
                    'touch',
                }}
              >
                <div className="space-y-3">
                  {selectedAppointment.status ===
                    'pending' && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800/30 dark:bg-yellow-900/10">
                      <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300">
                        Waiting for Approval
                      </p>

                      <p className="mt-1 text-xs leading-5 text-yellow-700 dark:text-yellow-400">
                        Your appointment is still being reviewed by the clinic.
                      </p>
                    </div>
                  )}

                  {selectedAppointment.status ===
                    'approved' && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800/30 dark:bg-green-900/10">
                      <p className="text-xs font-bold text-green-800 dark:text-green-300">
                        Appointment Approved
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700 dark:text-green-400">
                        Use your QR on your approved appointment date.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(
                          selectedAppointment.appointment_date
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Time
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedAppointment.time_slot ||
                          'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-700/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Concern
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-200">
                      {selectedAppointment.concern ||
                        'No concern specified'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Queue
                    </p>

                    {selectedAppointment.queue
                      ?.queue_number ? (
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xl font-black text-maroon-800 dark:text-maroon-300">
                            {
                              selectedAppointment
                                .queue
                                .queue_number
                            }
                          </p>

                          <p className="text-[10px] font-semibold uppercase text-gray-400">
                            {selectedAppointment
                              .queue.queue_type ||
                              'Queue'}
                          </p>
                        </div>

                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {selectedAppointment
                            .queue.status ===
                          'serving'
                            ? 'Your Turn'
                            : selectedAppointment
                                .queue.status ||
                              'Waiting'}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Assigned after kiosk check-in and triage.
                      </p>
                    )}
                  </div>

                  {selectedAppointment.status ===
                    'approved' && (
                    <Link
                      to="/student/qr"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-800 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Open My QR
                    </Link>
                  )}

                  {selectedAppointment.status ===
                    'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleEditClick(
                            selectedAppointment
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-800 px-4 py-3 text-sm font-semibold text-white"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Appointment
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmCancel(
                            selectedAppointment.id
                          );

                          setSelectedAppointment(
                            null
                          );
                        }}
                        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-800/30 dark:bg-red-900/10 dark:text-red-400"
                      >
                        Cancel Appointment
                      </button>
                    </>
                  )}

                  {selectedAppointment.status ===
                    'completed' && (
                    <Link
                      to="/student/health-records"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      View Health Records
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={() =>
              setConfirmCancel(null)
            }
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                duration: 0.2,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-gray-800"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cancel Appointment?
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                This action cannot be undone. The time slot will be released for other students.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmCancel(null)
                  }
                  className="flex-1 rounded-2xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Keep
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appointments;
