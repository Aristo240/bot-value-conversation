import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { stances, botPersonalities } from '../config/botConfig.js';
import ConsentForm from './components/ConsentForm';
import SBSVS from './components/SBSVS.jsx';
import AttitudeSurvey from './components/AttitudeSurvey.jsx';
import Demographics from './components/Demographics.jsx';
import PVQ21 from './components/PVQ21';
import InitialAssessment from './components/InitialAssessment';
import AlternativeUsesTask from './components/AlternativeUsesTask';
import StanceAgreement from './components/StanceAgreement';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

const getOrderedStanceText = (assignedStance) => {
  const assignedStanceText = stances[assignedStance];
  const oppositeStanceText = assignedStance === 'freedom' ? stances.safety : stances.freedom;
  return {
    assignedStanceText,
    oppositeStanceText
  };
};

const getInitialText = (assignedStance) => {
  const { assignedStanceText, oppositeStanceText } = getOrderedStanceText(assignedStance);
  return `In today's digital age, social media platforms (such as Facebook, Instagram and TikTok) connect billions of users worldwide, placing them at the forefront of communication. <strong style={{ fontWeight: 'bold' }}>A highly debated issue is the balance between ${assignedStanceText}, allowing people to spread their thoughts and ideas widely, versus ${oppositeStanceText}.</strong> Achieving this delicate balance requires careful consideration of various ethical, legal, and social factors, making it a complex and controversial issue.`;
};

