import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SITE_KEY = '6LdvDtoqAAAAALZam9WW6FuvqBExmlgomMNTquNH'; // Your v2 Checkbox site key

function ReCAPTCHA({ onVerify, onFail, sessionId }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load reCAPTCHA v2 script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.onload = () => setIsLoading(false);
    document.head.appendChild(script);

    // Define callback for when user completes the captcha
    window.onCaptchaComplete = async (token) => {
      try {
        const response = await axios.post('/api/verify-recaptcha', {
          token,
          sessionId
        });

        if (response.data.success) {
          setError(null);
          onVerify();
        } else {
          setError('Verification failed. Please try again.');
          onFail();
        }
      } catch (error) {
        setError('An error occurred. Please try again.');
        onFail();
      }
    };

    return () => {
      document.head.removeChild(script);
      delete window.onCaptchaComplete;
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
              data-callback="onCaptchaComplete"
            ></div>
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-600 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReCAPTCHA; 