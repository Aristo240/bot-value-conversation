import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        username,
        password
      });
      setToken(response.data.token);
      localStorage.setItem('adminToken', response.data.token);
      fetchSessions();
    } catch (error) {
      alert('Login failed');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await axios.delete(`${API_URL}/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const handleExport = async (sessionId) => {
    try {
      const response = await axios.post(
        `${API_URL}/sessions/${sessionId}/export`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-${sessionId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting session:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/sessions/export-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'all-sessions.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting all sessions:', error);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
          <input
            type="text"
            placeholder="Username"
            className="w-full mb-4 p-2 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleExportAll}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export All Data
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => (
            <div key={session.sessionId} className="border p-4 rounded-lg bg-white shadow">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-bold">Session ID: {session.sessionId}</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => handleExport(session.sessionId)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleDelete(session.sessionId)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold">Stance:</p>
                  <p>{session.stance}</p>
                </div>
                <div>
                  <p className="font-semibold">Bot Personality:</p>
                  <p>{session.botPersonality}</p>
                </div>
                <div>
                  <p className="font-semibold">Date:</p>
                  <p>{new Date(session.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Conversation:</h3>
                <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                  {session.chat.map((msg) => (
                    <div key={msg.messageId} className="mb-2">
                      <span className={`font-semibold ${msg.sender === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                        {msg.sender}:
                      </span>
                      <span className="ml-2">{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {session.finalResponse && (
                <div>
                  <h3 className="font-semibold mb-2">Final Response:</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p>{session.finalResponse.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;