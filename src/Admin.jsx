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
        fetchConditionCounts();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const showStatus = (message, isError = false) => {
    setDownloadStatus(message);
    setTimeout(() => setDownloadStatus(''), 3000);
  };

  const fetchConditionCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/conditionCounts`, {
        headers: { username, password }
      });
      setConditionCounts(response.data);
    } catch (error) {
      console.error('Error fetching condition counts:', error);
    }
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
        await fetchData(); // This will update both sessions and condition counts
        showStatus('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        showStatus('Failed to delete session', true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const downloadInFormat = (data, filename) => {
    let content;
    let type;

    switch (selectedFileType) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        type = 'application/json';
        break;
      case 'txt':
        content = convertToText(data);
        type = 'text/plain';
        break;
      default:
        content = convertToCSV(data);
        type = 'text/csv';
    }

    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.${selectedFileType}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (sessionData) => {
    // Add logging to debug the data structure
    console.log('Session Data:', sessionData);

    const headers = [
      'SessionId',
      'Timestamp',
      'Bot_Personality',
      'Stance',
      // Initial Assessment
      'Initial_Assessment_Interesting',
      'Initial_Assessment_Important',
      'Initial_Assessment_Agreement',
      // Demographics
      'Demographics_Age',
      'Demographics_Gender',
      'Demographics_Education',
      // PVQ21 (21 questions)
      ...Array.from({ length: 21 }, (_, i) => `PVQ21_Q${i + 1}`),
      // Chat History
      'Chat_History',
      // Final Response
      'Final_Response',
      // SBSVS (10 questions)
      ...Array.from({ length: 10 }, (_, i) => `SBSVS_Q${i + 1}`),
      // Attitude Survey
      ...attitudeAspects.map(aspect => `Attitude_${aspect}`),
      // Stance Agreement
      'Stance_Agreement_Assigned',
      'Stance_Agreement_Opposite',
      // Alternative Uses
      'Alternative_Uses'
    ].join(',');

    const rows = sessionData.map(session => {
      // Ensure responses arrays exist and are arrays
      const pvq21Responses = Array.isArray(session?.pvq21?.responses) 
        ? session.pvq21.responses 
        : [];
      
      const sbsvsResponses = Array.isArray(session?.sbsvs?.responses)
        ? session.sbsvs.responses
        : [];
      
      const attitudeSurveyResponses = Array.isArray(session?.attitudeSurvey?.responses)
        ? session.attitudeSurvey.responses
        : [];

      // Create an array of PVQ21 values with safer checks
      const pvq21Values = Array.from({ length: 21 }, (_, i) => {
        const questionId = i + 1;
        const response = pvq21Responses.find(r => r?.questionId === questionId);
        return response?.value || '';
      });

      return [
        session.sessionId || '',
        session.timestamp || '',
        session.botPersonality || '',
        session.stance || '',
        // Initial Assessment
        session?.initialAssessment?.interesting || '',
        session?.initialAssessment?.important || '',
        session?.initialAssessment?.agreement || '',
        // Demographics
        session?.demographics?.age || '',
        session?.demographics?.gender || '',
        session?.demographics?.education || '',
        // PVQ21
        ...pvq21Values,
        // Chat History
        Array.isArray(session?.chat) 
          ? session.chat.map(msg => `${msg?.sender || ''}: ${msg?.text || ''}`).join('\n')
          : '',
        // Final Response
        session?.finalResponse?.text || '',
        // SBSVS
        ...Array.from({ length: 10 }, (_, i) => {
          const questionId = i + 1;
          const response = sbsvsResponses.find(r => r?.questionId === questionId);
          return response?.value || '';
        }),
        // Attitude Survey
        ...attitudeAspects.map(aspect => {
          const response = attitudeSurveyResponses.find(r => r?.aspect === aspect);
          return response?.rating || '';
        }),
        // Stance Agreement
        session?.stanceAgreement?.assigned || '',
        session?.stanceAgreement?.opposite || '',
        // Alternative Uses
        Array.isArray(session?.alternativeUses?.responses)
          ? session.alternativeUses.responses.map(r => r?.idea || '').join('\n')
          : ''
      ].map(value => `"${value}"`).join(',');
    });

    return [headers, ...rows].join('\n');
  };

  const convertToText = (sessionData) => {
    return sessionData.map(session => {
      return `Session ID: ${session.sessionId}
Timestamp: ${new Date(session.timestamp).toLocaleString()}
Bot Personality: ${session.botPersonality}
Stance: ${session.stance}

