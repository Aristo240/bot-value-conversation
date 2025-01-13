import React from 'react';

const SBSVSQuestions = [
  {
    id: 1,
    text: "Caring about the welfare of people with whom one is in personal contact. Being responsible, loyal, honest and forgiving."
  },
  {
    id: 2,
    text: "Being independent in thought and action. Being open to novelty and change. Living freely, expressing curiosity and creativity."
  },
  {
    id: 3,
    text: "Understanding and accepting all people, caring for their welfare and equality. Being intellectually and emotionally open to the environment and caring for nature."
  },
  {
    id: 4,
    text: "Living safely, in an organized, stable place. Keeping one's family secure and healthy."
  },
  {
    id: 5,
    text: "Obeying social norms and expectations and avoiding actions that are likely to upset others. Being polite and self-disciplined. Honoring parents and elders."
  },
  {
    id: 6,
    text: "Aspiring for impressive achievements. Demonstrating competence, excellence and personal success."
  },
  {
    id: 7,
    text: "Having fun and sensuous gratification. Enjoying life, being self-indulgent."
  },
  {
    id: 8,
    text: "Experiencing constant change, excitement, novelty, and challenge in life. Being daring, living a varied and exciting life."
  },
  {
    id: 9,
    text: "Preserving the status-quo, doing things that are familiar and known. Being humble and moderate. Respecting the customs of the traditional culture or religion provide."
  },
  {
    id: 10,
    text: "Having social status and prestige, and winning influence over other people. Being rich and controlling resources."
  }
];

export const SBSVS = ({ responses, setResponses }) => {
  const handleValueChange = (questionId, value) => {
    const newResponses = { ...responses };
    newResponses[questionId] = value;
    setResponses(newResponses);
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Values Survey</h2>
      <div className="mb-8">
        <p className="font-medium text-gray-700 mb-4">Please rate how important each value is for you:</p>
        <div className="grid grid-cols-7 gap-2 mb-2 text-sm text-center text-gray-600">
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600">-1</span>
            <span className="text-sm text-gray-600">Opposed to my values</span>
          </div>
          <div>0<br/>Not important</div>
          <div>1</div>
          <div>2</div>
          <div>3<br/>Important</div>
          <div>4</div>
          <div>5</div>
          <div>6<br/>Very important</div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600">7</span>
            <span className="text-sm text-gray-600">Supreme importance</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {SBSVSQuestions.map((question) => (
          <div key={question.id} className="pb-6 border-b border-gray-200">
            <p className="mb-4 text-gray-700">{question.text}</p>
            <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600">-1</span>
                <span className="text-sm text-gray-600">Opposed to my values</span>
              </div>
              {[-1, 0, 1, 2, 3, 4, 5, 6, 7].map((value) => (
                <label key={value} className="flex flex-col items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={value}
                    checked={responses[question.id] === value}
                    onChange={() => handleValueChange(question.id, value)}
                    className="mb-1"
                  />
                  <span className="text-sm text-gray-600">{value}</span>
                </label>
              ))}
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600">7</span>
                <span className="text-sm text-gray-600">Supreme importance</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SBSVS;