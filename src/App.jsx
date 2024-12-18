import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { stances, botPersonalities } from '../config/botConfig.js';
import ConsentForm from './components/ConsentForm';
import SBSVS from './components/SBSVS.jsx';
import AttitudeSurvey from './components/AttitudeSurvey.jsx';
import Demographics from './components/Demographics.jsx';

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

  useEffect(() => {
    const initializeSession = async () => {
      const stanceArray = Object.keys(stances);
      const randomStance = stanceArray[Math.floor(Math.random() * stanceArray.length)];
      const personalityArray = Object.keys(botPersonalities);
      const randomPersonality = personalityArray[Math.floor(Math.random() * personalityArray.length)];

      setStance(randomStance);
      setBotPersonality(randomPersonality);

      try {
        await axios.post(`${API_URL}/sessions`, {
          sessionId,
          timestamp: new Date(),
          stance: randomStance,
          botPersonality: randomPersonality
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

  const handleSubmitResponse = async () => {
    try {
      await axios.post(`${API_URL}/sessions/${sessionId}/responses`, {
        sbsvs: sbsvsResponses,
        attitude: attitudeResponses,
        stanceAgreement,
        demographics: demographicResponses,
        timestamp: new Date()
      });
      setCurrentStep(5);
    } catch (error) {
      console.error('Error submitting responses:', error);
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

      case 2: // Task Explanation
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6">Welcome to the Social Media Discussion Study</h2>
            <div className="prose lg:prose-xl mb-6">
              <p className="mb-6">{initialText}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-yellow-800 font-medium">
                You will have 10 minutes to discuss your assigned stance with an AI bot. 
                This conversation will help you explore and develop your thoughts about the topic.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold mb-3">Your Assigned Stance:</h3>
              <p className="text-lg text-blue-800">{stances[stance]}</p>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-300"
              onClick={() => setCurrentStep(3)}
            >
              Continue to Discussion
            </button>
          </div>
        );

  case 3: // Chat Interface
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

  case 4:
    const wordCount = userResponse.trim().split(/\s+/).length;
    
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Final Response</h2>
        <p className="mb-4">Please write 3-5 sentences about your stance based on the conversation.</p>
        <div className="relative">
          <textarea
            className="w-full h-32 p-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Write your response here..."
          />
          <div className="text-sm text-gray-600 mb-4">
            Word count: {wordCount} {wordCount < 50 && "(Minimum 50 words required)"}
          </div>
        </div>
        <button 
          className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-300 ${
            wordCount < 30 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmitResponse}
          disabled={wordCount < 30}
        >
          Submit Response
        </button>
      </div>
    );

    case 5: // Questionnaires
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-6">Questionnaires</h2>
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
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Stance Agreement</h3>
            <div className="space-y-4">
              <div>
                <p>How much do you agree with {stances[stance]}?</p>
                <div className="flex justify-between mt-2">
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
                      <span className="text-sm">{value}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p>How much do you agree with {getOtherStance()}?</p>
                <div className="flex justify-between mt-2">
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
                      <span className="text-sm">{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            onClick={() => setCurrentStep(6)}
          >
            Continue to Demographics
          </button>
        </div>
      </div>
    );

    case 6: // Demographics
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Demographics
          responses={demographicResponses}
          setResponses={setDemographicResponses}
        />
        <button
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          onClick={handleSubmitAllResponses}
        >
          Submit Responses
        </button>
      </div>
    );

      case 7: // Thank You
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