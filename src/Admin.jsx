import React, { useState } from 'react';
import axios from 'axios';

function Admin() {
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('json');

  const fileTypes = [
    { label: 'JSON', value: 'json' },
    { label: 'CSV', value: 'csv' },
    { label: 'TXT', value: 'txt' }
  ];

  const showStatus = (message, isError = false) => {
    setDownloadStatus(message);
    setTimeout(() => setDownloadStatus(''), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/login', { username, password });
      setIsAuthenticated(true);
      fetchSessions();
    } catch (error) {
      setError('Invalid credentials');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.post('/api/admin/sessions', { 
        username, 
        password 
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showStatus('Failed to fetch sessions', true);
    }
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await axios.delete(`/api/admin/sessions/${sessionId}`, {
          headers: {
            username,
            password
          }
        });
        fetchSessions();
        showStatus('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        showStatus('Failed to delete session', true);
      }
    }
  };

  const convertToCSV = (data) => {
    if (Array.isArray(data?.chat)) {
      // For chat data
      const rows = data.chat.map(msg => ({
        sessionId: data.sessionId,
        timestamp: msg.timestamp,
        sender: msg.sender,
        message: msg.text.replace(/,/g, ';'),
        stance: data.stance,
        botPersonality: data.botPersonality
      }));
      const headers = Object.keys(rows[0]).join(',');
      return [headers, ...rows.map(row => Object.values(row).join(','))].join('\n');
    } else if (data.sbsvs) {
      // For questionnaire data
      const rows = [];
      // SBSVS responses
      data.sbsvs.responses?.forEach(r => {
        rows.push({
          sessionId: data.sessionId,
          type: 'sbsvs',
          questionId: r.questionId,
          value: r.value,
          timestamp: data.sbsvs.timestamp
        });
      });
      // Attitude responses
      data.attitudeSurvey.responses?.forEach(r => {
        rows.push({
          sessionId: data.sessionId,
          type: 'attitude',
          aspect: r.aspect,
          rating: r.rating,
          timestamp: data.attitudeSurvey.timestamp
        });
      });
      // Stance agreement
      rows.push({
        sessionId: data.sessionId,
        type: 'stance_agreement',
        assigned: data.stanceAgreement.assigned,
        opposite: data.stanceAgreement.opposite,
        timestamp: data.stanceAgreement.timestamp
      });
      // Demographics
      rows.push({
        sessionId: data.sessionId,
        type: 'demographics',
        age: data.demographics.age,
        gender: data.demographics.gender,
        education: data.demographics.education,
        timestamp: data.demographics.timestamp
      });
      const headers = 'sessionId,type,questionId,value,aspect,rating,assigned,opposite,age,gender,education,timestamp';
      return [headers, ...rows.map(row => Object.values(row).join(','))].join('\n');
    }
    // For other data
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).join(',');
    return [headers, values].join('\n');
  };

  const convertToTXT = (data) => {
    let content = `Session ID: ${data.sessionId}\n`;
    content += `Stance: ${data.stance}\n`;
    content += `Bot Personality: ${data.botPersonality}\n\n`;

    if (data.chat) {
      content += "Chat History:\n\n";
      content += data.chat.map(msg => 
        `${msg.sender === 'bot' ? '🤖 Assistant:' : '👤 User:'} ${msg.text}\n`
      ).join('\n');
    }

    if (data.sbsvs) {
      content += "\nSBSVS Responses:\n";
      data.sbsvs.responses.forEach(r => {
        content += `Question ${r.questionId}: ${r.value}\n`;
      });
    }

    if (data.attitudeSurvey) {
      content += "\nAttitude Survey:\n";
      data.attitudeSurvey.responses.forEach(r => {
        content += `${r.aspect}: ${r.rating}\n`;
      });
    }

    if (data.stanceAgreement) {
      content += "\nStance Agreement:\n";
      content += `Assigned stance: ${data.stanceAgreement.assigned}\n`;
      content += `Opposite stance: ${data.stanceAgreement.opposite}\n`;
    }

    if (data.demographics) {
      content += "\nDemographics:\n";
      content += `Age: ${data.demographics.age}\n`;
      content += `Gender: ${data.demographics.gender}\n`;
      content += `Education: ${data.demographics.education}\n`;
    }

    return content;
  };

  const downloadInFormat = (data, filename, format) => {
    let content;
    let type;
    let extension;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        type = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        content = convertToCSV(data);
        type = 'text/csv';
        extension = 'csv';
        break;
      case 'txt':
        content = convertToTXT(data);
        type = 'text/plain';
        extension = 'txt';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        type = 'application/json';
        extension = 'json';
    }

    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showStatus(`Downloaded ${filename}.${extension}`);
  };

  const downloadSession = async (session, type = 'full') => {
    try {
      let data;
      let filename;

      if (type === 'full') {
        const response = await axios.get(`/api/admin/sessions/${session.sessionId}/full`, {
          headers: { username, password }
        });
        data = response.data;
        filename = `full_session_${session.sessionId}`;
      } else if (type === 'chat') {
        const response = await axios.get(`/api/admin/sessions/${session.sessionId}/chat`, {
          headers: { username, password }
        });
        data = {
          sessionId: session.sessionId,
          stance: session.stance,
          botPersonality: session.botPersonality,
          chat: response.data
        };
        filename = `chat_${session.sessionId}`;
      } else if (type === 'response') {
        const response = await axios.get(`/api/admin/sessions/${session.sessionId}/response`, {
          headers: { username, password }
        });
        data = {
          sessionId: session.sessionId,
          stance: session.stance,
          botPersonality: session.botPersonality,
          finalResponse: response.data
        };
        filename = `response_${session.sessionId}`;
      }

      downloadInFormat(data, filename, selectedFileType);
    } catch (error) {
      console.error('Error downloading session:', error);
      showStatus('Failed to download session data', true);
    }
  };

  const downloadAllSessions = async () => {
    try {
      const fullSessions = await Promise.all(
        sessions.map(async (session) => {
          const response = await axios.get(`/api/admin/sessions/${session.sessionId}/full`, {
            headers: { username, password }
          });
          return response.data;
        })
      );

      downloadInFormat(fullSessions, 'all_sessions', selectedFileType);
    } catch (error) {
      console.error('Error downloading all sessions:', error);
      showStatus('Failed to download all sessions', true);
    }
  };

  // Rest of the component remains the same (render methods)...

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
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
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
          <div className="flex items-center gap-4">
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

        <div className="grid gap-6">
          {sessions.map((session) => (
            <div key={session.sessionId} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Session ID: {session.sessionId}</h2>
                  <p className="text-gray-600">
                    Date: {new Date(session.timestamp).toLocaleString()}
                  </p>
                  <p>Stance: {session.stance}</p>
                  <p>Bot Personality: {session.botPersonality}</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowDownloadOptions(session.sessionId)}
                      className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
                    >
                      Download
                    </button>
                    {showDownloadOptions === session.sessionId && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
                        <div className="p-2">
                          <div className="mb-2 px-2">
                            <label className="text-sm text-gray-600">File Type:</label>
                            <select
                              value={selectedFileType}
                              onChange={(e) => setSelectedFileType(e.target.value)}
                              className="w-full mt-1 p-1 border rounded text-sm"
                            >
                              {fileTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="border-t"></div>
                          {[
                            { label: 'Full Session', type: 'full' },
                            { label: 'Chat Only', type: 'chat' },
                            { label: 'Response Only', type: 'response' }
                          ].map((option) => (
                            <button
                              key={option.label}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                downloadSession(session, option.type);
                                setShowDownloadOptions(null);
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSession(session.sessionId)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Chat Preview:</h3>
                <div className="bg-gray-50 p-4 rounded max-h-40 overflow-y-auto">
                  {session.chat.map((msg, index) => (
                    <div key={index} className="mb-2">
                      <span className="font-semibold">
                        {msg.sender === 'bot' ? '🤖 Assistant:' : '👤 User:'} 
                      </span>
                      <span className="ml-2">{msg.text}</span>
                    </div>
                    ))}
                    </div>
    
                    {session.finalResponse && (
                      <>
                        <h3 className="font-semibold mt-4 mb-2">Final Response:</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          {session.finalResponse.text}
                        </div>
                      </>
                    )}
    
                    {session.sbsvs && (
                      <>
                        <h3 className="font-semibold mt-4 mb-2">SBSVS Responses:</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          {session.sbsvs.responses.map((response, index) => (
                            <div key={index}>
                              Question {response.questionId}: {response.value}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
    
                    {session.attitudeSurvey && (
                      <>
                        <h3 className="font-semibold mt-4 mb-2">Attitude Survey:</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          {session.attitudeSurvey.responses.map((response, index) => (
                            <div key={index}>
                              {response.aspect}: {response.rating}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
    
                    {session.stanceAgreement && (
                      <>
                        <h3 className="font-semibold mt-4 mb-2">Stance Agreement:</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <div>Assigned Stance: {session.stanceAgreement.assigned}/5</div>
                          <div>Opposite Stance: {session.stanceAgreement.opposite}/5</div>
                        </div>
                      </>
                    )}
    
                    {session.demographics && (
                      <>
                        <h3 className="font-semibold mt-4 mb-2">Demographics:</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <div>Age: {session.demographics.age}</div>
                          <div>Gender: {session.demographics.gender}</div>
                          <div>Education: {session.demographics.education}</div>
                        </div>
                      </>
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