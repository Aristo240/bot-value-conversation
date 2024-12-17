import React from 'react';

export const ConsentForm = ({ onConsent }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6">Consent Form</h2>
      
      <div className="prose lg:prose-lg mb-6 space-y-4">
        <p>Welcome to our research study. Before you begin, please read and agree to the following:</p>
        
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <p>1. This study involves discussing social media challenges with an AI bot and completing several questionnaires.</p>
          <p>2. Your participation is voluntary and you may withdraw at any time.</p>
          <p>3. All data collected will be kept confidential and used only for research purposes.</p>
          <p>4. The session will take approximately 20-30 minutes to complete.</p>
          <p>5. There are no known risks associated with participating in this study.</p>
        </div>

        <p>By clicking "I Agree," you confirm that:</p>
        <ul>
          <li>You have read and understood the above information</li>
          <li>You voluntarily agree to participate</li>
          <li>You are at least 18 years old</li>
        </ul>
      </div>

      <button 
        onClick={onConsent}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-300"
      >
        I Agree
      </button>
    </div>
  );
};

export default ConsentForm;