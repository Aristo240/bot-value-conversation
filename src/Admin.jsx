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

  // Helper function to show status messages
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

  const convertToCSV = (data) => {
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      return [headers, ...rows].join('\n');
    } else {
      const headers = Object.keys(data).join(',');
      const values = Object.values(data).join(',');
      return [headers, values].join('\n');
    }
  };

  const convertToTXT = (data) => {
    if (Array.isArray(data?.chat)) {
      return `Stance: ${data.stance}\nBot Personality: ${data.botPersonality}\n\nChat History:\n\n` +
        data.chat.map(msg => 
          `${msg.sender === 'bot' ? '🤖 Assistant:' : '👤 User:'} ${msg.text}\n`
        ).join('\n');
    } else {
      return `Stance: ${data.stance}\nBot Personality: ${data.botPersonality}\n\n` +
        JSON.stringify(data, null, 2);
    }
  };

  const downloadChat = async (session) => {
    try {
      const response = await axios.get(`/api/admin/sessions/${session.sessionId}/chat`, {
        headers: { username, password }
      });
      
      const chatData = {
        stance: session.stance,
        botPersonality: session.botPersonality,
        chat: response.data
      };

      ['json', 'csv', 'txt'].forEach(format => {
        downloadInFormat(chatData, `chat_${session.sessionId}`, format);
      });
    } catch (error) {
      console.error('Error downloading chat:', error);
      showStatus('Failed to download chat', true);
    }
  };

  const downloadResponse = async (session) => {
    try {
      const response = await axios.get(`/api/admin/sessions/${session.sessionId}/response`, {
        headers: { username, password }
      });
      
      const responseData = {
        stance: session.stance,
        botPersonality: session.botPersonality,
        finalResponse: response.data
      };

      ['json', 'csv', 'txt'].forEach(format => {
        downloadInFormat(responseData, `response_${session.sessionId}`, format);
      });
    } catch (error) {
      console.error('Error downloading response:', error);
      showStatus('Failed to download response', true);
    }
  };

  const downloadFullSession = async (session) => {
    try {
      const [chatResponse, finalResponse] = await Promise.all([
        axios.get(`/api/admin/sessions/${session.sessionId}/chat`, {
          headers: { username, password }
        }),
        axios.get(`/api/admin/sessions/${session.sessionId}/response`, {
          headers: { username, password }
        })
      ]);

      const fullSession = {
        ...session,
        chat: chatResponse.data,
        finalResponse: finalResponse.data
      };

      ['json', 'csv', 'txt'].forEach(format => {
        downloadInFormat(fullSession, `full_session_${session.sessionId}`, format);
      });
    } catch (error) {
      console.error('Error downloading full session:', error);
      showStatus('Failed to download full session', true);
    }
  };

  const downloadAllSessions = async () => {
    try {
      const fullSessions = await Promise.all(
        sessions.map(async (session) => {
          const [chatResponse, finalResponse] = await Promise.all([
            axios.get(`/api/admin/sessions/${session.sessionId}/chat`, {
              headers: { username, password }
            }),
            axios.get(`/api/admin/sessions/${session.sessionId}/response`, {
              headers: { username, password }
            })
          ]);
          
          return {
            ...session,
            chat: chatResponse.data,
            finalResponse: finalResponse.data
          };
        })
      );

      ['json', 'csv', 'txt'].forEach(format => {
        downloadInFormat(fullSessions, 'all_sessions', format);
      });
    } catch (error) {
      console.error('Error downloading all sessions:', error);
      showStatus('Failed to download all sessions', true);
    }
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
          <button
            onClick={downloadAllSessions}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Download All Sessions
          </button>
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
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                        <div className="py-1">
                          {[
                            { label: 'Full Session', fn: () => downloadFullSession(session) },
                            { label: 'Chat Only', fn: () => downloadChat(session) },
                            { label: 'Response Only', fn: () => downloadResponse(session) }
                          ].map((option) => (
                            <button
                              key={option.label}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                option.fn();
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;