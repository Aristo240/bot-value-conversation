import React from 'react';
import axios from 'axios';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

// Export the questions array
export const SBSVSQuestions = [
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
    id: 'attention1',
    text: "Please select 'Important' to confirm attention.",
    isAttentionCheck: true
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

const SBSVS = ({ responses, setResponses, sessionId }) => {
  const handleValueChange = async (questionId, value) => {
    try {
      if (!sessionId) {
        console.error('No sessionId provided to SBSVS component');
        return;
      }

      const newResponses = {
        ...responses,
        [questionId]: parseInt(value, 10)
      };
      setResponses(newResponses);
      
      // Save to server including attention check
      await axios.post(`${API_URL}/sessions/${sessionId}/sbsvs`, {
        responses: newResponses,
        attentionCheck: questionId === 'attention1' ? value : undefined
      });
    } catch (error) {
      console.error('Error saving SBSVS response:', error);
    }
  };

  const getScaleLabel = (value) => {
    switch (value) {
      case -1:
        return 'Opposed to my values';
      case 0:
        return 'Not important';
      case 3:
        return 'Important';
      case 6:
        return 'Very important';
      case 7:
        return 'Supreme importance';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Values Survey (SBSVS)</h2>
      <div className="mb-8">
        <p className="font-medium text-gray-700 mb-4">
        Below is a list of ten values. For each value, please state how important it is for you.
        </p>
      </div>
      <div className="space-y-8">
        {SBSVSQuestions.map((question) => (
          <div key={question.id} className="pb-6 border-b border-gray-200">
            <p className="mb-4 text-gray-700">{question.text}</p>
            <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
              {[-1, 0, 1, 2, 3, 4, 5, 6, 7].map((value) => (
                <div key={value} className="flex flex-col items-center">
                  <label className="flex flex-col items-center">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={value}
                      checked={responses[question.id] === value}
                      onChange={() => handleValueChange(question.id, value)}
                      className="mb-1"
                    />
                    <span className="text-sm text-gray-600">{value}</span>
                    <span className="text-xs text-gray-500 text-center mt-1 w-20">
                      {getScaleLabel(value)}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SBSVS;