import React from 'react';
import { stances } from '../../config/botConfig';

const InitialAssessment = ({ stance, responses, setResponses }) => {
  const handleValueChange = (aspect, value) => {
    const newResponses = { ...responses };
    newResponses[aspect] = parseInt(value);
    setResponses(newResponses);
  };

  // Get the stance keys
  const stanceKeys = Object.keys(stances);
  
  // Get the opposite stance key
  const oppositeStanceKey = stanceKeys.find(key => stances[key] !== stance);

  return (
    <div className="space-y-6">
      {/* Assigned Stance Agreement */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex justify-between mb-2">
          <span className="text-gray-700">How much do you agree with <strong style={{ fontWeight: 'bold' }}>{stance}</strong>?</span>
        </div>
        <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
          <span className="text-sm text-gray-600">Strongly Disagree</span>
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                name="initial-assigned-stance"
                value={value}
                checked={responses.assigned === value}
                onChange={() => handleValueChange('assigned', value)}
                className="mb-1"
              />
              <span className="text-sm text-gray-600">{value}</span>
            </label>
          ))}
          <span className="text-sm text-gray-600">Strongly Agree</span>
        </div>
      </div>

      {/* Opposite Stance Agreement */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex justify-between mb-2">
          <span className="text-gray-700">How much do you agree with <strong style={{ fontWeight: 'bold' }}>{stances[oppositeStanceKey]}</strong>?</span>
        </div>
        <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
          <span className="text-sm text-gray-600">Strongly Disagree</span>
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                name="initial-opposite-stance"
                value={value}
                checked={responses.opposite === value}
                onChange={() => handleValueChange('opposite', value)}
                className="mb-1"
              />
              <span className="text-sm text-gray-600">{value}</span>
            </label>
          ))}
          <span className="text-sm text-gray-600">Strongly Agree</span>
        </div>
      </div>
    </div>
  );
};

export default InitialAssessment;