Demographics:
Age: ${session.demographics?.age || 'N/A'}
Gender: ${session.demographics?.gender || 'N/A'}
Education: ${session.demographics?.education || 'N/A'}

PVQ21 Responses:
${session.pvq21?.responses?.map(r => `Q${r.questionId}: ${r.value}`).join('\n') || 'N/A'}

Initial Assessment:
Interesting: ${session.initialAssessment?.interesting || 'N/A'}
Important: ${session.initialAssessment?.important || 'N/A'}
Agreement: ${session.initialAssessment?.agreement || 'N/A'}

Chat History:
${session.chat?.map(msg => `${msg.sender} (${new Date(msg.timestamp).toLocaleString()}): ${msg.text}`).join('\n') || 'N/A'}

Final Response:
${session.finalResponse?.text || 'N/A'}

SBSVS Responses:
${session.sbsvs?.responses?.map(r => `Q${r.questionId}: ${r.value}`).join('\n') || 'N/A'}

Attitude Survey:
${session.attitudeSurvey?.responses?.map(r => `${r.aspect}: ${r.rating}`).join('\n') || 'N/A'}

Stance Agreement:
Assigned Stance: ${session.stanceAgreement?.assigned || 'N/A'}
Opposite Stance: ${session.stanceAgreement?.opposite || 'N/A'}

