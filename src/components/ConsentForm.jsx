import React, { useState } from 'react';

export const ConsentForm = ({ onConsent }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Main Content - Left Side (spans 2 columns) */}
        <div className="p-8 md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Consent Form
          </h2>
          
          <p className="text-gray-600">
            Welcome to our research study on social media challenges. 
            Before you begin, please carefully read and understand the following information:
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Study Details</h3>
              <ul className="list-disc list-outside ml-5 space-y-2 text-gray-600">
                <li>This study involves discussing social media challenges with an AI bot and completing several questionnaires and tasks</li>
                <li>Your participation is completely voluntary, and you may withdraw at any time</li>
                <li>All data collected will be kept strictly confidential and used only for research purposes</li>
                <li>The entire session will take approximately 20 minutes to complete</li>
                <li>There are no known risks associated with participating in this study</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Participant Confirmation</h3>
              <ul className="list-disc list-outside ml-5 space-y-2 text-gray-600">
                <li>You have carefully read and fully understood the above information</li>
                <li>You voluntarily agree to participate in this research study</li>
                <li>You are at least 18 years old</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Participation Requirements</h3>
              <ul className="list-disc list-outside ml-5 space-y-2 text-gray-600">
                <li>This study requires your full attention for approximately 20 minutes</li>
                <li>Please participate only if you can complete the entire study without interruption</li>
                <li>Do not navigate away from the experiment screen or use other devices</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
              <div className="flex items-center">
                <p className="font-bold text-red-700">⚠️ Warning ⚠️</p>
              </div>
              <p className="text-red-700 mt-2">
                Leaving the experiment screen will terminate the study and result in no compensation.
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">I have read and agree to the consent terms</span>
              </label>
              
              <button
                onClick={() => isChecked && onConsent()}
                disabled={!isChecked}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg font-semibold 
                  ${!isChecked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                  transition duration-300`}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>

        {/* Contact Info - Right Side */}
        <div className="bg-gray-50 p-6 md:col-span-1 border-l">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="text-gray-600 space-y-2">
              <p>If you have any questions, concerns, or complaints about this research, please contact:</p>
              <div className="mt-4">
                <p className="font-semibold">Researcher:</p>
                <p>Dr. Naama Rozen</p>
                <p className="mt-2">Email:</p>
                <a 
                  href="mailto:naamarozen@tauex.tau.ac.il" 
                  className="text-blue-600 hover:underline break-all"
                >
                  naamarozen@tauex.tau.ac.il
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm;