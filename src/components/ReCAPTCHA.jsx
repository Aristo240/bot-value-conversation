import React, { useEffect } from 'react';
import axios from 'axios';

// Hardcode the key temporarily for debugging
const SITE_KEY = '6LdvDtoqAAAAALZam9WW6FuvqBExmlgomMNTquNH';

function ReCAPTCHA({ onVerify, onFail, sessionId }) {
  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    document.head.appendChild(script);

    // Add debugging
    console.log('Current SITE_KEY:', SITE_KEY);
    console.log('Environment variable:', process.env.REACT_APP_RECAPTCHA_SITE_KEY);

    // Define the callback function globally before the script loads
    window.onCaptchaSubmit = async (token) => {
      try {
        console.log('reCAPTCHA callback triggered with token:', token);
        const response = await axios.post('/api/verify-recaptcha', { 
          token,
          sessionId 
        });
        
        console.log('Verification response:', response.data);
        
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
      document.head.removeChild(script);
      delete window.onCaptchaSubmit;
    };
  }, [onVerify, onFail, sessionId]);

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
            data-callback="onCaptchaSubmit"
          ></div>
        </div>
        {/* Add debug info */}
        <div className="mt-4 text-xs text-gray-500">
          Debug - Site Key: {SITE_KEY}
        </div>
      </div>
    </div>
  );
}

export default ReCAPTCHA; 