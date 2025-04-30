import React from 'react';

const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18); // 18-100
const genderOptions = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];
const educationOptions = [
  "Less than high school",
  "High school graduate",
  "Some college",
  "Bachelor's degree",
  "Master's degree",
  "Doctoral degree",
  "Professional degree"
];

const Demographics = ({ responses, setResponses, onSubmit }) => {
  const handleChange = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = () => {
    return responses.age && responses.gender && responses.education;
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Demographic Information</h2>
      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Age:</label>
          <select 
            value={responses.age || ''}
            onChange={(e) => handleChange('age', parseInt(e.target.value))}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select age</option>
            {ageOptions.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Gender:</label>
          <div className="space-y-2">
            {genderOptions.map(gender => (
              <label key={gender} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={responses.gender === gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </div>

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

export default Demographics;