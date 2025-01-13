import React from 'react';

const InitialAssessment = ({ stance, responses, setResponses }) => {
  const handleValueChange = (aspect, value) => {
    const newResponses = { ...responses };
    newResponses[aspect] = value;
    setResponses(newResponses);
  };

  return (
    <div className="space-y-6">
      {/* Interest Assessment */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex justify-between mb-2">
          <span className="text-gray-700">To what extent do you find {stance} interesting?</span>
          <div className="flex text-sm text-gray-500">
            <span className="w-20 text-left">1 - Interesting</span>
            <span className="w-20 text-right">7 - Extremely Interesting</span>
          </div>
        </div>
        <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
          <span className="text-sm text-gray-600">Interesting</span>
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                name="initial-interest"
                value={value}
                checked={responses.interesting === value}
                onChange={() => handleValueChange('interesting', value)}
                className="mb-1"
              />
              <span className="text-sm text-gray-600">{value}</span>
            </label>
          ))}
          <span className="text-sm text-gray-600">Extremely interesting</span>
        </div>
      </div>

      {/* Importance Assessment */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex justify-between mb-2">
          <span className="text-gray-700">To what extent do you find {stance} important?</span>
          <div className="flex text-sm text-gray-500">
            <span className="w-20 text-left">1 - Important</span>
            <span className="w-20 text-right">7 - Extremely important</span>
          </div>
        </div>
        <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
          <span className="text-sm text-gray-600">Important</span>
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                name="initial-importance"
                value={value}
                checked={responses.important === value}
                onChange={() => handleValueChange('important', value)}
                className="mb-1"
              />
              <span className="text-sm text-gray-600">{value}</span>
            </label>
          ))}
          <span className="text-sm text-gray-600">Extremely important</span>
        </div>
      </div>

      {/* Agreement Assessment */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex justify-between mb-2">
          <span className="text-gray-700">To what extent do you agree with {stance}?</span>
          <div className="flex text-sm text-gray-500">
            <span className="w-20 text-left">1 - Agree</span>
            <span className="w-20 text-right">7 - Extremely agree</span>
          </div>
        </div>
        <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
          <span className="text-sm text-gray-600">Agree</span>
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                name="initial-agreement"
                value={value}
                checked={responses.agreement === value}
                onChange={() => handleValueChange('agreement', value)}
                className="mb-1"
              />
              <span className="text-sm text-gray-600">{value}</span>
            </label>
          ))}
          <span className="text-sm text-gray-600">Extremely agree</span>
        </div>
      </div>
    </div>
  );
};

export default InitialAssessment;