// Main experiment component
function MainApp() {
  const [sessionId] = useState(uuidv4());
  const [currentStep, setCurrentStep] = useState(1);
  const [stance, setStance] = useState('');
  const [botPersonality, setBotPersonality] = useState('');
  const [messages, setMessages] = useState([]);
  const [userResponse, setUserResponse] = useState('');
  const [timer, setTimer] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [sbsvsResponses, setSbsvsResponses] = useState({});
  const [attitudeSurveyResponses, setAttitudeSurveyResponses] = useState({});
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
  const [initialAttitudeResponses, setInitialAttitudeResponses] = useState({});
  const [showWarning, setShowWarning] = useState(false);

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
          aiModel,
          stanceAgreement: {}
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
        text: `Let's discuss <strong style={{ fontWeight: 'bold' }}>${stances[stance]}</strong>. Can you think about an example of which this stance is important?`,
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
      setIsTimerActive(false);
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

      setIsTyping(false);
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      await axios.post(`${API_URL}/sessions/${sessionId}/messages`, botMessage);
    } catch (error) {
      console.error('Error in chat:', error);
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
      await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, {
        demographics: demographicResponses,
        pvq21: pvq21Responses,
        initialAssessment: initialAttitudeResponses,
        chat: messages,
        finalResponse: {
          text: userResponse,
          timestamp: new Date()
        },
        sbsvs: sbsvsResponses,
        attitudeSurvey: attitudeSurveyResponses,
        stanceAgreement: {
          assigned: parseInt(stanceAgreement.assigned),
          opposite: parseInt(stanceAgreement.opposite),
          timestamp: new Date()
        },
        alternativeUses: autResponses
      });
      
      setCurrentStep(12);
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
      await axios.post(`${API_URL}/sessions/${sessionId}/response`, {
        text: userResponse
      });
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

  const isQuestionnairesComplete = () => {
    const sbsvsComplete = Object.keys(sbsvsResponses).length === 10;
    const attitudeComplete = Object.keys(attitudeSurveyResponses).length === 11;
    const stanceComplete = stanceAgreement.assigned !== null && stanceAgreement.opposite !== null;
    
    return sbsvsComplete && attitudeComplete && stanceComplete;
  };

  const getIncompleteQuestionnairesMessage = () => {
    const missing = [];
    
    if (Object.keys(sbsvsResponses).length < 10) {
      missing.push(`SBSVS (${10 - Object.keys(sbsvsResponses).length} remaining)`);
    }
    
    if (Object.keys(attitudeSurveyResponses).length < 11) {
      missing.push(`Attitude Survey (${11 - Object.keys(attitudeSurveyResponses).length} remaining)`);
    }
    
    if (!stanceAgreement.assigned || !stanceAgreement.opposite) {
      missing.push('Stance Agreement');
    }
    
    return `Please complete: ${missing.join(', ')}`;
  };

  const saveInitialAssessment = async () => {
    try {
      console.log('Saving initial assessment:', initialAttitudeResponses); // Debug log
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/initialAssessment`, {
        interesting: parseInt(initialAttitudeResponses.interesting),
        important: parseInt(initialAttitudeResponses.important),
        agreement: parseInt(initialAttitudeResponses.agreement),
        timestamp: new Date()
      });
      console.log('Initial assessment saved:', response.data); // Debug log
    } catch (error) {
      console.error('Error saving initial assessment:', error);
    }
  };

  const saveFinalResponse = async () => {
    try {
      console.log('Saving final response:', userResponse);
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, {
        finalResponse: {
          text: userResponse,
          timestamp: new Date()
        }
      });
      console.log('Final response save response:', response.data);
    } catch (error) {
      console.error('Error saving final response:', error);
    }
  };

  const saveSBSVS = async () => {
    try {
      console.log('Saving SBSVS responses:', sbsvsResponses);
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, {
        sbsvs: {
          responses: sbsvsResponses,
          timestamp: new Date()
        }
      });
      console.log('SBSVS save response:', response.data);
    } catch (error) {
      console.error('Error saving SBSVS:', error);
    }
  };

  const saveAttitudeSurvey = async () => {
    try {
      console.log('Saving Attitude Survey responses:', attitudeSurveyResponses);
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, {
        attitudeSurvey: {
          responses: attitudeSurveyResponses,
          timestamp: new Date()
        }
      });
      console.log('Attitude Survey save response:', response.data);
    } catch (error) {
      console.error('Error saving attitude survey:', error);
    }
  };

  const saveAlternativeUses = async () => {
    try {
      console.log('Saving Alternative Uses responses:', autResponses); // Debug log
      const response = await axios.post(
        `${API_URL}/sessions/${sessionId}/alternativeUses`,
        autResponses
      );
      console.log('Alternative Uses save response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error saving alternative uses:', error.response?.data || error.message);
      throw error;
    }
  };

  const saveDemographics = async () => {
    try {
      console.log('Saving demographics:', demographicResponses);
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/demographics`, demographicResponses);
      console.log('Demographics save response:', response.data);
    } catch (error) {
      console.error('Error saving demographics:', error);
      throw error;
    }
  };

  const savePVQ21 = async () => {
    try {
      console.log('Saving PVQ21 responses:', pvq21Responses); // Debug log
      const response = await axios.post(
        `${API_URL}/sessions/${sessionId}/pvq21`,
        {
          responses: pvq21Responses.responses || {}
        }
      );
      console.log('PVQ21 save response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error saving PVQ21:', error.response?.data || error.message);
      throw error;
    }
  };

  const saveStanceAgreement = async () => {
    try {
      console.log('Saving stance agreement:', stanceAgreement);
      const response = await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, {
        stanceAgreement: {
          assigned: parseInt(stanceAgreement.assigned),
          opposite: parseInt(stanceAgreement.opposite),
          timestamp: new Date()
        }
      });
      console.log('Stance agreement save response:', response.data);
    } catch (error) {
      console.error('Error saving stance agreement:', error);
      throw error;
    }
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
              className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                !demographicResponses.age || !demographicResponses.gender || !demographicResponses.education
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={async () => {
                if (demographicResponses.age && demographicResponses.gender && demographicResponses.education) {
                  await saveDemographics();
                  setCurrentStep(3);
                }
              }}
              disabled={!demographicResponses.age || !demographicResponses.gender || !demographicResponses.education}
            >
              Continue
            </button>
          </div>
        );
      
      case 3: // PVQ21
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <PVQ21
              responses={pvq21Responses.responses || {}}
              setResponses={(newResponses) => {
                console.log('New PVQ21 responses:', newResponses); // Debug log
                setPvq21Responses({
                  responses: newResponses,
                  timestamp: new Date()
                });
              }}
              gender={demographicResponses.gender}
            />
            <button
              className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                !pvq21Responses.responses || Object.keys(pvq21Responses.responses).length !== 21
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={async () => {
                if (pvq21Responses.responses && Object.keys(pvq21Responses.responses).length === 21) {
                  try {
                    await savePVQ21();
                    setCurrentStep(4);
                  } catch (error) {
                    console.error('Failed to save PVQ21:', error);
                  }
                }
              }}
              disabled={!pvq21Responses.responses || Object.keys(pvq21Responses.responses).length !== 21}
            >
              Continue
            </button>
          </div>
        );

      case 4: // Task Explanation & Description
        const { assignedStanceText, oppositeStanceText } = getOrderedStanceText(stance);
        const initialText = getInitialText(stance);
        return (
          <div className="w-3/4 mx-auto p-8 bg-white shadow-lg min-h-screen">
            <h2 className="text-2xl font-bold mb-6">Social Media Discussion Study</h2>
            
            {/* Background Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Background Information</h3>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: initialText }} />
              </div>
            </div>
            
            {/* Task Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Your Task</h3>
              <div className="p-4 border rounded-lg bg-white">
                <p className="text-gray-700 mb-4">
                  You will engage in a 5-minute conversation with an AI bot, during which you will represent one of two perspectives that we will assign to you: 
                  <br />
                  <strong style={{ fontWeight: 'bold' }}>{assignedStanceText}</strong> or <strong style={{ fontWeight: 'bold' }}>{oppositeStanceText}</strong> on social media platforms.
                  <br />
                  <br />
                  Your objectives during the conversation are:
                  <br />
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Explore and deepen your understanding of the perspective you were assigned to</span>
                  </li>
                 <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Develop arguments about why this perspective is important</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Consider why this perspective might be more crucial than the opposite one</span>
                  </li>
                 </ul>
              </div>
            </div>

            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              onClick={() => setCurrentStep(5)}
            >
              Continue
            </button>
          </div>
        );

      case 5: // Initial Assessment
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Your Assigned Stance</h2>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-800">
                {stances[stance]}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">Initial Assessment</h2>
              <InitialAssessment
                stance={stances[stance]}
                responses={initialAttitudeResponses}
                setResponses={setInitialAttitudeResponses}
              />
              <button
                className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                  Object.keys(initialAttitudeResponses).length !== 3
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={async () => {
                  if (Object.keys(initialAttitudeResponses).length === 3) {
                    await saveInitialAssessment();
                    setCurrentStep(6);
                  }
                }}
                disabled={Object.keys(initialAttitudeResponses).length !== 3}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 6: // Chat Interface
        return (
          <div className="h-screen flex overflow-hidden">
            {/* Fixed sidebar */}
            <div className="w-1/4 bg-white shadow-lg fixed left-0 h-screen overflow-y-auto">
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Reference Text:</h3>
                  <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: getInitialText(stance) }} />
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
                      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <h2 className="text-xl font-bold">Discussion with AI Assistant</h2>
                  <p className="text-gray-600 mr-20">
                    You have 5 minutes to discuss your thoughts about <strong>{stances[stance]}</strong>.
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
                        <div dangerouslySetInnerHTML={{ __html: message.text }} />
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
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
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
                      setCurrentStep(7);
                      setIsTimerActive(false);
                    }}
                  >
                    Continue to the Next Step
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 7: // Final Response
        const wordCount = userResponse.trim().split(/\s+/).length;
        
        const handleFinalResponseSubmit = async () => {
          if (wordCount >= 50) {
            await saveFinalResponse();
            setCurrentStep(8);
          }
        };

        return (
          <div className="w-3/4 mx-auto p-8 bg-white shadow-lg min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Final Response</h2>
            <p className="mb-4">
              Based on your conversation about <strong style={{ fontWeight: 'bold' }}>{stances[stance]}</strong>, please write 3-5 sentences explaining your thoughts 
              and understanding of the position.
            </p>
            
            <div className="relative">
              <textarea
                className="w-full h-48 p-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Write your response here..."
                disabled={isSubmitting}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
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
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 
                ${(wordCount < 50 || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleFinalResponseSubmit}
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

      case 8: // SBSVS
        const handleSBSVSSubmit = async () => {
          if (Object.keys(sbsvsResponses).length === 10) {
            await saveSBSVS();
            setCurrentStep(9);
          }
        };
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <h2 className="text-2xl font-bold mb-6">Questionnaires - Part 1</h2>
            <SBSVS 
              responses={sbsvsResponses} 
              setResponses={setSbsvsResponses} 
              sessionId={sessionId}
            />
            <button
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                Object.keys(sbsvsResponses).length < 10 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleSBSVSSubmit}
              disabled={Object.keys(sbsvsResponses).length < 10}
            >
              {Object.keys(sbsvsResponses).length < 10 
                ? `Please complete all ${10 - Object.keys(sbsvsResponses).length} remaining questions`
                : 'Continue'
              }
            </button>
          </div>
        );

      case 9: // Attitude Survey
        const handleAttitudeSurveySubmit = async () => {
          if (Object.keys(attitudeSurveyResponses).length === 11) {
            await saveAttitudeSurvey();
            setCurrentStep(10);
          }
        };
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <h2 className="text-2xl font-bold mb-6">Questionnaires - Part 2</h2>
            <AttitudeSurvey 
              stance={stances[stance]}
              responses={attitudeSurveyResponses}
              setResponses={setAttitudeSurveyResponses}
              sessionId={sessionId}
            />
            <button
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                Object.keys(attitudeSurveyResponses).length < 11 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleAttitudeSurveySubmit}
              disabled={Object.keys(attitudeSurveyResponses).length < 11}
            >
              {Object.keys(attitudeSurveyResponses).length < 11
                ? `Please complete all ${11 - Object.keys(attitudeSurveyResponses).length} remaining questions`
                : 'Continue'
              }
            </button>
          </div>
        );

      case 10: // Stance Agreement
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <h2 className="text-2xl font-bold mb-6">Stance Agreement</h2>
            <StanceAgreement
              stance={stances[stance]}
              responses={stanceAgreement}
              setResponses={setStanceAgreement}
            />
            <button
              className={`w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                !stanceAgreement.assigned || !stanceAgreement.opposite
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={async () => {
                if (stanceAgreement.assigned && stanceAgreement.opposite) {
                  try {
                    await saveStanceAgreement();
                    setCurrentStep(11);
                  } catch (error) {
                    console.error('Failed to save stance agreement:', error);
                    // Show error message to user
                    alert('Failed to save your responses. Please try again.');
                  }
                }
              }}
              disabled={!stanceAgreement.assigned || !stanceAgreement.opposite}
            >
              {!stanceAgreement.assigned || !stanceAgreement.opposite
                ? 'Please complete both questions'
                : 'Continue'}
            </button>
          </div>
        );

      case 11: // Alternative Uses Task
        return (
          <div className="w-3/4 mx-auto p-8 min-h-screen">
            <AlternativeUsesTask
              responses={autResponses}
              setResponses={setAutResponses}
              onComplete={async () => {
                try {
                  await saveAlternativeUses();
                  setCurrentStep(12);
                } catch (error) {
                  console.error('Failed to save alternative uses:', error);
                }
              }}
            />
          </div>
        );

      case 12: // Thank You
        return (
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
            <p>Your responses have been recorded successfully.</p>
            <p>You can now close this window.</p>
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    // Scroll to the top of the page when the component mounts or updates
    window.scrollTo(0, 0);
  }, [currentStep]); // Add currentStep as a dependency to trigger on step change

  useEffect(() => {
    const handleVisibilityChange = () => {
      if ([6, 7, 11].includes(currentStep)) {
        if (document.hidden) {
          // Show warning when tab becomes hidden
          setShowWarning(true);
          
          // Log tab switch event
          axios.post(`${API_URL}/sessions/${sessionId}/events`, {
            type: 'tab_switch',
            step: currentStep,
            timestamp: new Date()
          }).catch(error => console.error('Error logging tab switch:', error));
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if ([6, 7, 11].includes(currentStep)) {
        e.preventDefault();
        e.returnValue = ''; // This is required for Chrome
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentStep, sessionId]);

  return (
    <div className="min-h-screen bg-gray-100">
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
            <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Warning</h3>
            <p className="mb-6">Please do not leave this window during the experiment. Your responses are important to us.</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => setShowWarning(false)}
            >
              I Understand
            </button>
          </div>
        </div>
      )}
      {renderStep()}
    </div>
  );
}

function App() {
  return <MainApp />;
}

export default App;