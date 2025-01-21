import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://bot-value-conversation-1.onrender.com/api';

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
    // Create CSV headers
    const headers = [
      'SessionId',
      'Timestamp',
      'Bot_Personality',
      'Stance',
      // Demographics
      'Age',
      'Gender',
      'Education',
      // PVQ21
      ...Array.from({ length: 21 }, (_, i) => `PVQ21_Q${i + 1}`),
      // Initial Assessment
      'Initial_Interesting',
      'Initial_Important',
      'Initial_Agreement',
      // Chat History (each message gets its own column)
      'Chat_History',
      // Final Response
      'Final_Response',
      // SBSVS
      ...Array.from({ length: 10 }, (_, i) => `SBSVS_Q${i + 1}`),
      // Attitude Survey
      'Attitude_Interesting',
      'Attitude_Enjoyable',
      'Attitude_Difficult',
      'Attitude_Irritating',
      'Attitude_Helpful',
      'Attitude_Satisfying',
      'Attitude_Effective',
      'Attitude_Engaging',
      'Attitude_Stimulating',
      'Attitude_Informative',
      'Attitude_Frustrating',
      // Stance Agreement
      'Stance_Agreement_Assigned',
      'Stance_Agreement_Opposite',
      // Alternative Uses
      'Alternative_Uses'
    ];

    // Transform data for CSV
    const rows = sessionData.map(session => {
      const chatHistory = session.chat?.map(msg => 
        `${msg.sender} (${new Date(msg.timestamp).toLocaleString()}): ${msg.text}`
      ).join('\n') || '';

      const alternativeUses = session.alternativeUses?.responses?.map(
        (r, i) => `${i + 1}. ${r.idea}`
      ).join('\n') || '';

      return [
        session.sessionId,
        session.timestamp,
        session.botPersonality,
        session.stance,
        // Demographics
        session.demographics?.age || '',
        session.demographics?.gender || '',
        session.demographics?.education || '',
        // PVQ21
        ...Array.from({ length: 21 }, (_, i) => 
          session.pvq21?.responses?.find(r => r.questionId === i + 1)?.value || ''
        ),
        // Initial Assessment
        session.initialAssessment?.interesting || '',
        session.initialAssessment?.important || '',
        session.initialAssessment?.agreement || '',
        // Chat History
        chatHistory,
        // Final Response
        session.finalResponse?.text || '',
        // SBSVS
        ...Array.from({ length: 10 }, (_, i) => 
          session.sbsvs?.responses?.find(r => r.questionId === i + 1)?.value || ''
        ),
        // Attitude Survey
        ...attitudeAspects.map(aspect => 
          session.attitudeSurvey?.responses?.find(r => r.aspect === aspect)?.rating || ''
        ),
        // Stance Agreement
        session.stanceAgreement?.assigned || '',
        session.stanceAgreement?.opposite || '',
        // Alternative Uses
        alternativeUses
      ].map(value => `"${value}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
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
Assigned: ${session.stanceAgreement?.assigned || 'N/A'}
Opposite: ${session.stanceAgreement?.opposite || 'N/A'}

Alternative Uses:
${session.alternativeUses?.responses?.map((r, i) => `${i + 1}. ${r.idea}`).join('\n') || 'N/A'}
-------------------`;
    }).join('\n\n');
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

  const exportSingleSession = (session) => {
    try {
      let content;
      const filename = `session_${session.sessionId}_${selectedDataType}`;

      // Filter data if specific type selected
      let dataToExport = session;
      if (selectedDataType !== 'all') {
        dataToExport = {
          sessionId: session.sessionId,
          timestamp: session.timestamp,
          botPersonality: session.botPersonality,
          stance: session.stance,
          [selectedDataType]: session[selectedDataType]
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
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${selectedFileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
          {sessions.map((session) => (
            <div key={session.sessionId} className="border rounded-lg p-6 bg-white shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold">Session ID: {session.sessionId}</h3>
                  <p>Timestamp: {new Date(session.timestamp).toLocaleString()}</p>
                  <p className="font-semibold">Bot Personality: {session.botPersonality || 'N/A'}</p>
                  <p>Stance: {session.stance}</p>
                </div>
                
                <div className="flex gap-2">
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
                    onClick={() => exportSingleSession(session)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Export Session
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Demographics */}
                {session.demographics && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Demographics:</h4>
                    <p>Age: {session.demographics.age}</p>
                    <p>Gender: {session.demographics.gender}</p>
                    <p>Education: {session.demographics.education}</p>
                  </div>
                )}

                {/* PVQ21 */}
                {session.pvq21?.responses && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">PVQ21 Responses:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {session.pvq21.responses.map((response) => (
                        <div key={response.questionId}>
                          Q{response.questionId}: {response.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initial Assessment */}
                {session.initialAssessment && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Initial Assessment:</h4>
                    <p>Interesting: {session.initialAssessment.interesting}</p>
                    <p>Important: {session.initialAssessment.important}</p>
                    <p>Agreement: {session.initialAssessment.agreement}</p>
                  </div>
                )}

                {/* Chat History */}
                {session.chat && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Chat History:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {session.chat.map((msg) => (
                        <div key={msg.messageId} className={`p-2 ${msg.sender === 'bot' ? 'bg-blue-50' : 'bg-green-50'}`}>
                          <strong>{msg.sender}:</strong> {msg.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Response */}
                {session.finalResponse && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Final Response:</h4>
                    <p>{session.finalResponse.text}</p>
                  </div>
                )}

                {/* SBSVS */}
                {session.sbsvs?.responses && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">SBSVS Responses:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {session.sbsvs.responses.map((response) => (
                        <div key={response.questionId}>
                          Q{response.questionId}: {response.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attitude Survey */}
                {session.attitudeSurvey?.responses && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Attitude Survey:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {session.attitudeSurvey.responses.map((response) => (
                        <div key={response.aspect}>
                          {response.aspect}: {response.rating}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stance Agreement */}
                {session.stanceAgreement && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Stance Agreement:</h4>
                    <p>Assigned: {session.stanceAgreement.assigned}</p>
                    <p>Opposite: {session.stanceAgreement.opposite}</p>
                  </div>
                )}

                {/* Alternative Uses */}
                {session.alternativeUses?.responses && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Alternative Uses:</h4>
                    <div className="space-y-1">
                      {session.alternativeUses.responses.map((response, index) => (
                        <div key={response.id}>
                          {index + 1}. {response.idea}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;