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
  User,
  GraduationCap,
  X,
  ChevronRight,
  FileText,
} from 'lucide-react';

import clinicLogo from '../../assets/clinic logo.jpg';
import pupbg from '../../assets/pupbg.jpg';

const OTP_RESEND_COOLDOWN = 60;
const OTP_EXPIRY_MINUTES = 10;

const courses = [
  {
    value: 'BSIT',
    label: 'BSIT',
  },
  {
    value: 'BSCPE',
    label: 'BSCPE',
  },
  {
    value: 'BSIE',
    label: 'BSIE',
  },
  {
    value: 'BSBA-HRM',
    label: 'BSBA-HRM',
  },
  {
    value: 'BSED-SS',
    label: 'BSED-SS',
  },
  {
    value: 'BSED-English',
    label: 'BSED-English',
  },
  {
    value: 'BEED',
    label: 'BEED',
  },
  {
    value: 'BSPSYCH',
    label: 'BSPSYCH',
  },
  {
    value: 'DIT',
    label: 'DIT',
  },
  {
    value: 'DCET',
    label: 'DCET',
  },
];

const yearLevels = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
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
  {
    value: '01',
    label: 'January',
  },
  {
    value: '02',
    label: 'February',
  },
  {
    value: '03',
    label: 'March',
  },
  {
    value: '04',
    label: 'April',
  },
  {
    value: '05',
    label: 'May',
  },
  {
    value: '06',
    label: 'June',
  },
  {
    value: '07',
    label: 'July',
  },
  {
    value: '08',
    label: 'August',
  },
  {
    value: '09',
    label: 'September',
  },
  {
    value: '10',
    label: 'October',
  },
  {
    value: '11',
    label: 'November',
  },
  {
    value: '12',
    label: 'December',
  },
];

const SectionTitle = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
      <Icon className="h-4 w-4" />
    </div>

    <div>
      <h3 className="text-sm font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-0.5 text-xs leading-5 text-gray-500">
        {description}
      </p>
    </div>
  </div>
);

