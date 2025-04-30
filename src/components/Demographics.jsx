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
            style={{ 
              WebkitAppearance: 'menulist-button',
              MozAppearance: 'menulist-button',
              appearance: 'menulist-button'
            }}
          >
            <option value="">Select age</option>
            {ageOptions.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Gender:</label>
          <select 
            value={responses.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              WebkitAppearance: 'menulist-button',
              MozAppearance: 'menulist-button',
              appearance: 'menulist-button'
            }}
          >
            <option value="">Select gender</option>
            {genderOptions.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Education Level:</label>
          <select 
            value={responses.education || ''}
            onChange={(e) => handleChange('education', e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              WebkitAppearance: 'menulist-button',
              MozAppearance: 'menulist-button',
              appearance: 'menulist-button'
            }}
          >
            <option value="">Select education level</option>
            {educationOptions.map(education => (
              <option key={education} value={education}>{education}</option>
            ))}
          </select>
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