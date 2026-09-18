import { useState, useEffect, useCallback } from 'react';
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
  Users,
} from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`}
  />
);

const getLocalDateString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .split('T')[0];
};

// Clinic appointment times are interpreted explicitly as Philippine time.
// This avoids Safari/iPhone inconsistencies with strings such as:
// "2026-09-19 8:00 AM"
const parseAppointmentDateTime = (dateString, timeString) => {
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

  // Explicit Philippines offset.
  const isoDateTime =
    `${dateString}T${hourString}:${minute}:00+08:00`;

  const parsed = new Date(isoDateTime);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const Appointments = () => {
  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  const healthProfileDone =
    user?.profile?.health_profile_completed || false;

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
          const data =
            response.data.data;

          const normalized =
            Array.isArray(data)
              ? data
              : data?.data || [];

          setAppointments(
            normalized
          );

          localStorage.setItem(
            'carelink.student.appointments',
            JSON.stringify(
              normalized
            )
          );
        }
      } catch (err) {
        console.log(
          'Fetch appointments error:',
          err
        );
      } finally {
        setPageLoading(false);
      }
    }, []);

  const fetchAvailableSlots =
    useCallback(
      async (date) => {
        if (!date) {
          return;
        }

        setSlotsLoading(true);

        try {
          const token =
            localStorage.getItem(
              'token'
            );

          const response =
            await api.get(
              `/student/available-slots?date=${date}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          if (
            response.data.success
          ) {
            setAvailableSlots(
              response.data.data
                .slots || []
            );
          }
        } catch (err) {
          console.log(
            'Fetch slots error:',
            err
          );
        } finally {
          setSlotsLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (
      showForm &&
      form.date
    ) {
      fetchAvailableSlots(
        form.date
      );

      const interval =
        setInterval(
          () =>
            fetchAvailableSlots(
              form.date
            ),
          30000
        );

      return () =>
        clearInterval(
          interval
        );
    }

    return undefined;
  }, [
    showForm,
    form.date,
    fetchAvailableSlots,
  ]);

  const filteredAppointments =
    filter === 'all'
      ? appointments
      : appointments.filter(
          (appointment) =>
            appointment.status ===
            filter
        );

  const statusConfig = {
    approved: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckCircle,
    },

    pending: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
    },

    completed: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: CheckCircle,
    },

    cancelled: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
    },

    rejected: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: XCircle,
    },
  };

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    if (
      name === 'date' &&
      value
    ) {
      fetchAvailableSlots(
        value
      );
    }
  };

  const getSlotInfo = (time) => {
    const slot =
      availableSlots.find(
        (item) =>
          item.time === time
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
    const slot =
      getSlotInfo(time);

    if (slot.isFull) {
      return 'text-red-500';
    }

    if (
      slot.available <= 3
    ) {
      return 'text-yellow-500';
    }

    return 'text-green-500';
  };

  const getSlotBg = (time) => {
    const slot =
      getSlotInfo(time);

    if (slot.isFull) {
      return 'bg-red-50 dark:bg-red-900/10';
    }

    if (
      slot.available <= 3
    ) {
      return 'bg-yellow-50 dark:bg-yellow-900/10';
    }

    return '';
  };

  const handleEditClick = (
    appointment
  ) => {
    setSelectedAppointment(
      null
    );

    setForm({
      service:
        appointment.service ||
        '',
      date:
        appointment.appointment_date ||
        '',
      time:
        appointment.time_slot ||
        '',
      concern:
        appointment.concern ||
        '',
    });

    setEditingId(
      appointment.id
    );

    setShowForm(true);
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (
        !form.service ||
        !form.date ||
        !form.time
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Please fill all required fields.'
        );

        setTimeout(
          () =>
            setMessage(''),
          3000
        );

        return;
      }

      const slotInfo =
        getSlotInfo(
          form.time
        );

      if (
        slotInfo.isFull
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'This time slot is already full. Please select a different time.'
        );

        setTimeout(
          () =>
            setMessage(''),
          3000
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
        Number.isNaN(
          selectedSlot.getTime()
        ) ||
        selectedSlot <
          new Date()
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Please choose a present or future appointment time.'
        );

        setTimeout(
          () =>
            setMessage(''),
          3000
        );

        return;
      }

      setLoading(true);
      setMessage('');

      try {
        const token =
          localStorage.getItem(
            'token'
          );

        const payload = {
          service:
            form.service,

          appointment_date:
            form.date,

          time_slot:
            form.time,

          concern:
            form.concern ||
            '',
        };

        let response;

        if (editingId) {
          response =
            await api.put(
              `/student/appointments/${editingId}`,
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          setMessageType(
            'success'
          );

          setMessage(
            'Appointment updated!'
          );
        } else {
          response =
            await api.post(
              '/student/appointments',
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          setMessageType(
            'success'
          );

          setMessage(
            `Appointment booked! Ref: ${
              response.data.data
                ?.reference_number ||
              'APT-NEW'
            }`
          );
        }

        if (
          response.data.success
        ) {
          setShowForm(false);
          setEditingId(null);

          setForm({
            service: '',
            date: '',
            time: '',
            concern: '',
          });

          setAvailableSlots(
            []
          );

          fetchAppointments();
        }
      } catch (err) {
        setMessageType(
          'error'
        );

        const validationErrors =
          err.response?.data
            ?.errors;

        const validationMessage =
          validationErrors
            ? Object.values(
                validationErrors
              )
                .flat()
                .join(' ')
            : '';

        setMessage(
          validationMessage ||
            err.response?.data
              ?.message ||
            (err.response
              ? `Failed to save appointment (HTTP ${err.response.status}).`
              : 'Cannot connect to the appointment service.')
        );
      } finally {
        setLoading(false);

        setTimeout(
          () =>
            setMessage(''),
          4000
        );
      }
    };

  const handleCancel =
    async () => {
      if (!confirmCancel) {
        return;
      }

      try {
        const token =
          localStorage.getItem(
            'token'
          );

        await api.patch(
          `/student/appointments/${confirmCancel}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessageType(
          'success'
        );

        setMessage(
          'Appointment cancelled.'
        );

        setConfirmCancel(
          null
        );

        setSelectedAppointment(
          null
        );

        fetchAppointments();
      } catch (err) {
        setMessageType(
          'error'
        );

        setMessage(
          err.response?.data
            ?.message ||
            'Failed to cancel appointment.'
        );
      }

      setTimeout(
        () =>
          setMessage(''),
        3000
      );
    };

  const formatDate = (
    dateString
  ) => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      return new Date(
        dateString
      ).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      );
    } catch {
      return dateString;
    }
  };

  if (!healthProfileDone) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="text-center max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Health Profile Required
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You must complete your Health Profile before booking appointments.
          </p>

          <Link
            to="/student/health-profile"
            className="inline-flex items-center space-x-2 mt-5 px-6 py-3 bg-maroon-800 text-white font-semibold rounded-2xl hover:bg-maroon-900 transition"
          >
            <span>
              Complete Health Profile
            </span>

            <AlertCircle className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="space-y-5 max-w-3xl mx-auto px-4 sm:px-0">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>

          <Skeleton className="h-10 w-24 rounded-2xl" />
        </div>

        <div className="flex gap-2">
          {[...Array(5)].map(
            (_, i) => (
              <Skeleton
                key={i}
                className="h-9 w-20 rounded-xl"
              />
            )
          )}
        </div>

        <div className="space-y-3">
          {[...Array(3)].map(
            (_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>

                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto px-4 sm:px-0 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appointments
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {appointments.length}{' '}
            appointment
            {appointments.length !==
            1
              ? 's'
              : ''}
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(
              !showForm
            );

            setEditingId(null);

            setForm({
              service: '',
              date: '',
              time: '',
              concern: '',
            });

            setAvailableSlots(
              []
            );
          }}
          className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
            showForm
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'bg-maroon-800 text-white shadow-lg shadow-maroon-800/20 hover:bg-maroon-900'
          }`}
        >
          {showForm ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
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
            className={`p-4 rounded-2xl text-sm font-medium text-center ${
              messageType ===
              'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book/Edit Form */}
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
            className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 overflow-hidden"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              {editingId
                ? 'Edit Appointment'
                : 'Book New Appointment'}
            </h3>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/20 rounded-2xl p-3 mb-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />

              <div className="text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold">
                  Clinic Hours
                </p>

                <p>
                  Morning: 8:00 AM – 12:00 PM | Lunch: 12:00 PM – 1:00 PM | Afternoon: 1:00 PM – 5:00 PM
                </p>
              </div>
            </div>

            {form.date && (
              <div className="flex items-center gap-4 text-xs mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  Available
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  Filling up
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Full
                </span>

                {slotsLoading && (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400 ml-auto" />
                )}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                    Service *
                  </label>

                  <div className="relative">
                    <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <select
                      name="service"
                      value={
                        form.service
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                    >
                      <option value="">
                        Select Service
                      </option>

                      {services.map(
                        (service) => (
                          <option
                            key={
                              service
                            }
                            value={
                              service
                            }
                          >
                            {
                              service
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                    Date *
                  </label>

                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                      type="date"
                      name="date"
                      value={
                        form.date
                      }
                      onChange={
                        handleChange
                      }
                      required
                      min={
                        getLocalDateString()
                      }
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                    Time *

                    {form.date &&
                      availableSlots.length >
                        0 && (
                        <span className="font-normal text-gray-400 ml-1">
                          (Max 10 per slot)
                        </span>
                      )}
                  </label>

                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <select
                      name="time"
                      value={
                        form.time
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 appearance-none"
                    >
                      <option value="">
                        Select Time
                      </option>

                      {timeSlots.map(
                        (time) => {
                          const slot =
                            getSlotInfo(
                              time
                            );

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
                              key={
                                time
                              }
                              value={
                                time
                              }
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
                            (slot.booked /
                              10) *
                            100;

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
                                  {
                                    slot.booked
                                  }
                                  /10 booked
                                </span>
                              </div>

                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
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

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
                    Reason
                  </label>

                  <textarea
                    name="concern"
                    value={
                      form.concern
                    }
                    onChange={
                      handleChange
                    }
                    rows={2}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 resize-none"
                    placeholder="Describe your concern..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="w-full py-3 bg-maroon-800 text-white font-semibold rounded-2xl hover:bg-maroon-900 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />

                    <span>
                      Saving...
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />

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

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          'all',
          'pending',
          'approved',
          'completed',
          'cancelled',
        ].map(
          (status) => (
            <button
              key={status}
              onClick={() =>
                setFilter(
                  status
                )
              }
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter ===
                status
                  ? 'bg-maroon-800 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.length ===
        0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />

            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No appointments found
            </p>

            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Book your first appointment above
            </p>
          </div>
        ) : (
          filteredAppointments.map(
            (appointment) => {
              const config =
                statusConfig[
                  appointment.status
                ] ||
                statusConfig.pending;

              return (
                <motion.button
                  key={
                    appointment.id
                  }
                  layout
                  onClick={() =>
                    setSelectedAppointment(
                      appointment
                    )
                  }
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-4 lg:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-maroon-50 dark:bg-maroon-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {appointment.service ||
                            'Appointment'}
                        </h3>

                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {appointment.reference_number ||
                            ''}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {appointment.concern ||
                            'No reason provided'}
                        </p>

                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />

                            <span>
                              {formatDate(
                                appointment.appointment_date
                              )}
                            </span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />

                            <span>
                              {appointment.time_slot ||
                                ''}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
                      >
                        <config.icon className="w-3 h-3" />

                        <span className="capitalize hidden sm:inline">
                          {
                            appointment.status
                          }
                        </span>
                      </span>

                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-500" />
                    </div>
                  </div>
                </motion.button>
              );
            }
          )
        )}
      </div>

      {/* Appointment Detail Modal */}
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() =>
              setSelectedAppointment(
                null
              )
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
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
              style={{
                maxHeight: '90vh',
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    (
                      statusConfig[
                        selectedAppointment.status
                      ] ||
                      statusConfig.pending
                    ).bg
                  } ${
                    (
                      statusConfig[
                        selectedAppointment.status
                      ] ||
                      statusConfig.pending
                    ).text
                  }`}
                >
                  {(() => {
                    const Icon =
                      (
                        statusConfig[
                          selectedAppointment.status
                        ] ||
                        statusConfig.pending
                      ).icon;

                    return (
                      <Icon className="w-3.5 h-3.5" />
                    );
                  })()}

                  <span className="capitalize">
                    {
                      selectedAppointment.status
                    }
                  </span>
                </span>

                <button
                  onClick={() =>
                    setSelectedAppointment(
                      null
                    )
                  }
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div
                className="overflow-y-auto px-5 pb-5"
                style={{
                  WebkitOverflowScrolling:
                    'touch',
                }}
              >
                {selectedAppointment.status ===
                  'pending' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />

                      <div>
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
                          ⏳ Waiting for Approval
                        </p>

                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          Your appointment is pending review by the clinic staff. You can still edit or cancel while it's pending.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppointment.status ===
                  'approved' && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/20 rounded-2xl p-4 mb-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />

                        <div>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                            ✅ Appointment Approved
                          </p>

                          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                            Your appointment has been confirmed! Here's what to do on the day of your visit:
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-maroon-100 dark:bg-maroon-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-maroon-800 dark:text-maroon-400">
                            1
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Arrive Early
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Come to the clinic <strong>10-15 minutes before</strong> your scheduled time ({selectedAppointment.time_slot}).
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-maroon-100 dark:bg-maroon-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-maroon-800 dark:text-maroon-400">
                            2
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Scan QR Code at Kiosk
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Look for the clinic kiosk and <strong>scan your appointment QR code</strong> to check in. This notifies the nurse that you've arrived.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-maroon-100 dark:bg-maroon-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-maroon-800 dark:text-maroon-400">
                            3
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Wait for Your Turn
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            The kiosk system will automatically determine if you're <strong>priority or regular</strong>. Wait for your name to be called.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedAppointment.status ===
                  'completed' && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />

                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                          🎉 Appointment Completed
                        </p>

                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                          Your visit is done! Check your medical records for any follow-up instructions or prescriptions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppointment.status ===
                  'cancelled' && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />

                      <div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                          ❌ Appointment Cancelled
                        </p>

                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                          This appointment has been cancelled. You can book a new appointment anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppointment.status ===
                  'rejected' && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />

                      <div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                          ⚠️ Appointment Rejected
                        </p>

                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                          Unfortunately, your appointment was rejected. Please contact the clinic or try booking a different time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-maroon-50 dark:bg-maroon-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {selectedAppointment.service ||
                        'Appointment'}
                    </h3>

                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      Ref:{' '}
                      {selectedAppointment.reference_number ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />

                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Date
                      </p>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(
                          selectedAppointment.appointment_date
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />

                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Time
                      </p>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedAppointment.time_slot ||
                          'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />

                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Concern
                      </p>

                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedAppointment.concern ||
                          'No concern specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedAppointment.status ===
                    'pending' && (
                    <>
                      <button
                        onClick={() =>
                          handleEditClick(
                            selectedAppointment
                          )
                        }
                        className="w-full py-3 bg-maroon-800 text-white font-semibold rounded-2xl hover:bg-maroon-900 transition flex items-center justify-center gap-1.5 text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Appointment
                      </button>

                      <button
                        onClick={() => {
                          setConfirmCancel(
                            selectedAppointment.id
                          );

                          setSelectedAppointment(
                            null
                          );
                        }}
                        className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition text-sm border border-red-200 dark:border-red-800/20"
                      >
                        Cancel Appointment
                      </button>
                    </>
                  )}

                  <button
                    onClick={() =>
                      setSelectedAppointment(
                        null
                      )
                    }
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() =>
              setConfirmCancel(
                null
              )
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
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Cancel Appointment?
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This action cannot be undone. The time slot will be released for others.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    setConfirmCancel(
                      null
                    )
                  }
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                >
                  Keep
                </button>

                <button
                  onClick={
                    handleCancel
                  }
                  className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-2xl hover:bg-red-600 transition text-sm"
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