Alternative Uses:
${session.alternativeUses?.responses?.map((r, i) => `${i + 1}. ${r.idea}`).join('\n') || 'N/A'}
-------------------`;
    }).join('\n\n---\n\n');
  };

  const exportData = (sessionData) => {
    try {
      let dataToExport = sessionData;
      
      // Filter data if a specific type is selected
      if (selectedDataType !== 'all') {
        dataToExport = sessionData.map(session => ({
          sessionId: session.sessionId,
          timestamp: session.timestamp,
          botPersonality: session.botPersonality,
          stance: session.stance,
          [selectedDataType]: session[selectedDataType]
        }));
      }

      downloadInFormat(dataToExport, `session_data_${selectedDataType}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      showStatus('Failed to export data', true);
    }
  };

  const downloadSession = async (session, type = 'full') => {
    setIsLoading(true);
    try {
      let data;
      let filename;

      switch (type) {
        case 'full':
          const response = await axios.get(`${API_URL}/admin/sessions/${session.sessionId}/full`, {
            headers: { username, password }
          });
          data = response.data;
          filename = `full_session_${session.sessionId}`;
          break;
        
        case 'demographics':
          data = {
            sessionId: session.sessionId,
            demographics: session.demographics
          };
          filename = `demographics_${session.sessionId}`;
          break;

        case 'pvq21':
          data = {
            sessionId: session.sessionId,
            pvq21: session.pvq21
          };
          filename = `pvq21_${session.sessionId}`;
          break;

        case 'initial':
          data = {
            sessionId: session.sessionId,
            initialAssessment: session.initialAssessment
          };
          filename = `initial_assessment_${session.sessionId}`;
          break;

        case 'chat':
          const chatResponse = await axios.get(`${API_URL}/admin/sessions/${session.sessionId}/chat`, {
            headers: { username, password }
          });
          data = {
            sessionId: session.sessionId,
            chat: chatResponse.data
          };
          filename = `chat_${session.sessionId}`;
          break;

        case 'final':
          const finalResponse = await axios.get(`${API_URL}/admin/sessions/${session.sessionId}/response`, {
            headers: { username, password }
          });
          data = {
            sessionId: session.sessionId,
            finalResponse: finalResponse.data
          };
          filename = `final_response_${session.sessionId}`;
          break;

        case 'sbsvs':
          data = {
            sessionId: session.sessionId,
            sbsvs: session.sbsvs
          };
          filename = `sbsvs_${session.sessionId}`;
          break;

        case 'attitude':
          data = {
            sessionId: session.sessionId,
            attitudeSurvey: session.attitudeSurvey
          };
          filename = `attitude_survey_${session.sessionId}`;
          break;

        case 'aut':
          const autResponse = await axios.get(`${API_URL}/admin/sessions/${session.sessionId}/aut`, {
            headers: { username, password }
          });
          data = {
            sessionId: session.sessionId,
            alternativeUses: autResponse.data
          };
          filename = `alternative_uses_${session.sessionId}`;
          break;
      }

      downloadInFormat(data, filename);
    } catch (error) {
      console.error('Error downloading session:', error);
      showStatus('Failed to download session data', true);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllSessions = async () => {
    setIsLoading(true);
    try {
      const fullSessions = await Promise.all(
        sessions.map(async (session) => {
          const response = await axios.get(`${API_URL}/admin/sessions/${session.sessionId}/full`, {
            headers: { username, password }
          });
          return response.data;
        })
      );

      downloadInFormat(fullSessions, 'all_sessions');
    } catch (error) {
      console.error('Error downloading all sessions:', error);
      showStatus('Failed to download all sessions', true);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSingleSession = async (session) => {
    try {
      // First, fetch the full session data
      const response = await axios.get(`${API_URL}/admin/sessions/${session.sessionId}/full`, {
        headers: { username, password }
      });
      const fullSessionData = response.data;

      let content;
      const filename = `session_${session.sessionId}_${selectedDataType}`;

      // Filter data if specific type selected
      let dataToExport = fullSessionData;
      if (selectedDataType !== 'all') {
        dataToExport = {
          sessionId: fullSessionData.sessionId,
          timestamp: fullSessionData.timestamp,
          botPersonality: fullSessionData.botPersonality,
          stance: fullSessionData.stance,
          [selectedDataType]: fullSessionData[selectedDataType]
        };
      }

      switch (selectedFileType) {
        case 'json':
          content = JSON.stringify(dataToExport, null, 2);
          downloadFile(content, filename, 'application/json');
          break;
        case 'txt':
          content = convertToText([dataToExport]);
          downloadFile(content, filename, 'text/plain');
          break;
        default:
          content = convertToCSV([dataToExport]);
          downloadFile(content, filename, 'text/csv');
      }
    } catch (error) {
      console.error('Error exporting session:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const downloadFile = (content, filename, type) => {
    try {
      const blob = new Blob([content], { type: `${type};charset=utf-8;` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${selectedFileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Update the session display section with more defensive checks
  const renderSessionData = (session) => {
    // Add logging to debug individual session data
    console.log('Rendering session:', session);

    return (
      <div key={session.sessionId} className="border rounded-lg p-6 bg-white shadow mb-4">
        {/* Basic Info */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold">Session ID: {session.sessionId || 'N/A'}</h3>
            <p>Timestamp: {session.timestamp ? new Date(session.timestamp).toLocaleString() : 'N/A'}</p>
            <p className="font-semibold">Bot Personality: {session.botPersonality || 'N/A'}</p>
            <p>Stance: {session.stance || 'N/A'}</p>
          </div>
        </div>

        {/* PVQ21 Section */}
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-semibold mb-2">PVQ21 Responses:</h4>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 21 }, (_, i) => {
              const questionId = i + 1;
              const responses = Array.isArray(session?.pvq21?.responses) 
                ? session.pvq21.responses 
                : [];
              const response = responses.find(r => r?.questionId === questionId);
              return (
                <div key={questionId} className="text-sm">
                  Q{questionId}: {response?.value || 'N/A'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stance Agreement Section */}
        <div className="bg-gray-50 p-4 rounded mt-4">
          <h4 className="font-semibold mb-2">Stance Agreement:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Assigned Stance:</span>{' '}
              {session?.stanceAgreement?.assigned || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Opposite Stance:</span>{' '}
              {session?.stanceAgreement?.opposite || 'N/A'}
            </div>
          </div>
        </div>

        {/* ... other sections ... */}
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
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-center">Loading...</p>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Condition Distribution */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Condition Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {conditionCounts.map((condition) => (
              <div
                key={`${condition.aiModel}-${condition.stance}-${condition.personality}`}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-sm font-medium text-gray-500">Model</div>
                <div className="mb-2">{condition.aiModel}</div>
                <div className="text-sm font-medium text-gray-500">Stance</div>
                <div className="mb-2">{condition.stance}</div>
                <div className="text-sm font-medium text-gray-500">Personality</div>
                <div className="mb-2">{condition.personality}</div>
                <div className="text-lg font-bold text-blue-600">
                  Count: {condition.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Controls */}
        <div className="mb-6 flex items-center gap-4">
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
          
          <select
            value={selectedDataType}
            onChange={(e) => setSelectedDataType(e.target.value)}
            className="p-2 border rounded"
          >
            {dataTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => exportData(sessions)}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Download All Sessions
          </button>
        </div>

        {/* Sessions List */}
        <div className="space-y-8">
          {Array.isArray(sessions) ? sessions.map(renderSessionData) : <p>No sessions available</p>}
        </div>
      </div>
    </div>
  );
}

export default Admin;