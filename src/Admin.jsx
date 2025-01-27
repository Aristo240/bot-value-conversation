import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileSaver from 'file-saver';
import { SBSVSQuestions } from './components/SBSVS';
import { attitudeAspects } from './components/AttitudeSurvey';

// Create ErrorBoundary as a class component using React's built-in functionality
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

function Admin() {
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('csv');
  const [selectedDataType, setSelectedDataType] = useState('all');
  const [conditionCounts, setConditionCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingZip] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);
  const [downloadType, setDownloadType] = useState({});

  const fileTypes = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'txt', label: 'Text' }
  ];

  const dataTypes = [
    { value: 'all', label: 'All Data' },
    { value: 'demographics', label: 'Demographics' },
    { value: 'pvq21', label: 'PVQ21' },
    { value: 'initialAssessment', label: 'Initial Assessment' },
    { value: 'chat', label: 'Chat History' },
    { value: 'finalResponse', label: 'Final Response' },
    { value: 'sbsvs', label: 'SBSVS' },
    { value: 'attitudeSurvey', label: 'Attitude Survey' },
    { value: 'stanceAgreement', label: 'Stance Agreement' },
    { value: 'alternativeUses', label: 'Alternative Uses' }
  ];

  // Add axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token && config.url.includes('/api/admin')) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          await axios.post(`${API_URL}/admin/sessions`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAuthenticated(true);
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            setToken(null);
            setIsAuthenticated(false);
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  // Modify the fetchData function to correctly fetch sessions
  const fetchData = async () => {
    if (!token) return;

    try {
      const [sessionsResponse, countsResponse] = await Promise.all([
        axios.get(`${API_URL}/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/conditionCounts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSessions(sessionsResponse.data);
      setConditionCounts(countsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // Add useEffect to fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credentials = btoa(`${username}:${password}`);
      setToken(credentials);
      localStorage.setItem('adminToken', credentials);
      setIsAuthenticated(true);
      await fetchData(); // Fetch data immediately after successful login
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem('adminToken');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
  };

  const showStatus = (message, isError = false) => {
    setDownloadStatus(message);
    setTimeout(() => setDownloadStatus(''), 3000);
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await axios.delete(`${API_URL}/admin/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchData(); // Refresh the data after deletion
        showStatus('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        showStatus('Failed to delete session', true);
      }
    }
  };

  const downloadSession = async (session, fileType) => {
    try {
      setDownloadStatus('Preparing download...');
      let content;
      const filename = `session_${session.sessionId}_${new Date().toISOString()}`;

      switch (fileType) {
        case 'json':
          content = JSON.stringify(session, null, 2);
          downloadFile(content, filename, 'application/json', 'json');
          break;
        case 'csv':
          content = convertToCSV([session]);
          downloadFile(content, filename, 'text/csv', 'csv');
          break;
        case 'txt':
          content = convertToText(session);
          downloadFile(content, filename, 'text/plain', 'txt');
          break;
      }
      setDownloadStatus('Download completed!');
      setTimeout(() => setDownloadStatus(''), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed');
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const downloadAllSessions = () => {
    const filename = `all_sessions_${new Date().toISOString()}`;
    let content;

    switch (selectedFileType) {
      case 'json':
        content = JSON.stringify(sessions, null, 2);
        downloadFile(content, filename, 'application/json');
        break;
      case 'csv':
        content = convertToCSV(sessions);
        downloadFile(content, filename, 'text/csv');
        break;
      case 'txt':
        content = sessions.map(convertToText).join('\n\n---\n\n');
        downloadFile(content, filename, 'text/plain');
        break;
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${selectedFileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (sessions) => {
    const headers = [
      'SessionId',
      'Timestamp',
      'Stance',
      'Bot_Personality',
      'AI_Model',
      // Demographics
      'Age',
      'Gender',
      'Education',
      // PVQ21
      ...Array.from({ length: 21 }, (_, i) => `PVQ21_Q${i + 1}`),
      // Initial Assessment
      'Initial_Interest',
      'Initial_Importance',
      'Initial_Agreement',
      // Chat History
      'Chat_History',
      // Final Response
      'Final_Response',
      // SBSVS
      ...Array.from({ length: 10 }, (_, i) => `SBSVS_Q${i + 1}`),
      // Attitude Survey
      ...attitudeAspects.map(aspect => `Attitude_${aspect}`),
      // Stance Agreement
      'Stance_Agreement_Assigned',
      'Stance_Agreement_Opposite',
      // Alternative Uses
      'Alternative_Uses'
    ].join(',');

    const rows = sessions.map(session => {
      const row = {
        SessionId: session.sessionId,
        Timestamp: session.timestamp,
        Stance: session.stance,
        Bot_Personality: session.botPersonality,
        AI_Model: session.aiModel,
        // Demographics
        Age: session.demographics?.age || '',
        Gender: session.demographics?.gender || '',
        Education: session.demographics?.education || '',
        // PVQ21
        ...Array.from({ length: 21 }, (_, i) => session.pvq21?.responses?.[`${i + 1}`] || ''),
        // Initial Assessment
        Initial_Interest: session.initialAssessment?.interesting || '',
        Initial_Importance: session.initialAssessment?.important || '',
        Initial_Agreement: session.initialAssessment?.agreement || '',
        // Chat History
        Chat_History: JSON.stringify(session.chat || []),
        // Final Response
        Final_Response: session.finalResponse?.text || '',
        // SBSVS
        ...Array.from({ length: 10 }, (_, i) => {
          const questionId = (i + 1).toString();
          return session.sbsvs?.[questionId] || '';
        }),
        // Attitude Survey
        ...attitudeAspects.map(aspect => session.attitudeSurvey?.[aspect] || ''),
        // Stance Agreement
        Stance_Agreement_Assigned: session.stanceAgreement?.assigned || '',
        Stance_Agreement_Opposite: session.stanceAgreement?.opposite || '',
        // Alternative Uses
        Alternative_Uses: JSON.stringify((session.alternativeUses || []).map(use => use.text))
      };

      return Object.values(row)
        .map(value => typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value)
        .join(',');
    });

    return [headers, ...rows].join('\n');
  };

  const convertToText = (session) => {
    return `
Session ID: ${session.sessionId}
Timestamp: ${session.timestamp}
Stance: ${session.stance}
Bot Personality: ${session.botPersonality}
AI Model: ${session.aiModel}

Demographics:
- Age: ${session.demographics?.age || 'N/A'}
- Gender: ${session.demographics?.gender || 'N/A'}
- Education: ${session.demographics?.education || 'N/A'}

PVQ21 Responses:
${Object.entries(session.pvq21?.responses || {})
  .map(([q, v]) => `Q${q}: ${v}`)
  .join('\n')}

Initial Assessment:
- Interest: ${session.initialAssessment?.interesting || 'N/A'}
- Importance: ${session.initialAssessment?.important || 'N/A'}
- Agreement: ${session.initialAssessment?.agreement || 'N/A'}

Chat History:
${(session.chat || []).map(msg => `${msg.sender}: ${msg.text}`).join('\n')}

Final Response:
${session.finalResponse?.text || 'N/A'}

SBSVS Responses:
${Object.entries(session.sbsvs || {})
  .map(([q, v]) => `Q${q}: ${v}`)
  .join('\n')}

Attitude Survey:
${attitudeAspects.map(aspect => `${aspect}: ${session.attitudeSurvey?.[aspect] || 'N/A'}`).join('\n')}

Stance Agreement:
- Assigned: ${session.stanceAgreement?.assigned || 'N/A'}
- Opposite: ${session.stanceAgreement?.opposite || 'N/A'}

Alternative Uses:
${(session.alternativeUses || []).map(use => use.text).join('\n') || 'N/A'}
`.trim();
  };

  const renderSessionData = (session) => {
    const isExpanded = expandedSession === session.sessionId;

    return (
      <div key={session.sessionId} className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Session ID: {session.sessionId}</h3>
            <p>Date: {new Date(session.timestamp).toLocaleString()}</p>
            <p>Stance: {session.stance}</p>
            <p>Bot Personality: {session.botPersonality}</p>
            <p>AI Model: {session.aiModel}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={downloadType[session.sessionId] || 'csv'}
              onChange={(e) => setDownloadType({
                ...downloadType,
                [session.sessionId]: e.target.value
              })}
              className="border rounded px-2 py-1"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="txt">TXT</option>
            </select>
            <button
              onClick={() => downloadSession(session, downloadType[session.sessionId] || 'csv')}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Download
            </button>
            <button
              onClick={() => deleteSession(session.sessionId)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => setExpandedSession(isExpanded ? null : session.sessionId)}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4 mt-4">
            {/* Demographics */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Demographics:</h4>
              <p>Age: {session.demographics?.age || 'N/A'}</p>
              <p>Gender: {session.demographics?.gender || 'N/A'}</p>
              <p>Education: {session.demographics?.education || 'N/A'}</p>
            </div>

            {/* PVQ21 */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">PVQ21 Responses:</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(session.pvq21?.responses || {}).map(([q, value]) => (
                  <div key={q} className="bg-white p-2 rounded">
                    <strong>Q{q}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Initial Assessment */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Initial Assessment:</h4>
              <p>Interest: {session.initialAssessment?.interesting || 'N/A'}</p>
              <p>Importance: {session.initialAssessment?.important || 'N/A'}</p>
              <p>Agreement: {session.initialAssessment?.agreement || 'N/A'}</p>
            </div>

            {/* Chat History */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Chat History:</h4>
              <div className="space-y-2">
                {(session.chat || []).map((msg, i) => (
                  <div key={i} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <strong>{msg.sender}:</strong> {msg.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Response */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Final Response:</h4>
              <p>{session.finalResponse?.text || 'N/A'}</p>
            </div>

            {/* SBSVS */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">SBSVS Responses:</h4>
              <div className="grid grid-cols-2 gap-2">
                {SBSVSQuestions.map((question) => (
                  <div key={question.id} className="bg-white p-2 rounded">
                    <strong>Q{question.id}:</strong> {session.sbsvs?.[question.id] || 'N/A'}
                    <div className="text-sm text-gray-500 mt-1">{question.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attitude Survey */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Attitude Survey:</h4>
              <div className="grid grid-cols-2 gap-2">
                {attitudeAspects.map((aspect) => (
                  <div key={aspect} className="bg-white p-2 rounded">
                    <strong>{aspect}:</strong> {session.attitudeSurvey?.[aspect] || 'N/A'}
                  </div>
                ))}
              </div>
            </div>

            {/* Stance Agreement */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Stance Agreement:</h4>
              <p>Assigned: {session.stanceAgreement?.assigned || 'N/A'}</p>
              <p>Opposite: {session.stanceAgreement?.opposite || 'N/A'}</p>
            </div>

            {/* Alternative Uses */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Alternative Uses:</h4>
              <div className="space-y-2">
                {(session.alternativeUses || []).map((use, i) => (
                  <div key={i} className="bg-white p-2 rounded">
                    {use.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmitAllResponses = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Format the data correctly before sending
      const formattedData = {
        demographics: {
          age: parseInt(demographicResponses.age),
          gender: demographicResponses.gender,
          education: demographicResponses.education
        },
        pvq21: {
          responses: pvq21Responses.responses || {}
        },
        initialAssessment: {
          interesting: parseInt(initialAttitudeResponses.interesting),
          important: parseInt(initialAttitudeResponses.important),
          agreement: parseInt(initialAttitudeResponses.agreement)
        },
        chat: messages.map(msg => ({
          messageId: msg.messageId,
          text: msg.text,
          sender: msg.sender,
          timestamp: msg.timestamp
        })),
        finalResponse: {
          text: userResponse,
          timestamp: new Date()
        },
        sbsvs: sbsvsResponses,
        attitudeSurvey: attitudeSurveyResponses,
        stanceAgreement: {
          assigned: parseInt(stanceAgreement.assigned),
          opposite: parseInt(stanceAgreement.opposite)
        },
        alternativeUses: autResponses.map(use => ({
          text: use.text,
          timestamp: use.timestamp
        }))
      };

      await axios.post(`${API_URL}/sessions/${sessionId}/questionnaires`, formattedData);
      setCurrentStep(12);
    } catch (error) {
      console.error('Error submitting responses:', error);
      setSubmitError('There was an error submitting your responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      {isLoading ? (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      ) : !isAuthenticated ? (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full p-2 border rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <div className="flex gap-4">
                <button
                  onClick={fetchData}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Refresh Data
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Download status notification */}
            {downloadStatus && (
              <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
                downloadStatus.includes('Failed') ? 'bg-red-500' : 'bg-green-500'
              } text-white`}>
                {downloadStatus}
              </div>
            )}

            {/* Download options */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="p-2 border rounded"
                >
                  {fileTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={downloadAllSessions}
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                  Download All Sessions
                </button>
              </div>
            </div>

            {/* Condition counts */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Condition Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {conditionCounts.map((condition) => (
                  <div
                    key={`${condition.aiModel}-${condition.stance}-${condition.personality}`}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <p>Model: {condition.aiModel}</p>
                    <p>Stance: {condition.stance}</p>
                    <p>Personality: {condition.personality}</p>
                    <p className="text-lg font-bold text-blue-600">
                      Count: {condition.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions list */}
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-center text-gray-500">No sessions found</p>
              ) : (
                sessions.map(renderSessionData)
              )}
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default Admin;