import React, { useState, useEffect } from 'react';

const AlternativeUsesTask = ({ onComplete, responses, setResponses }) => {
  const [currentIdea, setCurrentIdea] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      if (responses && responses.length > 0) {
        onComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete, responses]);

  const handleStart = () => {
    setIsActive(true);
    setShowInstructions(false);
  };

  const handleSubmitIdea = (e) => {
    e.preventDefault();
    if (currentIdea.trim()) {
      const newResponse = {
        id: Date.now().toString(),
        idea: currentIdea.trim(),
        timestamp: new Date().toISOString()
      };
      setResponses(prev => [...(prev || []), newResponse]);
      setCurrentIdea('');
    }
  };

  if (showInstructions) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Alternative Uses Task</h2>
        
        <div className="mb-6 space-y-4">
          <p className="text-gray-700">
            For the following object, come up with alternative uses that are different from its typical intended use.
          </p>
          <p className="text-xl font-semibold text-blue-600">
            The object: BOTTLE
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Instructions:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>You will have 2 minutes to submit your ideas one by one</li>
            <li>For each idea, type it in the text box and click "Submit"</li>
            <li>Focus on creative and innovative ideas rather than common uses</li>
            <li>Ideas can be unusual or impractical</li>
            <li>The more ideas you generate, the better</li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
        >
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alternative Uses: BOTTLE</h2>
        <div className="text-xl font-bold text-blue-600">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <form onSubmit={handleSubmitIdea} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={currentIdea}
            onChange={(e) => setCurrentIdea(e.target.value)}
            placeholder="Enter a new use for a bottle..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={timeLeft === 0}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
          <button
            type="submit"
            disabled={!currentIdea.trim() || timeLeft === 0}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          >
            Submit Idea
          </button>
        </div>
      </form>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Your Ideas ({responses?.length || 0}):</h3>
        <div className="space-y-2">
          {responses?.map((response, index) => (
            <div key={response.id} className="p-2 bg-white rounded border">
              {index + 1}. {response.idea}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlternativeUsesTask;