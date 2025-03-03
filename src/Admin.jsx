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

  // Add a function to fetch condition counts
  const fetchConditionCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/conditionCounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConditionCounts(response.data || []);
    } catch (error) {
      console.error('Error fetching condition counts:', error);
    }
  };

  // Update the useEffect to fetch both sessions and condition counts
  useEffect(() => {
    const autoLogin = async () => {
      setIsLoading(true);
      try {
        const credentials = btoa(`${process.env.REACT_APP_ADMIN_USERNAME}:${process.env.REACT_APP_ADMIN_PASSWORD}`);
        
        const [sessionsResponse, countsResponse] = await Promise.all([
          axios.get(`${API_URL}/admin/sessions`, {
            headers: { Authorization: `Bearer ${credentials}` }
          }),
          axios.get(`${API_URL}/admin/conditionCounts`, {
            headers: { Authorization: `Bearer ${credentials}` }
          })
        ]);

        if (sessionsResponse.status === 200) {
          localStorage.setItem('adminToken', credentials);
          setIsAuthenticated(true);
          setSessions(sessionsResponse.data);
          setConditionCounts(countsResponse.data || []);
        }
      } catch (error) {
        console.error('Auto-login error:', error);
        setError('Auto-login failed. Please log in manually.');
        setIsAuthenticated(false);
        localStorage.removeItem('adminToken');
      } finally {
        setIsLoading(false);
      }
    };

    autoLogin();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create base64 encoded credentials
      const credentials = btoa(`${username}:${password}`);
      
      // Test the credentials with a request
      const response = await axios.get(`${API_URL}/admin/sessions`, {
        headers: { Authorization: `Bearer ${credentials}` }
      });

      if (response.status === 200) {
        localStorage.setItem('adminToken', credentials);
        setIsAuthenticated(true);
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
      setIsAuthenticated(false);
      localStorage.removeItem('adminToken');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async (token) => {
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
      setConditionCounts(countsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('adminToken');
      }
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
        await fetchData(token); // Refresh the data after deletion
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
      // Prolific standard fields
      'Participant id',          // Prolific ID
      'Started datetime',        // Session start time
      'Completed datetime',      // Session end time
      'Status',                  // Completion status
      'Session id',             // Our session ID
      
      // Study-specific fields
      'Stance',
      'Bot_Personality',
      'AI_Model',
      // Demographics
      'Age',
      'Gender',
      'Education',
      // PVQ21
      ...Array.from({ length: 21 }, (_, i) => `PVQ21_Q${i + 1}`),
      'PVQ21_Attention_Check',
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
      'SBSVS_Attention_Check',
      // Attitude Survey
      ...attitudeAspects.map(aspect => `Attitude_${aspect}`),
      // Stance Agreement
      'Stance_Agreement_Assigned',
      'Stance_Agreement_Opposite',
      // Alternative Uses
      'Alternative_Uses',
      // Add warning events headers
      'Warning_Events_Count',
      'Warning_Events_Details',
    ].join(',');

    const rows = sessions.map(session => {
      const pvq21Responses = session.pvq21?.responses || {};
      const sbsvsResponses = session.sbsvs?.responses || {};
      
      // Calculate completion status
      const isComplete = session.finalResponse?.text ? 'APPROVED' : 'AWAITING REVIEW';
      
      // Format warning events for CSV
      const warningEvents = (session.events || [])
        .filter(event => event.type === 'tab_switch')
        .map(event => `Step ${event.step} at ${new Date(event.timestamp).toLocaleString()}`);
      
      const row = [
        session.prolificId || '',
        session.timestamp || '',  // Start time
        session.finalResponse?.timestamp || '', // End time
        isComplete,
        session.sessionId,
        
        // Study-specific data
        session.stance,
        session.botPersonality,
        session.aiModel,
        // Demographics
        session.demographics?.age || '',
        session.demographics?.gender || '',
        session.demographics?.education || '',
        // PVQ21 - Get all 21 responses
        ...Array.from({ length: 21 }, (_, i) => pvq21Responses[i + 1] || ''),
        session.pvq21?.responses?.attention1 || '',
        // Initial Assessment
        session.initialAssessment?.interesting || '',
        session.initialAssessment?.important || '',
        session.initialAssessment?.agreement || '',
        // Chat History
        JSON.stringify(session.chat || []).replace(/"/g, '""'),
        // Final Response
        (session.finalResponse?.text || '').replace(/"/g, '""'),
        // SBSVS - Get all 10 responses
        ...Array.from({ length: 10 }, (_, i) => sbsvsResponses[i + 1] || ''),
        session.sbsvs?.responses?.attention1 || '',
        // Attitude Survey
        ...attitudeAspects.map(aspect => session.attitudeSurvey?.responses?.[aspect.toLowerCase()] || ''),
        // Stance Agreement
        session.stanceAgreement?.assigned || '',
        session.stanceAgreement?.opposite || '',
        // Alternative Uses
        JSON.stringify((session.alternativeUses || []).map(use => use.text)).replace(/"/g, '""'),
        // Add warning events data
        warningEvents.length,
        `"${warningEvents.join('; ')}"`,
      ];

      return row
        .map(value => {
          if (value === null || value === undefined) return '';
          return typeof value === 'string' ? `"${value}"` : value;
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  };

  const convertToText = (session) => {
    return `
Session ID: ${session.sessionId}
Prolific ID: ${session.prolificId || 'N/A'}
Timestamp: ${session.timestamp}
Stance: ${session.stance}
Bot Personality: ${session.botPersonality}
AI Model: ${session.aiModel}

Warning Events:
${(session.events || [])
  .filter(event => event.type === 'tab_switch')
  .map(event => `- Step ${event.step} at ${new Date(event.timestamp).toLocaleString()}`)
  .join('\n') || 'No warning events recorded'}

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
    const isComplete = session.finalResponse?.text ? 'APPROVED' : 'AWAITING REVIEW';

    // Add this function to format warning events
    const formatWarningEvents = (events) => {
      if (!events || !Array.isArray(events)) return [];
      return events.filter(event => event.type === 'tab_switch').map(event => ({
        step: event.step,
        timestamp: new Date(event.timestamp).toLocaleString()
      }));
    };

    return (
      <div key={session.sessionId} className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Participant ID: {session.prolificId || 'N/A'}</h3>
            <p>Session ID: {session.sessionId}</p>
            <p>Status: {isComplete}</p>
            <p>Started: {new Date(session.timestamp).toLocaleString()}</p>
            <p>Completed: {session.finalResponse?.timestamp ? 
                new Date(session.finalResponse.timestamp).toLocaleString() : 'Not completed'}</p>
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
            {/* Add this new section for warning events */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Warning Events:</h4>
              {session.events && session.events.length > 0 ? (
                <div className="space-y-2">
                  {formatWarningEvents(session.events).map((event, index) => (
                    <div key={index} className="bg-yellow-50 p-2 rounded">
                      <p>Step: {event.step}</p>
                      <p>Time: {event.timestamp}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No warning events recorded</p>
              )}
            </div>

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
                    <strong>{q === 'attention1' ? 'Attention Check:' : `Q${q}`}:</strong> {value}
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
                    <strong>{question.id === 'attention1' ? 'Attention Check:' : `Q${question.id}`}:</strong> {session.sbsvs?.responses?.[question.id] || 'N/A'}
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
                    <strong>{aspect}:</strong> {session.attitudeSurvey?.responses?.[aspect.toLowerCase()] || 'N/A'}
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
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
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
    );
  }

  return (
    <ErrorBoundary>
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
              {Array.isArray(conditionCounts) && conditionCounts.map((condition) => (
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
    </ErrorBoundary>
  );
}

export default Admin;