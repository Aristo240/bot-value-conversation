import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    }
  };

  const deleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await axios.delete(`/api/admin/sessions/${sessionId}`, {
          data: { username, password }
        });
        fetchSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const downloadChat = async (sessionId) => {
    try {
      const response = await axios.get(`/api/admin/sessions/${sessionId}/chat`, {
        data: { username, password }
      });
      downloadJson(response.data, `chat_${sessionId}.json`);
    } catch (error) {
      console.error('Error downloading chat:', error);
    }
  };

  const downloadResponse = async (sessionId) => {
    try {
      const response = await axios.get(`/api/admin/sessions/${sessionId}/response`, {
        data: { username, password }
      });
      downloadJson(response.data, `response_${sessionId}.json`);
    } catch (error) {
      console.error('Error downloading response:', error);
    }
  };

  const downloadFullSession = async (sessionId) => {
    try {
      const session = sessions.find(s => s.sessionId === sessionId);
      downloadJson(session, `full_session_${sessionId}.json`);
    } catch (error) {
      console.error('Error downloading session:', error);
    }
  };

  const downloadAllSessions = () => {
    downloadJson(sessions, 'all_sessions.json');
  };

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  <button
                    onClick={() => downloadFullSession(session.sessionId)}
                    className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
                  >
                    Download Full
                  </button>
                  <button
                    onClick={() => downloadChat(session.sessionId)}
                    className="bg-purple-500 text-white py-1 px-3 rounded hover:bg-purple-600"
                  >
                    Download Chat
                  </button>
                  <button
                    onClick={() => downloadResponse(session.sessionId)}
                    className="bg-indigo-500 text-white py-1 px-3 rounded hover:bg-indigo-600"
                  >
                    Download Response
                  </button>
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
                      <span className="font-semibold">{msg.sender}: </span>
                      {msg.text}
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