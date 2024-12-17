import React from 'react';

const attitudeAspects = [
  "Interesting", "Enjoyable", "Difficult", "Irritating", "Helpful",
  "Satisfying", "Effective", "Engaging", "Stimulating", "Informative", "Frustrating"
];

export const AttitudeSurvey = ({ stance, responses, setResponses }) => {
  const handleValueChange = (aspect, value) => {
    const newResponses = { ...responses };
    newResponses[aspect] = value;
    setResponses(newResponses);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6">Experience Rating</h2>
      <p className="mb-4">How would you rate your experience writing about {stance}?</p>

      <div className="space-y-6">
        {attitudeAspects.map((aspect) => (
          <div key={aspect} className="border-b pb-4">
            <p className="mb-2">{aspect}</p>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <label key={value} className="flex flex-col items-center">
                  <input
                    type="radio"
                    name={`attitude-${aspect}`}
                    value={value}
                    checked={responses[aspect] === value}
                    onChange={() => handleValueChange(aspect, value)}
                    className="mb-1"
                  />
                  <span className="text-sm">{value}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttitudeSurvey;