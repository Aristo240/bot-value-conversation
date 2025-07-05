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
      // Filter out DEV_TEST_ID sessions from the counts
      const filteredCounts = response.data.filter(condition => 
        condition.prolificId !== 'DEV_TEST_ID'
      );
      setConditionCounts(filteredCounts || []);
    } catch (error) {
      console.error('Error fetching condition counts:', error);
    }
  };

  // Update the useEffect to fetch both sessions and condition counts
  useEffect(() => {
    const autoLogin = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('adminToken');
        if (!storedToken) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const [sessionsResponse, countsResponse] = await Promise.all([
          axios.get(`${API_URL}/admin/sessions`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          }),
          axios.get(`${API_URL}/admin/conditionCounts`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          })
        ]);

        if (sessionsResponse.status === 200) {
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
      const credentials = btoa(`${username}:${password}`);
      
      // First verify login credentials
      const loginResponse = await axios.post(`${API_URL}/admin/login`, {
        username,
        password
      });

      if (loginResponse.status === 200) {
        localStorage.setItem('adminToken', credentials);
        setToken(credentials);

        // Then fetch data with the new token
        const [sessionsResponse, countsResponse] = await Promise.all([
          axios.get(`${API_URL}/admin/sessions`, {
            headers: { Authorization: `Bearer ${credentials}` }
          }),
          axios.get(`${API_URL}/admin/conditionCounts`, {
            headers: { Authorization: `Bearer ${credentials}` }
          })
        ]);

        setIsAuthenticated(true);
        setSessions(sessionsResponse.data);
        setConditionCounts(countsResponse.data || []);
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
    // Check if the session ID contains placeholder values
    if (sessionId.includes('{{%') || sessionId.includes('%}}')) {
      showStatus('Cannot delete session with placeholder values', true);
      return;
    }

    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        console.log('Attempting to delete session:', sessionId);
        console.log('Using token:', token);
        
        const response = await axios.delete(`${API_URL}/admin/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Delete response:', response);
        await fetchData(token); // Refresh the data after deletion
        showStatus('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
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
      'Participant id',          
      'Started datetime',        
      'Completed datetime',      
      'Status',                  
      'Session id',             
      
      // Study-specific fields
      'AI_Model',               
      'Stance',
      'Bot_Personality',
      // Questionnaire Order
      'Questionnaire_Case3',
      'Questionnaire_Case8',
      // Demographics
      'Age',
      'Gender',
      'Education',
      'Race',
      'Political_Views',
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
      // Add termination event headers
      'Experiment_Terminated',
      'Termination_Step',
      'Termination_Timestamp',
    ].join(',');

    const rows = sessions.map(session => {
      const pvq21Responses = session.pvq21?.responses || {};
      const sbsvsResponses = session.sbsvs?.responses || {};
      
      // Calculate completion status
      const isComplete = session.finalResponse?.text ? 'APPROVED' : 'AWAITING REVIEW';
      
      // Get termination event
      const terminationEvent = (session.events || [])
        .find(event => event.type === 'experiment_terminated');
      
      const row = [
        session.prolificId || '',
        session.timestamp || '',
        session.finalResponse?.timestamp || '',
        isComplete,
        session.sessionId,
        
        // Study-specific data
        session.aiModel || '',
        session.stance || '',
        session.botPersonality || '',
        // Questionnaire Order
        session.questionnaireOrder?.case3 || 'N/A',
        session.questionnaireOrder?.case8 || 'N/A',
        // Demographics
        session.demographics?.age || '',
        session.demographics?.gender || '',
        session.demographics?.education || '',
        session.demographics?.race || '',
        session.demographics?.politicalViews || '',
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
        // Add termination data
        terminationEvent ? 'Yes' : 'No',
        terminationEvent ? terminationEvent.step : 'N/A',
        terminationEvent ? new Date(terminationEvent.timestamp).toLocaleString() : 'N/A',
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
    // Get termination event
    const terminationEvent = (session.events || [])
      .find(event => event.type === 'experiment_terminated');

    return `
Session ID: ${session.sessionId}
Prolific ID: ${session.prolificId || 'N/A'}
Timestamp: ${session.timestamp}
Stance: ${session.stance}
Bot Personality: ${session.botPersonality}
AI Model: ${session.aiModel}

Questionnaire Order:
- Case 3: ${session.questionnaireOrder?.case3 || 'N/A'}
- Case 8: ${session.questionnaireOrder?.case8 || 'N/A'}

Experiment Status:
${terminationEvent ? 
  `Terminated at Step ${terminationEvent.step} (${new Date(terminationEvent.timestamp).toLocaleString()})` : 
  'Completed Successfully'}

Demographics:
- Age: ${session.demographics?.age || 'N/A'}
- Gender: ${session.demographics?.gender || 'N/A'}
- Education: ${session.demographics?.education || 'N/A'}
- Race: ${session.demographics?.race || 'N/A'}
- Political Views: ${session.demographics?.politicalViews || 'N/A'}

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

    // Add debug logging
    console.log('Rendering session:', {
      sessionId: session.sessionId,
      prolificId: session.prolificId,
      fullSession: session
    });

    // Get termination event
    const terminationEvent = (session.events || [])
      .find(event => event.type === 'experiment_terminated');

    return (
      <div key={session.sessionId} className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Participant ID: {session.prolificId || 'N/A'}</h3>
            <p>Session ID: {session.sessionId}</p>
            <p>Status: {terminationEvent ? 'TERMINATED' : isComplete}</p>
            {terminationEvent && (
              <p className="text-red-600 font-medium">
                Terminated at Step {terminationEvent.step} ({new Date(terminationEvent.timestamp).toLocaleString()})
              </p>
            )}
            <p>Study ID: {session.studyId || 'N/A'}</p>
            <p>Study Session ID: {session.studySessionId || 'N/A'}</p>
            <p>Started: {new Date(session.timestamp).toLocaleString()}</p>
            <p>Completed: {session.finalResponse?.timestamp ? 
                new Date(session.finalResponse.timestamp).toLocaleString() : 'Not completed'}</p>
            <p>Stance: {session.stance}</p>
            <p>Bot Personality: {session.botPersonality}</p>
            <p className="font-medium text-blue-600">AI Model: {session.aiModel}</p>
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
              {fileTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
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
            {/* Experiment Status */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Experiment Status:</h4>
              {terminationEvent ? (
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-red-600 font-medium">Experiment Terminated</p>
                  <p>Terminated at Step: {terminationEvent.step}</p>
                  <p>Time: {new Date(terminationEvent.timestamp).toLocaleString()}</p>
                </div>
              ) : (
                <p className="text-green-600">Experiment Completed Successfully</p>
              )}
            </div>

            {/* Demographics */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Demographics:</h4>
              <p>Age: {session.demographics?.age || 'N/A'}</p>
              <p>Gender: {session.demographics?.gender || 'N/A'}</p>
              <p>Education: {session.demographics?.education || 'N/A'}</p>
              <p>Race: {session.demographics?.race || 'N/A'}</p>
              <p>Political Views: {session.demographics?.politicalViews || 'N/A'}</p>
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
                {Object.entries(session.sbsvs?.responses || {}).map(([q, value]) => (
                  <div key={q} className="bg-white p-2 rounded">
                    <strong>{q === 'attention1' ? 'Attention Check:' : `Q${q}`}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Attitude Survey */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Attitude Survey:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(session.attitudeSurvey?.responses || {}).map(([aspect, value]) => (
                  <div key={aspect} className="bg-white p-2 rounded">
                    <strong>{aspect}:</strong> {value}
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
                    <p>{use.text || use.idea}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(use.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {(!session.alternativeUses || session.alternativeUses.length === 0) && (
                <p className="text-gray-500">No alternative uses recorded</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const recalculateCounters = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/admin/recalculateCounters`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConditionCounts(response.data.counters);
      console.log('Counters recalculated:', response.data);
    } catch (error) {
      console.error('Error recalculating counters:', error);
    }
  };

  const resetCounters = async () => {
    if (window.confirm('Are you sure you want to reset all condition counters to zero? This action cannot be undone.')) {
      try {
        const response = await axios.post(
          `${API_URL}/admin/resetCounters`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConditionCounts(response.data.counters);
        console.log('Counters reset:', response.data);
      } catch (error) {
        console.error('Error resetting counters:', error);
      }
    }
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
                {fileTypes && fileTypes.map((type) => (
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Condition Distribution</h2>
              <div className="flex gap-2">
                <button
                  onClick={recalculateCounters}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Recalculate Counters
                </button>
                <button
                  onClick={resetCounters}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Reset Counters
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.isArray(conditionCounts) ? (
                conditionCounts.length > 0 ? (
                  conditionCounts
                    .filter(condition => condition.aiModel === 'gpt') // Only show GPT conditions
                    .map((condition) => (
                      condition && (
                        <div
                          key={`${condition.aiModel}-${condition.stance}-${condition.personality}`}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <p>Model: {condition?.aiModel}</p>
                          <p>Stance: {condition?.stance}</p>
                          <p>Personality: {condition?.personality}</p>
                          <p className="text-lg font-bold text-blue-600">
                            Count: {condition?.count}
                          </p>
                        </div>
                      )
                    ))
                ) : (
                  <p>No condition data available</p>
                )
              ) : (
                <p>Loading condition data...</p>
              )}
            </div>
          </div>

          {/* Sessions list */}
          <div className="space-y-4">
            {!Array.isArray(sessions) ? (
              <p className="text-center text-gray-500">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-center text-gray-500">No sessions found</p>
            ) : (
              sessions.map(session => renderSessionData(session))
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Admin;