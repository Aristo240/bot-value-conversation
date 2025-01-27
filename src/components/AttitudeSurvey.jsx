import React from 'react';
import axios from 'axios';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

// Export the aspects array
export const attitudeAspects = [
  "Interesting", "Enjoyable", "Difficult", "Irritating", "Helpful",
  "Satisfying", "Effective", "Engaging", "Stimulating", "Informative", "Frustrating"
];

const AttitudeSurvey = ({ stance, responses, setResponses, sessionId }) => {
  const handleValueChange = async (aspect, value) => {
    try {
      const newResponses = {
        ...responses,
        [aspect.toLowerCase()]: parseInt(value, 10)
      };
      setResponses(newResponses);
      
      // Save to server in the same format as PVQ21
      await axios.post(`${API_URL}/sessions/${sessionId}/attitudeSurvey`, {
        responses: newResponses
      });
    } catch (error) {
      console.error('Error saving Attitude Survey response:', error);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Experience Rating</h2>
      <p className="mb-6 text-gray-700">How would you rate your experience writing about {stance}?</p>

      <div className="space-y-6">
        {attitudeAspects.map((aspect) => (
          <div key={aspect} className="pb-6 border-b border-gray-200">
            <p className="mb-4 text-gray-700">{aspect}</p>
            <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
              <span className="text-sm text-gray-600">Not at all</span>
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <label key={value} className="flex flex-col items-center">
                  <input
                    type="radio"
                    name={`attitude-${aspect}`}
                    value={value}
                    checked={responses[aspect.toLowerCase()] === value}
                    onChange={() => handleValueChange(aspect, value)}
                    className="mb-1"
                  />
                  <span className="text-sm text-gray-600">{value}</span>
                </label>
              ))}
              <span className="text-sm text-gray-600">Very much</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttitudeSurvey;