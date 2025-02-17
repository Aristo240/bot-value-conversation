import React, { useRef, useEffect } from 'react';
import axios from 'axios';

const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

function ReCAPTCHA({ onVerify, onFail }) {
  const captchaRef = useRef(null);

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    document.body.appendChild(script);

    // Set up the callback function
    window.captchaCallback = async (token) => {
      try {
        // Verify the token with our backend
        const response = await axios.post('/api/verify-recaptcha', { token });
        if (response.data.success) {
          onVerify();
        } else {
          onFail();
        }
      } catch (error) {
        console.error('reCAPTCHA verification failed:', error);
        onFail();
      }
    };

    return () => {
      document.body.removeChild(script);
      delete window.captchaCallback;
    };
  }, [onVerify, onFail]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Verify You're Human</h2>
        <p className="mb-6 text-gray-600 text-center">
          Please complete the verification below to continue.
        </p>
        <div className="flex justify-center">
          <div
            className="g-recaptcha"
            data-sitekey={SITE_KEY}
            data-callback="captchaCallback"
            ref={captchaRef}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default ReCAPTCHA; 