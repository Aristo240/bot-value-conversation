import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './Admin';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

const initialText = `Challenges of Social Media  In today's digital age, social media platforms (such as Facebook, Instagram and TikTok) connect billions of users worldwide, placing them at the forefront of communication. This widespread connectivity presents significant challenges. A highly debated issue is the balance between preserving freedom of speech, allowing people to spread their thoughts and ideas widely, versus applying rules and restrictions to protect user safety and prevent harm. Achieving this delicate balance requires careful consideration of various ethical, legal, and social factors, making it a complex and controversial issue.`;

const stances = {
  freedom: 'preserving freedom of speech on social media platforms',
  safety: 'protecting the safety of users on social media platforms'
};

const botPersonalities = {
  creative: 'Be innovative and curious, fostering creative thinking',
  conservative: 'Be traditional and structured, fostering systematic thinking'
};

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

  useEffect(() => {
    if (currentStep === 2 && messages.length === 0) {
      const botMessage = {
        messageId: uuidv4(),
        text: `Let's discuss ${stances[stance]}. What aspects of this stance do you find most compelling?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([botMessage]);
      axios.post(`${API_URL}/sessions/${sessionId}/messages`, botMessage)
        .catch(error => console.error('Error saving initial message:', error));
    }
  }, [currentStep, stance, sessionId]);

  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setCurrentStep(4);
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
      }, 300);

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
      await axios.post(`${API_URL}/sessions/${sessionId}/response`, {
        text: userResponse,
        timestamp: new Date()
      });
      setCurrentStep(5);
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6">Welcome to the Social Media Discussion Study</h2>
            <div className="prose lg:prose-xl mb-6">
              <p className="mb-6">{initialText}</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold mb-3">Your Assigned Stance:</h3>
              <p className="text-lg text-blue-800">{stances[stance]}</p>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-300"
              onClick={() => setCurrentStep(2)}
            >
              Continue to Discussion
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex h-screen bg-gray-100">
            <div className="w-1/4 bg-white p-4 shadow-lg overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Reference Text:</h3>
                <p className="text-sm text-gray-600">{initialText}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Your Stance:</h3>
                <p className="text-sm text-blue-800">{stances[stance]}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-4">
              <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col relative">
                <div className="absolute top-4 right-4 bg-yellow-50 p-2 rounded shadow-lg z-10">
                  <p className="text-lg font-bold text-yellow-700">
                    {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                  </p>
                </div>

                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Discussion with AI Assistant</h2>
                  <p className="text-gray-600 mr-20">
                    Please discuss your thoughts about {stances[stance]}. 
                    The AI will engage with you to explore different aspects of this stance.
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                  {messages.map((message) => (
                    <div 
                      key={message.messageId} 
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white ml-auto' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
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
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t mt-auto">
                  <textarea
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[50px] max-h-[100px] overflow-y-auto"
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Final Response</h2>
            <p className="mb-4">Please write 3-5 sentences about your stance based on the conversation.</p>
            <textarea
              className="w-full h-32 p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Write your response here..."
            />
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-300"
              onClick={handleSubmitResponse}
            >
              Submit Response
            </button>
          </div>
        );

      case 5:
        return (
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
            <p>Your responses have been recorded successfully.</p>
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

// App wrapper component for routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;