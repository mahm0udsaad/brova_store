export const auth = {
  // Sign up page
  signup: {
    title: 'إنشاء حساب جديد',
    subtitle: 'ابدأ ببناء متجرك في ثوانٍ',
    googleSignup: 'المتابعة باستخدام Google',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    password: 'كلمة المرور',
    passwordPlaceholder: '8 أحرف على الأقل',
    confirmPassword: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'اكتب كلمة المرور مرة أخرى',
    signupButton: 'إنشاء الحساب',
    signingUp: 'جارٍ إنشاء الحساب...',
    haveAccount: 'لديك حساب بالفعل؟',
    loginLink: 'تسجيل الدخول',
    orEmail: 'أو استخدم البريد الإلكتروني',

    // Errors
    errors: {
      emailRequired: 'الرجاء إدخال بريدك الإلكتروني',
      emailInvalid: 'هذا لا يبدو بريدًا إلكترونيًا صحيحًا',
      passwordRequired: 'الرجاء اختيار كلمة مرور',
      passwordTooShort: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      emailExists: 'يوجد حساب بالفعل بهذا البريد الإلكتروني',
      weakPassword: 'الرجاء اختيار كلمة مرور أقوى',
      emailNotConfirmed: 'يرجى تأكيد عنوان بريدك الإلكتروني أولاً',
      generic: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى',
    },
  },

  // Login page
  login: {
    title: 'مرحبًا بعودتك',
    subtitle: 'سجّل دخولك للوصول إلى متجرك',
    googleSignin: 'المتابعة باستخدام Google',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    password: 'كلمة المرور',
    passwordPlaceholder: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول...',
    noAccount: 'ليس لديك حساب؟',
    signupLink: 'إنشاء حساب',
    forgotPassword: 'نسيت كلمة المرور؟',
    orEmail: 'أو استخدم البريد الإلكتروني',

    // Errors
    errors: {
      emailRequired: 'الرجاء إدخال بريدك الإلكتروني',
      emailInvalid: 'هذا لا يبدو بريدًا إلكترونيًا صحيحًا',
      passwordRequired: 'الرجاء إدخال كلمة المرور',
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      tooManyAttempts: 'محاولات كثيرة جدًا. الرجاء المحاولة بعد بضع دقائق',
      emailNotConfirmed: 'يرجى تأكيد عنوان بريدك الإلكتروني أولاً',
      generic: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى',
    },
  },

  // Common
  orEmail: 'أو استخدم البريد الإلكتروني',
  or: 'أو',
}
