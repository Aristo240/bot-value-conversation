import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

// Add the missing attitudeAspects array
const attitudeAspects = [
  'Interesting',
  'Enjoyable',
  'Difficult',
  'Irritating',
  'Helpful',
  'Satisfying',
  'Effective',
  'Engaging',
  'Stimulating',
  'Informative',
  'Frustrating'
];

function Admin() {
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('csv');
  const [selectedDataType, setSelectedDataType] = useState('all');
  const [conditionCounts, setConditionCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingZip] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

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

  // Effect to refresh condition counts periodically
  useEffect(() => {
    if (isAuthenticated) {
      const intervalId = setInterval(() => {
        fetchData();
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const showStatus = (message, isError = false) => {
    setDownloadStatus(message);
    setTimeout(() => setDownloadStatus(''), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sessionsResponse, countsResponse] = await Promise.all([
        axios.post(`${API_URL}/admin/sessions`, { username, password }),
        axios.get(`${API_URL}/admin/conditionCounts`, { 
          headers: { username, password }
        })
      ]);
      setSessions(sessionsResponse.data);
      setConditionCounts(countsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showStatus('Failed to fetch data', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/admin/login`, { username, password });
      setIsAuthenticated(true);
      await fetchData();
    } catch (error) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setIsLoading(true);
      try {
        await axios.delete(`${API_URL}/admin/sessions/${sessionId}`, {
          headers: { username, password }
        });
        await fetchData();
        showStatus('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        showStatus('Failed to delete session', true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const downloadSession = (session) => {
    let content;
    const filename = `session_${session.sessionId}_${new Date().toISOString()}`;

    switch (selectedFileType) {
      case 'json':
        content = JSON.stringify(session, null, 2);
        downloadFile(content, filename, 'application/json');
        break;
      case 'csv':
        content = convertToCSV([session]);
        downloadFile(content, filename, 'text/csv');
        break;
      case 'txt':
        content = convertToText(session);
        downloadFile(content, filename, 'text/plain');
        break;
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
      // Chat
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
        Age: session.demographics?.age || '',
        Gender: session.demographics?.gender || '',
        Education: session.demographics?.education || '',
        ...Array.from({ length: 21 }, (_, i) => session.pvq21?.responses?.[i + 1] || ''),
        Initial_Interest: session.initialAssessment?.interesting || '',
        Initial_Importance: session.initialAssessment?.important || '',
        Initial_Agreement: session.initialAssessment?.agreement || '',
        Chat_History: JSON.stringify(session.chat || []),
        Final_Response: session.finalResponse?.text || '',
        ...Array.from({ length: 10 }, (_, i) => session.sbsvs?.[i + 1] || ''),
        ...attitudeAspects.map(aspect => session.attitudeSurvey?.[aspect] || ''),
        Stance_Agreement_Assigned: session.stanceAgreement?.assigned || '',
        Stance_Agreement_Opposite: session.stanceAgreement?.opposite || '',
        Alternative_Uses: JSON.stringify(session.alternativeUses || [])
      };

      return Object.values(row).join(',');
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
${session.chat?.map(msg => `${msg.sender}: ${msg.text}`).join('\n') || 'N/A'}

Final Response:
${session.finalResponse?.text || 'N/A'}

SBSVS Responses:
${Object.entries(session.sbsvs || {})
  .map(([q, v]) => `Q${q}: ${v}`)
  .join('\n')}

Attitude Survey:
${attitudeAspects
  .map(aspect => `${aspect}: ${session.attitudeSurvey?.[aspect] || 'N/A'}`)
  .join('\n')}

Stance Agreement:
- Assigned: ${session.stanceAgreement?.assigned || 'N/A'}
- Opposite: ${session.stanceAgreement?.opposite || 'N/A'}

Alternative Uses:
${session.alternativeUses?.map(use => use.text).join('\n') || 'N/A'}
    `.trim();
  };

  const renderSessionData = (session) => {
    const isExpanded = expandedSession === session.sessionId;

    return (
      <div key={session.sessionId} className="border rounded-lg p-6 bg-white shadow mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold">Session ID: {session.sessionId}</h3>
            <p>Timestamp: {new Date(session.timestamp).toLocaleString()}</p>
            <p>Stance: {session.stance}</p>
            <p>Bot Personality: {session.botPersonality}</p>
            <p>AI Model: {session.aiModel}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadSession(session)}
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
          <div className="mt-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Demographics:</h4>
              <p>Age: {session.demographics?.age || 'N/A'}</p>
              <p>Gender: {session.demographics?.gender || 'N/A'}</p>
              <p>Education: {session.demographics?.education || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">PVQ21 Responses:</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(session.pvq21?.responses || {}).map(([q, v]) => (
                  <div key={q}>Q{q}: {v}</div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Initial Assessment:</h4>
              <p>Interest: {session.initialAssessment?.interesting || 'N/A'}</p>
              <p>Importance: {session.initialAssessment?.important || 'N/A'}</p>
              <p>Agreement: {session.initialAssessment?.agreement || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Chat History:</h4>
              {session.chat?.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.sender === 'bot' ? 'text-blue-600' : 'text-green-600'}`}>
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Final Response:</h4>
              <p>{session.finalResponse?.text || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">SBSVS Responses:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(session.sbsvs || {}).map(([q, v]) => (
                  <div key={q}>Q{q}: {v}</div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Attitude Survey:</h4>
              <div className="grid grid-cols-2 gap-2">
                {attitudeAspects.map(aspect => (
                  <div key={aspect}>{aspect}: {session.attitudeSurvey?.[aspect] || 'N/A'}</div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Stance Agreement:</h4>
              <p>Assigned: {session.stanceAgreement?.assigned || 'N/A'}</p>
              <p>Opposite: {session.stanceAgreement?.opposite || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Alternative Uses:</h4>
              {session.alternativeUses?.map((use, i) => (
                <div key={i}>{use.text}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      )}

      {downloadStatus && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          downloadStatus.includes('Failed') ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {downloadStatus}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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

        <div className="space-y-4">
          {sessions.map(renderSessionData)}
        </div>
      </div>
    </div>
  );
}

export default Admin;