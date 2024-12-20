import React, { useState } from 'react';

export const ConsentForm = ({ onConsent }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6">Consent Form</h2>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800">
            Welcome to our research study on social media challenges. 
            Before you begin, please carefully read and understand the following information:
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Study Details</h3>
          <ul className="list-disc ml-6 text-sm text-blue-800 space-y-2">
            <li>This study involves discussing social media challenges with an AI bot and completing several questionnaires</li>
            <li>Your participation is completely voluntary, and you may withdraw at any time</li>
            <li>All data collected will be kept strictly confidential and used only for research purposes</li>
            <li>The entire session will take approximately 20-30 minutes to complete</li>
            <li>There are no known risks associated with participating in this study</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">By Participating You Confirm That:</h3>
          <ul className="list-disc ml-6 text-sm text-yellow-800 space-y-2">
            <li>You have carefully read and fully understood the above information</li>
            <li>You voluntarily agree to participate in this research study</li>
            <li>You are at least 18 years old</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
          <div className="text-sm text-blue-800">
            <p className="mb-2">If you have any questions, concerns, or complaints about this research, please contact:</p>
            <p className="font-semibold">Researcher: Naama Rozen</p>
            <p>Email: <a href="mailto:naamarozen@tauex.tau.ac.il" className="text-blue-600 hover:underline">naamarozen@tauex.tau.ac.il</a></p>
          </div>
        </div>

        <div className="border-t pt-6">
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
            className={`mt-6 w-full bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-300
              ${!isChecked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm;