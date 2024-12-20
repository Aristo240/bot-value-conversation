import React, { useState } from 'react';

export const ConsentForm = ({ onConsent }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleConsent = () => {
    if (isChecked) {
      onConsent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Consent Form
        </h1>
        
        <p className="text-gray-700 mb-6">
          Welcome to our research study on social media challenges. Before you begin, please read and agree to the following:
        </p>
        
        <ul className="list-decimal list-inside space-y-3 mb-6 text-gray-700">
          <li>This study involves discussing social media challenges with an AI bot and completing several questionnaires.</li>
          <li>Your participation is voluntary and you may withdraw at any time.</li>
          <li>All data collected will be kept confidential and used only for research purposes.</li>
          <li>The session will take approximately 20-30 minutes to complete.</li>
          <li>There are no known risks associated with participating in this study.</li>
        </ul>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            If you have any questions, concerns or complaints about this research, contact the main researcher at{' '}
            <a 
              href="mailto:naamarozen@tauex.tau.ac.il" 
              className="text-blue-600 hover:underline"
            >
              naamarozen@tauex.tau.ac.il
            </a>
          </p>
        </div>
        
        <p className="mb-4 text-gray-700">
          By clicking "I Agree," you confirm that:
        </p>
        
        <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
          <li>You have read and understood the above information</li>
          <li>You voluntarily agree to participate</li>
          <li>You are at least 18 years old</li>
        </ul>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="consent-checkbox"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label 
            htmlFor="consent-checkbox" 
            className="ml-2 block text-sm text-gray-900"
          >
            I have read and agree to the consent terms
          </label>
        </div>
        
        <button
          onClick={handleConsent}
          disabled={!isChecked}
          className="w-full bg-blue-600 text-white py-2 rounded-md 
            hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:ring-offset-2
            disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          I Agree
        </button>
      </div>
    </div>
  );
};

export default ConsentForm;