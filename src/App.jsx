import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { stances, botPersonalities } from '../config/botConfig.js';
import ConsentForm from './components/ConsentForm';
import SBSVS from './components/SBSVS.jsx';
import AttitudeSurvey from './components/AttitudeSurvey.jsx';
import Demographics from './components/Demographics.jsx';
import PVQ21 from './components/PVQ21';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

const initialText = `In today's digital age, social media platforms (such as Facebook, Instagram and TikTok) connect billions of users worldwide, placing them at the forefront of communication. This widespread connectivity presents significant challenges. A highly debated issue is the balance between preserving freedom of speech, allowing people to spread their thoughts and ideas widely, versus applying rules and restrictions to protect user safety and prevent harm. Achieving this delicate balance requires careful consideration of various ethical, legal, and social factors, making it a complex and controversial issue.`;

// Main experiment component
function MainApp() {
  const [sessionId] = useState(uuidv4());
  const [currentStep, setCurrentStep] = useState(1);
  const [stance, setStance] = useState('');
  const [botPersonality, setBotPersonality] = useState('');
  const [messages, setMessages] = useState([]);
  const [userResponse, setUserResponse] = useState('');
  const [timer, setTimer] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [sbsvsResponses, setSbsvsResponses] = useState({});
  const [attitudeResponses, setAttitudeResponses] = useState({});
  const [stanceAgreement, setStanceAgreement] = useState({
    assigned: null,
    opposite: null
  });
  const [demographicResponses, setDemographicResponses] = useState({});
  const [aiModel, setAiModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [autResponses, setAutResponses] = useState([]);
  const [pvq21Responses, setPvq21Responses] = useState({
    responses: {},
    timestamp: null
  });

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Get the next condition from the server
        const conditionResponse = await axios.get(`${API_URL}/nextCondition`);
        const { aiModel, stance, personality } = conditionResponse.data;
  
        setAiModel(aiModel);
        setStance(stance);
        setBotPersonality(personality);
  
        await axios.post(`${API_URL}/sessions`, {
          sessionId,
          timestamp: new Date(),
          stance,
          botPersonality: personality,
          aiModel
        });
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };
  
    initializeSession();
  }, [sessionId]);

  // Chat initialization effect
  useEffect(() => {
    if (currentStep === 2 && messages.length === 0) {
      const botMessage = {
        messageId: uuidv4(),
        text: `Let's discuss ${stances[stance]}. What do you want to learn about it?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([botMessage]);
      axios.post(`${API_URL}/sessions/${sessionId}/messages`, botMessage)
        .catch(error => console.error('Error saving initial message:', error));
    }
  }, [currentStep, stance, sessionId]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setShowTimeUpPopup(true);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      messageId: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    try {
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      await axios.post(`${API_URL}/sessions/${sessionId}/messages`, userMessage);
      
      setIsTyping(true);
      if (!isTimerActive) setIsTimerActive(true);

      const response = await axios.post(`${API_URL}/chat`, {
        message,
        stance: stances[stance],
        botPersonality,
        aiModel,
        history: messages
      });

      const botMessage = {
        messageId: uuidv4(),
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }, 120);

      await axios.post(`${API_URL}/sessions/${sessionId}/messages`, botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitAllResponses = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Submit all questionnaire responses
      await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, {
        sbsvs: sbsvsResponses,
        attitude: attitudeResponses,
        stanceAgreement,
        demographics: demographicResponses,
        alternativeUses: {
          responses: autResponses,
          timestamp: new Date()
        }
      });
      
      // Move to thank you page
      setCurrentStep(10); // Update this to the correct final step
    } catch (error) {
      console.error('Error submitting responses:', error);
      setSubmitError('There was an error submitting your responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalResponse = async () => {
    if (!userResponse.trim()) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // First, save the final response
      await axios.post(`${API_URL}/sessions/${sessionId}/response`, {
        text: userResponse
      });
      
      // If successful, move to the next step
      setCurrentStep(5);
    } catch (error) {
      console.error('Error saving final response:', error);
      setSubmitError('There was an error saving your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }; 

  const getOtherStance = () => {
    const stanceArray = Object.keys(stances);
    return stances[stanceArray.find(s => s !== stance)];
  };


  const renderStep = () => {
    switch (currentStep) {
      case 1: // Consent Form
        return <ConsentForm onConsent={() => setCurrentStep(2)} />;

        case 2: // Demographics
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <Demographics
              responses={demographicResponses}
              setResponses={setDemographicResponses}
            />
            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              onClick={() => setCurrentStep(3)}
              disabled={!demographicResponses.gender}
            >
              Continue
            </button>
          </div>
        );
      
      case 3: // PVQ21
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <PVQ21
              responses={pvq21Responses}
              setResponses={setPvq21Responses}
              gender={demographicResponses.gender}
            />
            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              onClick={() => setCurrentStep(4)}
              disabled={Object.keys(pvq21Responses.responses || {}).length < 21}
            >
              Continue
            </button>
          </div>
        );

        case 4: { // Task Explanation
          const otherStance = getOtherStance();
          return (
            <div className="w-3/4 mx-auto p-8 bg-white shadow-lg min-h-screen">
              <h2 className="text-2xl font-bold mb-6">Social Media Discussion Study</h2>
              
              {/* Background Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Background Information</h3>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-700 leading-relaxed">
                    {initialText}
                  </p>
                </div>
              </div>
              
              {/* Assigned Perspective */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Your Assigned Perspective</h3>
                <div className="p-4 border rounded-lg bg-white">
                  <p className="text-blue-600 font-medium">
                    {stances[stance]}
                  </p>
                </div>
              </div>
              
              {/* Task Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Your Task</h3>
                <div className="p-4 border rounded-lg bg-white">
                  <p className="text-gray-700 mb-4">
                    You will engage in a 10-minute conversation with an AI bot about {stances[stance]}. 
                    Your goals are to:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Explore and deepen your understanding of this perspective</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Develop arguments about why this perspective is important</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Consider why this perspective might be more crucial than {otherStance}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mb-8">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <p className="text-gray-700">
                    Take a moment to reflect on this perspective before beginning the discussion. 
                    The AI bot will help you explore different aspects of this position.
                  </p>
                </div>
              </div>
              
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
                onClick={() => setCurrentStep(3)}
              >
                Begin Discussion
              </button>
            </div>
          );
        }        

  case 5: // Chat Interface
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Fixed sidebar */}
      <div className="w-1/4 bg-white shadow-lg fixed left-0 h-screen overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Reference Text:</h3>
            <p className="text-sm text-gray-600">{initialText}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Your Stance:</h3>
            <p className="text-sm text-blue-800">{stances[stance]}</p>
          </div>
        </div>
      </div>

      {/* Main chat area with fixed header */}
      <div className="ml-[25%] flex-1 flex flex-col h-screen">
        {/* Fixed header */}
        <div className="bg-white border-b z-10">
          <div className="p-4 relative">
            <div className="absolute top-4 right-4 bg-yellow-50 p-2 rounded shadow-lg">
              <p className="text-lg font-bold text-yellow-700">
                {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
              </p>
            </div>
            <h2 className="text-xl font-bold">Discussion with AI Assistant</h2>
            <p className="text-gray-600 mr-20">
              You have 10 minutes to discuss your thoughts about {stances[stance]}. 
              The AI will engage with you to explore different aspects of this stance.
            </p>
          </div>
        </div>

        {/* Scrollable chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.messageId} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {message.sender === 'user' ? '👤 You:' : '🤖 Assistant:'}
                  </div>
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-gray-500">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed input area */}
        <div className="border-t bg-white p-4">
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[50px] max-h-[100px] overflow-y-auto bg-white"
            placeholder="Type your message..."
            rows="1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (e.target.value.trim()) {
                  handleSendMessage(e.target.value.trim());
                  e.target.value = '';
                }
              }
            }}
            onChange={(e) => {
              e.target.style.height = 'inherit';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
            }}
          />
        </div>
      </div>

      {/* Time's up popup */}
      {showTimeUpPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
            <h3 className="text-xl font-bold mb-4">Time's Up!</h3>
            <p className="mb-6">Your discussion time has ended.</p>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => {
                setShowTimeUpPopup(false);
                setCurrentStep(4);
              }}
            >
              Continue to the Next Step
            </button>
          </div>
        </div>
      )}
    </div>
  );

  case 6: { // Thoughts about the stance
    const wordCount = userResponse.trim().split(/\s+/).length;
    
    return (
      <div className="w-3/4 mx-auto p-8 bg-white shadow-lg min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Final Response</h2>
        <p className="mb-4">
          Based on your conversation about {stances[stance]}, please write 3-5 sentences explaining your thoughts 
          and understanding of the position.
        </p>
        
        <div className="relative">
          <textarea
            className="w-full h-48 p-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Write your response here..."
            disabled={isSubmitting}
          />
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Word count: {wordCount}
              {wordCount < 50 && (
                <span className="text-red-500 ml-1">
                  (Minimum 50 words required)
                </span>
              )}
            </div>
            
            {wordCount >= 50 && (
              <div className="text-sm text-green-600">
                ✓ Minimum word count met
              </div>
            )}
          </div>
          
          {submitError && (
            <div className="text-red-500 text-sm mb-4">
              {submitError}
            </div>
          )}
        </div>
        
        <button 
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 flex items-center justify-center
            ${(wordCount < 50 || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleFinalResponse}
          disabled={wordCount < 50 || isSubmitting}
        >
          {isSubmitting ? (
            <span className="animate-pulse">Submitting...</span>
          ) : (
            'Submit Response'
          )}
        </button>
      </div>
    );
  }

  case 7: // Questionnaires
  return (
    <div className="w-3/4 mx-auto p-8 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Questionnaires</h2>
      <div className="space-y-8">
        <SBSVS 
          responses={sbsvsResponses} 
          setResponses={setSbsvsResponses} 
        />
        <AttitudeSurvey 
          stance={stances[stance]}
          responses={attitudeResponses}
          setResponses={setAttitudeResponses}
        />
        <div className="p-6 border rounded-lg bg-white">
          <h3 className="text-2xl font-bold mb-6">Stance Agreement</h3>
          <div className="space-y-6">
            <div className="pb-6 border-b border-gray-200">
              <p className="mb-4 text-gray-700">How much do you agree with {stances[stance]}?</p>
              <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="flex flex-col items-center">
                    <input
                      type="radio"
                      name="stance-agreement"
                      value={value}
                      checked={stanceAgreement.assigned === value}
                      onChange={(e) => setStanceAgreement({
                        ...stanceAgreement,
                        assigned: parseInt(e.target.value)
                      })}
                      className="mb-1"
                    />
                    <span className="text-sm text-gray-600">{value}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-gray-700">How much do you agree with {getOtherStance()}?</p>
              <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="flex flex-col items-center">
                    <input
                      type="radio"
                      name="other-stance-agreement"
                      value={value}
                      checked={stanceAgreement.opposite === value}
                      onChange={(e) => setStanceAgreement({
                        ...stanceAgreement,
                        opposite: parseInt(e.target.value)
                      })}
                      className="mb-1"
                    />
                    <span className="text-sm text-gray-600">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
          onClick={() => setCurrentStep(6)}
        >
          Continue to Demographics
        </button>
      </div>
    </div>
  );

  case 8: // Alternative Uses Task
  return (
    <div className="w-3/4 mx-auto p-8 min-h-screen">
      <AlternativeUsesTask
        responses={autResponses}
        setResponses={setAutResponses}
        onComplete={() => setCurrentStep(9)}
      />
    </div>
  );

      case 9: // Thank You
        return (
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
            <p>Your responses have been recorded successfully 🎉.</p>
            <p>You can now close this window.</p>
          </div>
        );

      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {renderStep()}
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;