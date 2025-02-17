import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Hardcode the key temporarily for debugging
const SITE_KEY = '6LdvDtoqAAAAALZam9WW6FuvqBExmlgomMNTquNH';

function ReCAPTCHA({ onVerify, onFail, sessionId }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.onload = () => setIsLoading(false);
    document.head.appendChild(script);

    // Add debugging
    console.log('Current SITE_KEY:', SITE_KEY);
    console.log('Environment variable:', process.env.REACT_APP_RECAPTCHA_SITE_KEY);

    // Define the callback function globally
    window.onCaptchaSubmit = async (token) => {
      try {
        const response = await axios.post('/api/verify-recaptcha', {
          token,
          sessionId
        });

        if (response.data.success) {
          setError(null);
          onVerify();
        } else {
          const errorMessage = response.data.error || 'Verification failed';
          console.error('Verification failed:', errorMessage);
          setError(errorMessage);
          onFail();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('reCAPTCHA verification failed:', errorMessage);
        setError(errorMessage);
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
          Please check the box below to verify that you're human.
        </p>
        {isLoading ? (
          <div className="text-center">Loading verification...</div>
        ) : (
          <div className="flex justify-center">
            <div 
              className="g-recaptcha" 
              data-sitekey={SITE_KEY}
              data-callback="onCaptchaSubmit"
            ></div>
          </div>
        )}
        {/* Add debug info */}
        <div className="mt-4 text-xs text-gray-500">
          Debug - Site Key: {SITE_KEY}
        </div>
        {error && (
          <div className="mt-4 text-red-600 text-sm text-center">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReCAPTCHA; 