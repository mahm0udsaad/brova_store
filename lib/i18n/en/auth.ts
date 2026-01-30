export const auth = {
  // Sign up page
  signup: {
    title: 'Create your account',
    subtitle: 'Start building your store in seconds',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Type your password again',
    signupButton: 'Create account',
    signingUp: 'Creating account...',
    haveAccount: 'Already have an account?',
    loginLink: 'Log in',
    
    // Errors
    errors: {
      emailRequired: 'Please enter your email',
      emailInvalid: "That doesn't look like a valid email",
      passwordRequired: 'Please choose a password',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordMismatch: "Passwords don't match",       
      emailExists: 'An account with this email already exists',
      weakPassword: 'Please choose a stronger password',
      generic: 'Something went wrong. Please try again',
    },
  },

  // Login page
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to continue to your store',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'Your password',
    loginButton: 'Log in',
    loggingIn: 'Logging in...',
    noAccount: "Don't have an account?",
    signupLink: 'Sign up',
    forgotPassword: 'Forgot password?',
    
    // Errors
    errors: {
      emailRequired: 'Please enter your email',
      emailInvalid: "That doesn't look like a valid email",
      passwordRequired: 'Please enter your password',
      invalidCredentials: "The email or password doesn't look right",
      tooManyAttempts: 'Too many attempts. Please try again in a few minutes',
      generic: 'Something went wrong. Please try again',
    },
  },

  // Common
  or: 'or',
}
