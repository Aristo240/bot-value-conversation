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
      <div className="bg-white shadow-xl rounded-lg p-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Detailed Information */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Consent Form
          </h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-gray-700 text-lg mb-4">
              Welcome to our research study on social media challenges. 
              Before you begin, please carefully read and understand the following information:
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Study Details</h2>
            <ul className="list-decimal list-outside pl-5 space-y-3 text-gray-600">
              <li>This study involves discussing social media challenges with an AI bot and completing several questionnaires.</li>
              <li>Your participation is completely voluntary, and you may withdraw at any time without any consequences.</li>
              <li>All data collected will be kept strictly confidential and used only for research purposes.</li>
              <li>The entire session will take approximately 20-30 minutes to complete.</li>
              <li>There are no known physical or psychological risks associated with participating in this study.</li>
            </ul>
          </div>
        </div>
        
        {/* Right Column - Consent and Agreement */}
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Contact Information</h2>
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <p className="text-blue-700 mb-2">
                If you have any questions, concerns, or complaints about this research, 
                please contact the main researcher:
              </p>
              <a 
                href="mailto:naamarozen@tauex.tau.ac.il" 
                className="text-blue-600 hover:underline font-medium"
              >
                naamarozen@tauex.tau.ac.il
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Participant Confirmation</h2>
            <p className="text-gray-600">
              By clicking "I Agree," you confirm that:
            </p>
            
            <ul className="list-disc list-outside pl-5 space-y-2 text-gray-600">
              <li>You have carefully read and fully understood the above information</li>
              <li>You voluntarily agree to participate in this research study</li>
              <li>You are at least 18 years old</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
              />
              <label 
                htmlFor="consent-checkbox" 
                className="text-sm text-gray-700"
              >
                I have read and agree to the consent terms
              </label>
            </div>
            
            <button
              onClick={handleConsent}
              disabled={!isChecked}
              className="w-full bg-blue-600 text-white py-3 rounded-md 
                hover:bg-blue-700 focus:outline-none focus:ring-2 
                focus:ring-blue-500 focus:ring-offset-2
                disabled:bg-gray-400 disabled:cursor-not-allowed
                transition duration-300 ease-in-out"
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm;