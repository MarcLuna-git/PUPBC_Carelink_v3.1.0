import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import authService from '../../services/authService';

import {
  Eye,
  EyeOff,
  Loader2,
  Hash,
  Mail,
  Phone,
  Lock,
  Calendar,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

import clinicLogo from '../../assets/clinic logo.jpg';
import pupbg from '../../assets/pupbg.jpg';

const OTP_RESEND_COOLDOWN = 60;
const OTP_EXPIRY_MINUTES = 10;

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    mobile_number: '',

    dobMonth: '',
    dobDay: '',
    dobYear: '',

    gender: '',
    course: '',
    year: '',
    section: '',

    password: '',
    password_confirmation: '',

    agree_terms: false,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [otpStep, setOtpStep] =
    useState(false);

  const [otp, setOtp] =
    useState('');

  const [
    otpCooldown,
    setOtpCooldown,
  ] = useState(0);

  const [
    resendingOtp,
    setResendingOtp,
  ] = useState(false);

  const courses = [
    {
      value: 'BSIT',
      label:
        'Information Technology (BSIT)',
    },
    {
      value: 'BSCS',
      label:
        'Computer Science (BSCS)',
    },
    {
      value: 'BSIS',
      label:
        'Information Systems (BSIS)',
    },
    {
      value: 'BSCE',
      label:
        'Civil Engineering (BSCE)',
    },
    {
      value: 'BSEE',
      label:
        'Electrical Engineering (BSEE)',
    },
    {
      value: 'BSME',
      label:
        'Mechanical Engineering (BSME)',
    },
    {
      value: 'BSA',
      label:
        'Accountancy (BSA)',
    },
    {
      value: 'BSBA',
      label:
        'Business Administration (BSBA)',
    },
    {
      value: 'BSED',
      label:
        'Secondary Education (BSED)',
    },
    {
      value: 'BEED',
      label:
        'Elementary Education (BEED)',
    },
    {
      value: 'BSN',
      label:
        'Nursing (BSN)',
    },
    {
      value: 'BSHM',
      label:
        'Hospitality Management (BSHM)',
    },
    {
      value: 'BSTourism',
      label:
        'Tourism Management (BSTourism)',
    },
    {
      value: 'BSOA',
      label:
        'Office Administration (BSOA)',
    },
    {
      value: 'BPA',
      label:
        'Public Administration (BPA)',
    },
  ];

  const getSections = (year) => {
    const sectionMap = {
      '1st Year': [
        '1-1',
        '1-2',
        '1-3',
        '1-4',
        '1-5',
      ],

      '2nd Year': [
        '2-1',
        '2-2',
        '2-3',
        '2-4',
        '2-5',
      ],

      '3rd Year': [
        '3-1',
        '3-2',
        '3-3',
        '3-4',
        '3-5',
      ],

      '4th Year': [
        '4-1',
        '4-2',
        '4-3',
        '4-4',
        '4-5',
      ],
    };

    return sectionMap[year] || [];
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const currentYear =
    new Date().getFullYear();

  const years = Array.from(
    { length: 80 },
    (_, i) => currentYear - i
  );

  const days = useMemo(() => {
    if (
      !form.dobMonth ||
      !form.dobYear
    ) {
      return Array.from(
        { length: 31 },
        (_, i) => i + 1
      );
    }

    const maxDay = new Date(
      Number(form.dobYear),
      Number(form.dobMonth),
      0
    ).getDate();

    return Array.from(
      { length: maxDay },
      (_, i) => i + 1
    );
  }, [
    form.dobMonth,
    form.dobYear,
  ]);

  const nameRegex =
    /^[A-Za-z\s\-'.]+$/;

  const idRegex =
    /^\d{4}-\d{5}-BN-[01]$/i;


  useEffect(() => {
    if (otpCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(
      () => {
        setOtpCooldown((current) => {
          if (current <= 1) {
            window.clearInterval(timer);

            return 0;
          }

          return current - 1;
        });
      },
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, [otpCooldown]);


  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    let newVal =
      type === 'checkbox'
        ? checked
        : value;

    if (name === 'student_id') {
      const raw = value
        .toUpperCase()
        .replace(/[^0-9BN-]/g, '');

      const clean =
        raw.replace(/-/g, '');

      if (clean.length <= 4) {
        newVal = clean;
      } else if (
        clean.length <= 9
      ) {
        newVal =
          clean.slice(0, 4) +
          '-' +
          clean.slice(4);
      } else if (
        clean.length <= 11
      ) {
        newVal =
          clean.slice(0, 4) +
          '-' +
          clean.slice(4, 9) +
          '-' +
          clean.slice(9);
      } else {
        newVal =
          clean.slice(0, 4) +
          '-' +
          clean.slice(4, 9) +
          '-' +
          clean.slice(9, 11) +
          '-' +
          clean.slice(11, 12);
      }

      if (newVal.length > 17) {
        newVal =
          newVal.slice(0, 17);
      }
    }

    if (
      [
        'first_name',
        'middle_name',
        'last_name',
      ].includes(name)
    ) {
      newVal =
        value.replace(
          /[^A-Za-z\s\-'.]/g,
          ''
        );
    }

    if (name === 'mobile_number') {
      newVal =
        value.replace(
          /[^0-9+]/g,
          ''
        );

      if (
        newVal.startsWith('63') &&
        !newVal.startsWith('+')
      ) {
        newVal = '+' + newVal;
      }

      newVal =
        newVal.startsWith('+63')
          ? newVal.slice(0, 13)
          : newVal.slice(0, 11);
    }

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: newVal,
      };

      if (
        name === 'year' &&
        newVal !== previous.year
      ) {
        updated.section = '';
      }

      if (
        name === 'dobMonth' ||
        name === 'dobYear'
      ) {
        const selectedMonth =
          name === 'dobMonth'
            ? newVal
            : updated.dobMonth;

        const selectedYear =
          name === 'dobYear'
            ? newVal
            : updated.dobYear;

        if (
          selectedMonth &&
          selectedYear &&
          updated.dobDay
        ) {
          const maxDay =
            new Date(
              Number(selectedYear),
              Number(selectedMonth),
              0
            ).getDate();

          if (
            Number(updated.dobDay) >
            maxDay
          ) {
            updated.dobDay = '';
          }
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: '',
      }));
    }
  };


  const validate = () => {
    const newErrors = {};

    if (!form.first_name.trim()) {
      newErrors.first_name =
        'First name is required';
    } else if (
      !nameRegex.test(
        form.first_name
      )
    ) {
      newErrors.first_name =
        'Letters only';
    }

    if (!form.last_name.trim()) {
      newErrors.last_name =
        'Last name is required';
    } else if (
      !nameRegex.test(
        form.last_name
      )
    ) {
      newErrors.last_name =
        'Letters only';
    }

    if (
      form.middle_name &&
      !nameRegex.test(
        form.middle_name
      )
    ) {
      newErrors.middle_name =
        'Letters only';
    }

    if (!form.student_id.trim()) {
      newErrors.student_id =
        'Student ID is required';
    } else if (
      !idRegex.test(
        form.student_id.trim()
      )
    ) {
      newErrors.student_id =
        'Format: 2023-00000-BN-0';
    }

    if (!form.email.trim()) {
      newErrors.email =
        'Email is required';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
      )
    ) {
      newErrors.email =
        'Enter a valid email address';
    }

    if (
      !form.mobile_number.trim()
    ) {
      newErrors.mobile_number =
        'Mobile number is required';
    } else if (
      !/^(09\d{9}|\+63\d{10})$/.test(
        form.mobile_number.replace(
          /\s/g,
          ''
        )
      )
    ) {
      newErrors.mobile_number =
        'Use 09XXXXXXXXX or +63XXXXXXXXXX';
    }

    if (
      !form.dobMonth ||
      !form.dobDay ||
      !form.dobYear
    ) {
      newErrors.birthday =
        'Please select your birthday';
    }

    if (!form.gender) {
      newErrors.gender =
        'Please select a gender';
    }

    if (!form.course) {
      newErrors.course =
        'Course is required';
    }

    if (!form.year) {
      newErrors.year =
        'Year is required';
    }

    if (!form.section) {
      newErrors.section =
        'Section is required';
    }

    if (!form.password) {
      newErrors.password =
        'Password is required';
    } else if (
      form.password.length < 8
    ) {
      newErrors.password =
        'Password must be at least 8 characters';
    }

    if (
      form.password !==
      form.password_confirmation
    ) {
      newErrors.password_confirmation =
        'Passwords do not match';
    }

    if (!form.agree_terms) {
      newErrors.agree_terms =
        'You must agree to the Terms to continue';
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };


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
        setMessage(
          'Email address is missing. Please register again.'
        );

        return;
      }

      setResendingOtp(true);
      setMessage('');
      setOtp('');

      setErrors((previous) => ({
        ...previous,
        otp: '',
      }));

      try {
        const res =
          await authService
            .resendRegistrationOtp(
              email
            );

        if (res.success) {
          setOtpCooldown(
            OTP_RESEND_COOLDOWN
          );

          setMessage(
            res.message ||
              `A new verification code was sent. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`
          );
        } else {
          setMessage(
            res.message ||
              'Unable to resend verification code.'
          );
        }
      } catch (err) {
        setMessage(
          err.response?.data
            ?.message ||
            'Unable to resend verification code. Please try again.'
        );
      } finally {
        setResendingOtp(false);
      }
    };


  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (otpStep) {
        if (
          !/^\d{6}$/.test(otp)
        ) {
          setErrors((previous) => ({
            ...previous,
            otp:
              'Enter the 6-digit code sent to your email.',
          }));

          return;
        }

        setLoading(true);
        setMessage('');

        try {
          const res =
            await authService
              .verifyRegistration(
                form.email.trim(),
                otp
              );

          if (res.success) {
            setMessage(
              'Email verified and account created! Redirecting to login...'
            );

            window.setTimeout(
              () =>
                navigate('/login'),
              2000
            );
          } else {
            setMessage(
              res.message ||
                'Verification failed.'
            );
          }
        } catch (err) {
          setMessage(
            err.response?.data
              ?.message ||
              'Verification failed. Please try again.'
          );
        } finally {
          setLoading(false);
        }

        return;
      }

      if (!validate()) {
        return;
      }

      setLoading(true);
      setMessage('');

      try {
        const pad = (number) =>
          String(number).padStart(
            2,
            '0'
          );

        const payload = {
          student_id:
            form.student_id
              .trim()
              .toUpperCase(),

          first_name:
            form.first_name.trim(),

          middle_name:
            form.middle_name.trim() ||
            null,

          last_name:
            form.last_name.trim(),

          email:
            form.email.trim(),

          mobile_number:
            form.mobile_number.trim(),

          birthday:
            `${form.dobYear}-${pad(
              form.dobMonth
            )}-${pad(
              form.dobDay
            )}`,

          gender: form.gender,
          course: form.course,
          year: form.year,
          section: form.section,

          password:
            form.password,

          password_confirmation:
            form.password_confirmation,
        };

        const res =
          await authService
            .register(payload);

        if (res.success) {
          setOtpStep(true);

          setOtpCooldown(
            OTP_RESEND_COOLDOWN
          );

          setMessage(
            res.message ||
              `A 6-digit verification code was sent to your email. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`
          );
        } else {
          setMessage(
            res.message ||
              'Registration failed.'
          );
        }
      } catch (err) {
        const data =
          err.response?.data;

        setMessage(
          data?.message ||
            'Registration failed. Please try again.'
        );

        if (data?.errors) {
          setErrors(
            data.errors
          );
        }
      } finally {
        setLoading(false);
      }
    };

  const sections =
    getSections(form.year);

  const FieldError = ({
    error,
  }) =>
    error ? (
      <p className="text-red-500 text-xs mt-1">
        {Array.isArray(error)
          ? error[0]
          : error}
      </p>
    ) : null;

  const selectClass =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none';

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8 px-4">

      <div className="absolute inset-0">
        <img
          src={pupbg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/78 via-maroon-800/72 to-maroon-950/78" />
      </div>

      <div className="relative z-10 w-full max-w-xl">

        <div className="flex flex-col items-center mb-5">
          <img
            src={clinicLogo}
            alt="PUPBC CareLink logo"
            className="w-20 h-20 object-cover drop-shadow-lg rounded-full"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">

          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create a new account
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              It&apos;s quick and easy.
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm text-center ${
                message
                  .toLowerCase()
                  .includes('sent') ||
                message
                  .toLowerCase()
                  .includes('created') ||
                message
                  .toLowerCase()
                  .includes('verified')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
          >

            <div className="grid grid-cols-2 gap-3">

              <div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  disabled={otpStep}
                />

                <FieldError
                  error={
                    errors.first_name
                  }
                />
              </div>

              <div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  disabled={otpStep}
                />

                <FieldError
                  error={
                    errors.last_name
                  }
                />
              </div>
            </div>

            <div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                type="text"
                name="middle_name"
                value={form.middle_name}
                onChange={handleChange}
                placeholder="Middle name (optional)"
                disabled={otpStep}
              />

              <FieldError
                error={
                  errors.middle_name
                }
              />
            </div>

            <div>
              <div className="relative">

                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none uppercase"
                  type="text"
                  name="student_id"
                  value={
                    form.student_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Student ID (2023-00000-BN-0)"
                  maxLength={17}
                  disabled={otpStep}
                />
              </div>

              <FieldError
                error={
                  errors.student_id
                }
              />
            </div>

            <div>
              <div className="relative">

                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={
                    handleChange
                  }
                  placeholder="Email address"
                  disabled={otpStep}
                />
              </div>

              <FieldError
                error={errors.email}
              />
            </div>

            <div>
              <div className="relative">

                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                  type="tel"
                  name="mobile_number"
                  value={
                    form.mobile_number
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Mobile number (09XXXXXXXXX)"
                  disabled={otpStep}
                />
              </div>

              <FieldError
                error={
                  errors.mobile_number
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">

                <Calendar className="inline w-3.5 h-3.5 -mt-0.5 mr-1 text-gray-400" />

                Birthday
              </label>

              <p className="text-[11px] text-gray-400 mb-2">
                Month / Day / Year
              </p>

              <div className="grid grid-cols-12 gap-2">

                <div className="col-span-5">

                  <label className="block text-[10px] text-gray-500 mb-1">
                    Month
                  </label>

                  <select
                    className={
                      selectClass
                    }
                    name="dobMonth"
                    value={
                      form.dobMonth
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      otpStep
                    }
                  >
                    <option value="">
                      Month
                    </option>

                    {months.map(
                      (month) => (
                        <option
                          key={
                            month.value
                          }
                          value={
                            month.value
                          }
                        >
                          {
                            month.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="col-span-3">

                  <label className="block text-[10px] text-gray-500 mb-1">
                    Day
                  </label>

                  <select
                    className={
                      selectClass
                    }
                    name="dobDay"
                    value={
                      form.dobDay
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      otpStep
                    }
                  >
                    <option value="">
                      Day
                    </option>

                    {days.map(
                      (day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {day}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="col-span-4">

                  <label className="block text-[10px] text-gray-500 mb-1">
                    Year
                  </label>

                  <select
                    className={
                      selectClass
                    }
                    name="dobYear"
                    value={
                      form.dobYear
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      otpStep
                    }
                  >
                    <option value="">
                      Year
                    </option>

                    {years.map(
                      (year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <FieldError
                error={
                  errors.birthday
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Gender
              </label>

              <div className="grid grid-cols-3 gap-2">

                {[
                  'male',
                  'female',
                  'other',
                ].map((gender) => (
                  <label
                    key={gender}
                    className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition ${
                      form.gender ===
                      gender
                        ? 'border-maroon-800 bg-maroon-50 text-maroon-800'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={
                        form.gender ===
                        gender
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        otpStep
                      }
                      className="sr-only"
                    />

                    {gender
                      .charAt(0)
                      .toUpperCase() +
                      gender.slice(1)}
                  </label>
                ))}
              </div>

              <FieldError
                error={
                  errors.gender
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <select
                  className={
                    selectClass
                  }
                  name="course"
                  value={
                    form.course
                  }
                  onChange={
                    handleChange
                  }
                  disabled={otpStep}
                >
                  <option value="">
                    Course
                  </option>

                  {courses.map(
                    (course) => (
                      <option
                        key={
                          course.value
                        }
                        value={
                          course.value
                        }
                      >
                        {
                          course.label
                        }
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  error={
                    errors.course
                  }
                />
              </div>

              <div>
                <select
                  className={
                    selectClass
                  }
                  name="year"
                  value={
                    form.year
                  }
                  onChange={
                    handleChange
                  }
                  disabled={otpStep}
                >
                  <option value="">
                    Year level
                  </option>

                  {[
                    '1st Year',
                    '2nd Year',
                    '3rd Year',
                    '4th Year',
                  ].map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  error={
                    errors.year
                  }
                />
              </div>
            </div>

            <div>
              <select
                className={
                  selectClass
                }
                name="section"
                value={
                  form.section
                }
                onChange={
                  handleChange
                }
                disabled={
                  !form.year ||
                  otpStep
                }
              >
                <option value="">
                  {form.year
                    ? 'Section'
                    : 'Select year level first'}
                </option>

                {sections.map(
                  (section) => (
                    <option
                      key={section}
                      value={section}
                    >
                      {section}
                    </option>
                  )
                )}
              </select>

              <FieldError
                error={
                  errors.section
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <div className="relative">

                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
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
                    placeholder="New password"
                    disabled={
                      otpStep
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:bg-gray-100 rounded-lg"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <FieldError
                  error={
                    errors.password
                  }
                />
              </div>

              <div>
                <div className="relative">

                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
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
                    placeholder="Confirm password"
                    disabled={
                      otpStep
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:bg-gray-100 rounded-lg"
                  >
                    {showConfirmPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <FieldError
                  error={
                    errors.password_confirmation
                  }
                />
              </div>
            </div>

            {form.password &&
              form.password ===
                form.password_confirmation && (
                <p className="text-green-600 text-xs flex items-center gap-1 -mt-2">
                  <CheckCircle className="w-3 h-3" />
                  Passwords match
                </p>
              )}

            {otpStep && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">

                <div className="flex items-start gap-3">

                  <ShieldCheck className="w-5 h-5 text-maroon-800 mt-0.5 flex-shrink-0" />

                  <div className="flex-1">

                    <p className="font-semibold text-maroon-900 text-sm">
                      Verify your email
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      We sent a
                      6-digit code to{' '}
                      <strong>
                        {form.email}
                      </strong>
                      . The code is
                      valid for{' '}
                      {OTP_EXPIRY_MINUTES}{' '}
                      minutes.
                    </p>

                    <input
                      className="w-full mt-3 border border-yellow-300 rounded-xl px-3.5 py-2.5 text-center text-lg tracking-[0.5em] font-bold bg-white focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(
                          e.target.value
                            .replace(
                              /\D/g,
                              ''
                            )
                            .slice(
                              0,
                              6
                            )
                        );

                        if (
                          errors.otp
                        ) {
                          setErrors(
                            (
                              previous
                            ) => ({
                              ...previous,
                              otp: '',
                            })
                          );
                        }
                      }}
                      placeholder="000000"
                      aria-label="Email verification code"
                    />

                    <FieldError
                      error={
                        errors.otp
                      }
                    />

                    <div className="mt-3 text-center">

                      {otpCooldown >
                      0 ? (
                        <p className="text-xs text-gray-500">
                          Resend code in{' '}
                          <strong>
                            {
                              otpCooldown
                            }
                            s
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
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-800 hover:text-maroon-950 hover:underline disabled:opacity-50"
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
                </div>
              </div>
            )}

            {!otpStep && (
              <div>
                <div className="flex items-start space-x-2">

                  <input
                    type="checkbox"
                    name="agree_terms"
                    checked={
                      form.agree_terms
                    }
                    onChange={
                      handleChange
                    }
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500"
                  />

                  <label className="text-xs text-gray-500">
                    I agree to the{' '}
                    <span className="text-maroon-600 font-medium">
                      Terms of
                      Service
                    </span>{' '}
                    and{' '}
                    <span className="text-maroon-600 font-medium">
                      Privacy
                      Policy
                    </span>
                  </label>
                </div>

                <FieldError
                  error={
                    errors.agree_terms
                  }
                />
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                resendingOtp
              }
              className="w-full py-3 bg-maroon-800 hover:bg-maroon-900 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-60 shadow-lg shadow-maroon-800/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />

                  <span>
                    {otpStep
                      ? 'Verifying email...'
                      : 'Sending verification code...'}
                  </span>
                </>
              ) : (
                <span>
                  {otpStep
                    ? 'Verify & Create Account'
                    : 'Sign Up'}
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an
            account?{' '}
            <Link
              to="/login"
              className="text-maroon-800 font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-white/50 text-xs mt-4">
          <Link
            to="/"
            className="hover:underline"
          >
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;