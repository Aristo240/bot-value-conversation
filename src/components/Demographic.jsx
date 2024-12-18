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

const Demographics = ({ responses, setResponses }) => {
  const handleChange = (field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6">Demographic Information</h2>
      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">Age:</label>
          <select 
            value={responses.age || ''}
            onChange={(e) => handleChange('age', parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value="">Select age</option>
            {ageOptions.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Gender:</label>
          <select 
            value={responses.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select gender</option>
            {genderOptions.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Education Level:</label>
          <select 
            value={responses.education || ''}
            onChange={(e) => handleChange('education', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select education level</option>
            {educationOptions.map(education => (
              <option key={education} value={education}>{education}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Demographics;