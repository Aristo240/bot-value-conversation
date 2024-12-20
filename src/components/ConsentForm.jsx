import React, { useState } from 'react';

export const ConsentForm = ({ onConsent }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleConsent = () => {
    if (isChecked) {
      onConsent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Left Column - Contact Information */}
        <div className="bg-blue-600 text-white p-8 flex flex-col justify-between md:col-span-1">
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <div className="bg-blue-500 bg-opacity-30 p-6 rounded-lg">
              <p className="mb-4">
                If you have any questions, concerns, or complaints about this research, 
                please contact the main researcher:
              </p>
              <div className="border-l-4 border-white pl-4">
                <p className="font-semibold">Researcher:</p>
                <p>Naama Rozen</p>
                <p className="mt-2">Email:</p>
                <a 
                  href="mailto:naamarozen@tauex.tau.ac.il" 
                  className="text-white hover:underline break-all"
                >
                  naamarozen@tauex.tau.ac.il
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm opacity-75">
            <p>Tel Aviv University</p>
            <p>Research Ethics Committee</p>
          </div>
        </div>

        {/* Right Column - Consent Content */}
        <div className="p-12 md:col-span-2 space-y-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Consent Form
          </h1>
          
          <div className="space-y-6">
            <p className="text-lg text-gray-700">
              Welcome to our research study on social media challenges. 
              Before you begin, please carefully read and understand the following information:
            </p>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-700">Study Details</h2>
              <ul className="list-decimal list-outside pl-6 space-y-3 text-gray-600">
                <li>This study involves discussing social media challenges with an AI bot and completing several questionnaires.</li>
                <li>Your participation is completely voluntary, and you may withdraw at any time without any consequences.</li>
                <li>All data collected will be kept strictly confidential and used only for research purposes.</li>
                <li>The entire session will take approximately 20-30 minutes to complete.</li>
                <li>There are no known physical or psychological risks associated with participating in this study.</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-700">Participant Confirmation</h2>
              <p className="text-lg text-gray-600">
                By clicking "I Agree," you confirm that:
              </p>
              
              <ul className="list-disc list-outside pl-6 space-y-2 text-gray-600">
                <li>You have carefully read and fully understood the above information</li>
                <li>You voluntarily agree to participate in this research study</li>
                <li>You are at least 18 years old</li>
              </ul>
            </div>
            
            <div className="space-y-4 pt-4">
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
                  className="text-base text-gray-700"
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
                  transition duration-300 ease-in-out text-lg"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm;