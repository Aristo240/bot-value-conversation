import React from 'react';

const educationOptions = [
  "Less than high school",
  "High school graduate",
  "Some college",
  "Bachelor's degree",
  "Master's degree",
  "Doctoral degree",
  "Professional degree"
];
const raceOptions = [
  "White",
  "Black or African American",
  "American Indian or Alaska Native",
  "Asian",
  "Native Hawaiian or Other Pacific Islander",
  "Other",
  "Prefer not to answer"
];
const politicalViewsOptions = [
  "Very liberal",
  "Liberal",
  "Moderate",
  "Conservative",
  "Very conservative",
  "Don't know / Haven't thought about it",
  "Prefer not to answer"
];

const DemographicsPart2 = ({ responses, setResponses, onSubmit }) => {
  const handleChange = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = () => {
    return responses.education && responses.race && responses.politicalViews;
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Additional Demographic Information</h2>
      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Education Level:</label>
          <div className="space-y-2">
            {educationOptions.map(education => (
              <label key={education} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="education"
                  value={education}
                  checked={responses.education === education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{education}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">How would you describe your race?:</label>
          <div className="space-y-2">
            {raceOptions.map(race => (
              <label key={race} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="race"
                  value={race}
                  checked={responses.race === race}
                  onChange={(e) => handleChange('race', e.target.value)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{race}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">How would you describe your political views?</label>
          <div className="space-y-2">
            {politicalViewsOptions.map(politicalView => (
              <label key={politicalView} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="politicalViews"
                  value={politicalView}
                  checked={responses.politicalViews === politicalView}
                  onChange={(e) => handleChange('politicalViews', e.target.value)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{politicalView}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={!isFormComplete()}
          className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
            !isFormComplete() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default DemographicsPart2; 