const Register = () => {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
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
      password_confirmation:
        '',

      agree_terms: false,
    });

  const [errors, setErrors] =
    useState({});

  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

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

  const [
    legalModal,
    setLegalModal,
  ] = useState(null);

  const currentYear =
    new Date().getFullYear();

  const birthYears =
    useMemo(
      () =>
        Array.from(
          {
            length: 80,
          },
          (_, index) =>
            currentYear -
            index
        ),
      [currentYear]
    );

  const birthDays =
    useMemo(() => {
      if (
        !form.dobMonth ||
        !form.dobYear
      ) {
        return Array.from(
          {
            length: 31,
          },
          (_, index) =>
            index + 1
        );
      }

      const maxDay =
        new Date(
          Number(form.dobYear),
          Number(form.dobMonth),
          0
        ).getDate();

      return Array.from(
        {
          length: maxDay,
        },
        (_, index) =>
          index + 1
      );
    }, [
      form.dobMonth,
      form.dobYear,
    ]);

  const sections =
    useMemo(
      () =>
        getSections(
          form.year
        ),
      [form.year]
    );

  const nameRegex =
    /^[A-Za-z\s\-'.]+$/;

  const idRegex =
    /^\d{4}-\d{5}-BN-[01]$/i;

  useEffect(() => {
    if (
      otpCooldown <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setOtpCooldown(
            (current) => {
              if (
                current <= 1
              ) {
                window.clearInterval(
                  timer
                );

                return 0;
              }

              return (
                current - 1
              );
            }
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [otpCooldown]);

  const formatStudentId = (
    value
  ) => {
    const clean =
      value
        .toUpperCase()
        .replace(
          /[^0-9BN]/g,
          ''
        );

    if (
      clean.length <= 4
    ) {
      return clean;
    }

    if (
      clean.length <= 9
    ) {
      return `${clean.slice(
        0,
        4
      )}-${clean.slice(
        4
      )}`;
    }

    if (
      clean.length <= 11
    ) {
      return `${clean.slice(
        0,
        4
      )}-${clean.slice(
        4,
        9
      )}-${clean.slice(
        9
      )}`;
    }

    return `${clean.slice(
      0,
      4
    )}-${clean.slice(
      4,
      9
    )}-${clean.slice(
      9,
      11
    )}-${clean.slice(
      11,
      12
    )}`.slice(0, 17);
  };

  const normalizeMobileForDisplay =
    (value) => {
      let cleaned =
        value.replace(
          /[^0-9+]/g,
          ''
        );

      if (
        cleaned.startsWith(
          '63'
        )
      ) {
        cleaned =
          `+${cleaned}`;
      }

      if (
        cleaned.startsWith(
          '+63'
        )
      ) {
        return cleaned.slice(
          0,
          13
        );
      }

      return cleaned.slice(
        0,
        11
      );
    };

  const normalizeMobileForApi =
    (value) => {
      const cleaned =
        value.replace(
          /\s/g,
          ''
        );

      if (
        /^09\d{9}$/.test(
          cleaned
        )
      ) {
        return `+63${cleaned.slice(
          1
        )}`;
      }

      return cleaned;
    };

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    let newValue =
      type === 'checkbox'
        ? checked
        : value;

    if (
      name ===
      'student_id'
    ) {
      newValue =
        formatStudentId(
          value
        );
    }

    if (
      [
        'first_name',
        'middle_name',
        'last_name',
      ].includes(name)
    ) {
      newValue =
        value.replace(
          /[^A-Za-z\s\-'.]/g,
          ''
        );
    }

    if (
      name ===
      'mobile_number'
    ) {
      newValue =
        normalizeMobileForDisplay(
          value
        );
    }

    setForm(
      (previous) => {
        const updated = {
          ...previous,
          [name]:
            newValue,
        };

        if (
          name ===
            'year' &&
          newValue !==
            previous.year
        ) {
          updated.section =
            '';
        }

        if (
          [
            'dobMonth',
            'dobYear',
          ].includes(name)
        ) {
          const month =
            name ===
            'dobMonth'
              ? newValue
              : updated.dobMonth;

          const year =
            name ===
            'dobYear'
              ? newValue
              : updated.dobYear;

          if (
            month &&
            year &&
            updated.dobDay
          ) {
            const maxDay =
              new Date(
                Number(year),
                Number(month),
                0
              ).getDate();

            if (
              Number(
                updated.dobDay
              ) >
              maxDay
            ) {
              updated.dobDay =
                '';
            }
          }
        }

        return updated;
      }
    );

    setErrors(
      (previous) => ({
        ...previous,
        [name]: '',
        ...(name.startsWith(
          'dob'
        )
          ? {
              birthday:
                '',
            }
          : {}),
      })
    );
  };

  const getBirthday =
    () => {
      if (
        !form.dobMonth ||
        !form.dobDay ||
        !form.dobYear
      ) {
        return '';
      }

      return `${form.dobYear}-${String(
        form.dobMonth
      ).padStart(
        2,
        '0'
      )}-${String(
        form.dobDay
      ).padStart(
        2,
        '0'
      )}`;
    };

  const getPasswordStrength =
    () => {
      const password =
        form.password;

      if (!password) {
        return {
          score: 0,
          label:
            'Enter a password',
        };
      }

      let score = 0;

      if (
        password.length >= 8
      ) {
        score += 1;
      }

      if (
        password.length >= 12
      ) {
        score += 1;
      }

      if (
        /[a-z]/.test(
          password
        ) &&
        /[A-Z]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (
        /\d/.test(password)
      ) {
        score += 1;
      }

      if (
        /[^A-Za-z0-9]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (score <= 1) {
        return {
          score,
          label: 'Weak',
        };
      }

      if (score <= 3) {
        return {
          score,
          label: 'Fair',
        };
      }

      if (score === 4) {
        return {
          score,
          label: 'Strong',
        };
      }

      return {
        score,
        label:
          'Very strong',
      };
    };

  const passwordStrength =
    getPasswordStrength();

  const validateEmail = (
    email
  ) => {
    const value =
      email.trim();

    if (!value) {
      return 'Email is required';
    }

    if (
      !value.includes('@')
    ) {
      return 'Email must include @, for example name@gmail.com';
    }

    const parts =
      value.split('@');

    if (
      parts.length !== 2 ||
      !parts[0] ||
      !parts[1]
    ) {
      return 'Enter a complete email address';
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(
        value
      )
    ) {
      return 'Enter a valid email address, for example name@gmail.com';
    }

    return '';
  };

  const validate = () => {
    const newErrors =
      {};

    if (
      !form.first_name.trim()
    ) {
      newErrors.first_name =
        'First name is required';
    } else if (
      !nameRegex.test(
        form.first_name
      )
    ) {
      newErrors.first_name =
        'Use letters only';
    }

    if (
      !form.last_name.trim()
    ) {
      newErrors.last_name =
        'Last name is required';
    } else if (
      !nameRegex.test(
        form.last_name
      )
    ) {
      newErrors.last_name =
        'Use letters only';
    }

    if (
      form.middle_name &&
      !nameRegex.test(
        form.middle_name
      )
    ) {
      newErrors.middle_name =
        'Use letters only';
    }

    if (
      !form.student_id.trim()
    ) {
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

    const emailError =
      validateEmail(
        form.email
      );

    if (emailError) {
      newErrors.email =
        emailError;
    }

    const mobile =
      form.mobile_number
        .trim()
        .replace(
          /\s/g,
          ''
        );

    if (!mobile) {
      newErrors.mobile_number =
        'Mobile number is required';
    } else if (
      !/^09\d{9}$/.test(
        mobile
      ) &&
      !/^\+639\d{9}$/.test(
        mobile
      )
    ) {
      newErrors.mobile_number =
        'Use 09XXXXXXXXX or +639XXXXXXXXX';
    }

    if (
      !form.dobMonth ||
      !form.dobDay ||
      !form.dobYear
    ) {
      newErrors.birthday =
        'Birthday is required';
    } else {
      const birthday =
        getBirthday();

      const birthdayDate =
        new Date(
          `${birthday}T00:00:00+08:00`
        );

      if (
        Number.isNaN(
          birthdayDate.getTime()
        )
      ) {
        newErrors.birthday =
          'Enter a valid birthday';
      } else if (
        birthdayDate >
        new Date()
      ) {
        newErrors.birthday =
          'Birthday cannot be in the future';
      }
    }

    if (!form.gender) {
      newErrors.gender =
        'Select your gender';
    }

    if (!form.course) {
      newErrors.course =
        'Course is required';
    }

    if (!form.year) {
      newErrors.year =
        'Year level is required';
    }

    if (!form.section) {
      newErrors.section =
        'Section is required';
    }

    if (!form.password) {
      newErrors.password =
        'Password is required';
    } else if (
      form.password.length <
      8
    ) {
      newErrors.password =
        'Password must be at least 8 characters';
    }

    if (
      !form.password_confirmation
    ) {
      newErrors.password_confirmation =
        'Confirm your password';
    } else if (
      form.password !==
      form.password_confirmation
    ) {
      newErrors.password_confirmation =
        'Passwords do not match';
    }

    if (!form.agree_terms) {
      newErrors.agree_terms =
        'Please agree to the Terms of Service and Privacy Policy';
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(
        newErrors
      ).length === 0
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

      setResendingOtp(
        true
      );

      setMessage('');
      setOtp('');

      setErrors(
        (previous) => ({
          ...previous,
          otp: '',
        })
      );

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
        setResendingOtp(
          false
        );
      }
    };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (otpStep) {
        if (
          !/^\d{6}$/.test(
            otp
          )
        ) {
          setErrors(
            (previous) => ({
              ...previous,
              otp:
                'Enter the 6-digit code sent to your email.',
            })
          );

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
                navigate(
                  '/login'
                ),
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
            form.email
              .trim()
              .toLowerCase(),

          mobile_number:
            normalizeMobileForApi(
              form.mobile_number
            ),

          birthday:
            getBirthday(),

          gender:
            form.gender,

          course:
            form.course,

          year:
            form.year,

          section:
            form.section,

          password:
            form.password,

          password_confirmation:
            form.password_confirmation,
        };

        const res =
          await authService.register(
            payload
          );

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

  const FieldError = ({
    error,
  }) =>
    error ? (
      <p className="mt-1 text-xs text-red-500">
        {Array.isArray(error)
          ? error[0]
          : error}
      </p>
    ) : null;

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-maroon-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-500 disabled:cursor-not-allowed disabled:opacity-60';

  const iconInputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 transition focus:border-maroon-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-500 disabled:cursor-not-allowed disabled:opacity-60';

  const selectClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 transition focus:border-maroon-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-500 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="absolute inset-0">
        <img
          src={pupbg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/80 via-maroon-800/75 to-maroon-950/85" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="mb-5 flex flex-col items-center">
          <img
            src={clinicLogo}
            alt="PUPBC CareLink logo"
            className="h-20 w-20 rounded-full object-cover drop-shadow-lg"
          />

          <p className="mt-2 text-sm font-semibold text-white/80">
            PUPBC CareLink
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create Account
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Register your student account for clinic services.
            </p>
          </div>

          {message && (
            <div
              className={`mb-5 rounded-xl p-3 text-center text-sm ${
                message
                  .toLowerCase()
                  .includes(
                    'sent'
                  ) ||
                message
                  .toLowerCase()
                  .includes(
                    'created'
                  ) ||
                message
                  .toLowerCase()
                  .includes(
                    'verified'
                  )
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-6"
            autoComplete="on"
          >
            {!otpStep && (
              <>
                {/* Personal */}
                <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
                  <SectionTitle
                    icon={User}
                    title="Personal Information"
                    description="Enter your student identity exactly as it appears in school records."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        First Name
                      </label>

                      <input
                        className={
                          inputClass
                        }
                        type="text"
                        name="first_name"
                        value={
                          form.first_name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="First name"
                        autoComplete="given-name"
                      />

                      <FieldError
                        error={
                          errors.first_name
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Last Name
                      </label>

                      <input
                        className={
                          inputClass
                        }
                        type="text"
                        name="last_name"
                        value={
                          form.last_name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Last name"
                        autoComplete="family-name"
                      />

                      <FieldError
                        error={
                          errors.last_name
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Middle Name
                      <span className="ml-1 font-normal text-gray-400">
                        optional
                      </span>
                    </label>

                    <input
                      className={
                        inputClass
                      }
                      type="text"
                      name="middle_name"
                      value={
                        form.middle_name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Middle name"
                      autoComplete="additional-name"
                    />

                    <FieldError
                      error={
                        errors.middle_name
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Student ID
                    </label>

                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        className={`${iconInputClass} uppercase`}
                        type="text"
                        name="student_id"
                        value={
                          form.student_id
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="2023-00000-BN-0"
                        maxLength={
                          17
                        }
                        autoComplete="username"
                      />
                    </div>

                    <FieldError
                      error={
                        errors.student_id
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Birthday
                    </label>

                    <p className="mb-2 text-[11px] text-gray-400">
                      Month / Day / Year
                    </p>

                    <div className="grid grid-cols-[1.35fr_0.75fr_1fr] gap-2">
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
                      >
                        <option value="">
                          Month
                        </option>

                        {months.map(
                          (
                            month
                          ) => (
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
                      >
                        <option value="">
                          Day
                        </option>

                        {birthDays.map(
                          (day) => (
                            <option
                              key={
                                day
                              }
                              value={String(
                                day
                              ).padStart(
                                2,
                                '0'
                              )}
                            >
                              {
                                day
                              }
                            </option>
                          )
                        )}
                      </select>

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
                      >
                        <option value="">
                          Year
                        </option>

                        {birthYears.map(
                          (year) => (
                            <option
                              key={
                                year
                              }
                              value={
                                year
                              }
                            >
                              {
                                year
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <FieldError
                      error={
                        errors.birthday
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-600">
                      Gender
                    </label>

                    <div className="inline-flex w-full rounded-xl bg-gray-100 p-1">
                      {[
                        {
                          value:
                            'male',
                          label:
                            'Male',
                        },
                        {
                          value:
                            'female',
                          label:
                            'Female',
                        },
                        {
                          value:
                            'other',
                          label:
                            'Other',
                        },
                      ].map(
                        (
                          option
                        ) => (
                          <label
                            key={
                              option.value
                            }
                            className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              form.gender ===
                              option.value
                                ? 'bg-white text-maroon-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name="gender"
                              value={
                                option.value
                              }
                              checked={
                                form.gender ===
                                option.value
                              }
                              onChange={
                                handleChange
                              }
                              className="sr-only"
                            />

                            {
                              option.label
                            }
                          </label>
                        )
                      )}
                    </div>

                    <FieldError
                      error={
                        errors.gender
                      }
                    />
                  </div>
                </section>

                {/* Academic */}
                <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
                  <SectionTitle
                    icon={
                      GraduationCap
                    }
                    title="Academic Information"
                    description="Select your current course, year level, and section."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Course
                      </label>

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
                      >
                        <option value="">
                          Select course
                        </option>

                        {courses.map(
                          (
                            course
                          ) => (
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
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Year Level
                      </label>

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
                      >
                        <option value="">
                          Select year
                        </option>

                        {yearLevels.map(
                          (year) => (
                            <option
                              key={
                                year
                              }
                              value={
                                year
                              }
                            >
                              {
                                year
                              }
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
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Section
                    </label>

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
                        !form.year
                      }
                    >
                      <option value="">
                        {form.year
                          ? 'Select section'
                          : 'Select year level first'}
                      </option>

                      {sections.map(
                        (
                          section
                        ) => (
                          <option
                            key={
                              section
                            }
                            value={
                              section
                            }
                          >
                            {
                              section
                            }
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

                  <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-[11px] leading-5 text-blue-700">
                    Course and section options are currently based on the registration setup. Later, these can be managed from the clinic/admin side without changing the student form.
                  </div>
                </section>

                {/* Contact */}
                <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
                  <SectionTitle
                    icon={Mail}
                    title="Contact Information"
                    description="Your email is used for OTP verification and clinic notifications."
                  />

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        className={
                          iconInputClass
                        }
                        type="text"
                        name="email"
                        value={
                          form.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="name@gmail.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>

                    <p className="mt-1 text-[11px] text-gray-400">
                      Example: name@gmail.com
                    </p>

                    <FieldError
                      error={
                        errors.email
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Mobile Number
                    </label>

                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        className={
                          iconInputClass
                        }
                        type="tel"
                        name="mobile_number"
                        value={
                          form.mobile_number
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </div>

                    <p className="mt-1 text-[11px] text-gray-400">
                      Accepted: 09XXXXXXXXX or +639XXXXXXXXX
                    </p>

                    <FieldError
                      error={
                        errors.mobile_number
                      }
                    />
                  </div>
                </section>

                {/* Security */}
                <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
                  <SectionTitle
                    icon={Lock}
                    title="Account Security"
                    description="Create a secure password for your CareLink account."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Password
                      </label>

                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                          className={`${iconInputClass} pr-11`}
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
                          placeholder="Create password"
                          autoComplete="new-password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (
                                current
                              ) =>
                                !current
                            )
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                          aria-label={
                            showPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                        >
                          {showPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
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
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Confirm Password
                      </label>

                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                          className={`${iconInputClass} pr-11`}
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
                          autoComplete="new-password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (
                                current
                              ) =>
                                !current
                            )
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                          aria-label={
                            showConfirmPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                        >
                          {showConfirmPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
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

                  {form.password && (
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600">
                          Password strength
                        </p>

                        <span
                          className={`text-xs font-bold ${
                            passwordStrength.score <=
                            1
                              ? 'text-red-600'
                              : passwordStrength.score <=
                                  3
                                ? 'text-yellow-600'
                                : 'text-green-600'
                          }`}
                        >
                          {
                            passwordStrength.label
                          }
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-5 gap-1">
                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (
                            level
                          ) => (
                            <div
                              key={
                                level
                              }
                              className={`h-1.5 rounded-full ${
                                level <=
                                passwordStrength.score
                                  ? passwordStrength.score <=
                                    1
                                    ? 'bg-red-500'
                                    : passwordStrength.score <=
                                        3
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          )
                        )}
                      </div>

                      <p className="mt-2 text-[11px] leading-5 text-gray-500">
                        Use at least 8 characters. A mix of uppercase, lowercase, numbers, and symbols is stronger.
                      </p>
                    </div>
                  )}

                  {form.password &&
                    form.password_confirmation &&
                    form.password ===
                      form.password_confirmation && (
                      <p className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Passwords match
                      </p>
                    )}

                  <div>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        name="agree_terms"
                        checked={
                          form.agree_terms
                        }
                        onChange={
                          handleChange
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 accent-maroon-800"
                      />

                      <p className="text-xs leading-5 text-gray-500">
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() =>
                            setLegalModal(
                              'terms'
                            )
                          }
                          className="font-semibold text-maroon-700 hover:underline"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() =>
                            setLegalModal(
                              'privacy'
                            )
                          }
                          className="font-semibold text-maroon-700 hover:underline"
                        >
                          Privacy Policy
                        </button>
                        .
                      </p>
                    </div>

                    <FieldError
                      error={
                        errors.agree_terms
                      }
                    />
                  </div>
                </section>
              </>
            )}

            {/* OTP */}
            {otpStep && (
              <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-maroon-800" />

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-maroon-900">
                      Verify your email
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      We sent a 6-digit verification code to{' '}
                      <strong className="break-all">
                        {
                          form.email
                        }
                      </strong>
                      . The code is valid for{' '}
                      {OTP_EXPIRY_MINUTES}{' '}
                      minutes.
                    </p>

                    <input
                      className="mt-4 w-full rounded-xl border border-yellow-300 bg-white px-3.5 py-3 text-center text-xl font-bold tracking-[0.45em] focus:outline-none focus:ring-2 focus:ring-maroon-500"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={
                        6
                      }
                      value={otp}
                      onChange={(
                        e
                      ) => {
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

                        setErrors(
                          (
                            previous
                          ) => ({
                            ...previous,
                            otp: '',
                          })
                        );
                      }}
                      placeholder="000000"
                    />

                    <FieldError
                      error={
                        errors.otp
                      }
                    />

                    <div className="mt-4 text-center">
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
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-800 hover:underline disabled:opacity-50"
                        >
                          {resendingOtp ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}

                          {resendingOtp
                            ? 'Resending...'
                            : 'Resend OTP'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                resendingOtp
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-800 px-4 py-3 font-bold text-white shadow-lg shadow-maroon-800/25 transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  <span>
                    {otpStep
                      ? 'Verifying email...'
                      : 'Sending verification code...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {otpStep
                      ? 'Verify & Create Account'
                      : 'Continue to Email Verification'}
                  </span>

                  {!otpStep && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}

            <Link
              to="/login"
              className="font-semibold text-maroon-800 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-white/60">
          <Link
            to="/"
            className="hover:underline"
          >
            ← Back to Home
          </Link>
        </p>
      </div>

      {/* Terms / Privacy Modal */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() =>
            setLegalModal(null)
          }
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-maroon-800" />

                <h2 className="font-bold text-gray-900">
                  {legalModal ===
                  'terms'
                    ? 'Terms of Service'
                    : 'Privacy Policy'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setLegalModal(
                    null
                  )
                }
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {legalModal ===
              'terms' ? (
                <div className="space-y-4 text-sm leading-6 text-gray-600">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Account Use
                    </h3>

                    <p className="mt-1">
                      Your CareLink account is intended for your own student clinic transactions and health-service access.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Accurate Information
                    </h3>

                    <p className="mt-1">
                      Information submitted during registration should match your school records and should be kept accurate.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Account Security
                    </h3>

                    <p className="mt-1">
                      Keep your account credentials private and do not intentionally allow another person to use your CareLink account.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Clinic Services
                    </h3>

                    <p className="mt-1">
                      Appointments, QR check-in, queueing, and health records are subject to clinic procedures and availability.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-6 text-gray-600">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Information Collected
                    </h3>

                    <p className="mt-1">
                      CareLink may process student identity, contact details, appointment information, and clinic-related health records needed to provide campus health services.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Purpose
                    </h3>

                    <p className="mt-1">
                      Information is used for account verification, clinic appointments, check-in and queue management, notifications, and authorized health-service documentation.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Access
                    </h3>

                    <p className="mt-1">
                      Clinic-related information should only be accessed by the student and authorized clinic personnel according to system permissions.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Data Accuracy
                    </h3>

                    <p className="mt-1">
                      Contact information and self-declared profile information should be kept updated so the clinic can reach you when necessary.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={() =>
                  setLegalModal(
                    null
                  )
                }
                className="w-full rounded-xl bg-maroon-800 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;