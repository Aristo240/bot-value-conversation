import React, { useState, useEffect } from 'react';

function ReCAPTCHA({ onVerify, onFail }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    generateNewProblem();
  }, []);

  const generateNewProblem = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const correctAnswer = num1 + num2;
    if (parseInt(userAnswer) === correctAnswer) {
      onVerify();
    } else {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) {
        onFail();
      } else {
        setError('Incorrect answer. Please try again.');
        generateNewProblem();
        setUserAnswer('');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Verify You're Human</h2>
        <p className="mb-6 text-gray-600 text-center">
          Please solve this simple math problem to continue.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center items-center space-x-2 text-xl">
            <span>{num1}</span>
            <span>+</span>
            <span>{num2}</span>
            <span>=</span>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center mt-2">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-300"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReCAPTCHA; 