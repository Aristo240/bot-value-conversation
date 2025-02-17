import React, { useState } from 'react';

const AttentionCheck = ({ onPass, onFail, isSecondAttempt = false }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleContinue = () => {
    if (selectedOption === null) {
      onPass();
    } else {
      if (isSecondAttempt) {
        onFail();
      } else {
        // Show second attempt
        onFail();
      }
    }
  };

  return (
    <div className="w-3/4 mx-auto p-8 bg-white shadow-lg min-h-screen">
      {isSecondAttempt && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Dear participants, a lot of effort was invested in this study. It is important to us that you read the instructions carefully. We will present you with the same question again. This time please read the preliminary instruction carefully.
          </p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Sometimes people participating in studies are not attentive to the instructions of the study. To make sure that you read the instructions carefully, we ask you to click "Continue" button without answering the next question. Immediately afterwards we will move to the research itself.
        </p>

        <div className="mt-6">
          <p className="font-semibold mb-4">How old are you?</p>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="age"
                value="over18"
                checked={selectedOption === 'over18'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span>Over 18 years old</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="age"
                value="under18"
                checked={selectedOption === 'under18'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span>Under 18 years old</span>
            </label>
          </div>
        </div>
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
};

export default AttentionCheck; 