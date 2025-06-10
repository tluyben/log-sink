import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ContentDisplay from './ContentDisplay';
import './LogPage.css';

interface LogEntry {
  id: number;
  created: string;
  content: string;
}

const LogPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [bearer, setBearer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const currentUrl = `${window.location.protocol}//${window.location.host}/${uuid}`;

  const generateBearer = useCallback(async () => {
    try {
      const response = await fetch(`/${uuid}/bearer`, {
        method: 'POST',
      });
      const data = await response.json();
      
      setBearer(data.bearer);
      setIsOwner(true);
      localStorage.setItem(`bearer_${uuid}`, data.bearer);
    } catch (error) {
      console.error('Error generating bearer:', error);
    }
  }, [uuid]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/${uuid}/content`);
      const data = await response.json();
      setLogs(data.content || []);
    } catch (error) {
      console.error('Error loading content:', error);
    }
    setLoading(false);
  }, [uuid]);

  useEffect(() => {
    if (!uuid) return;

    // Check if user is owner
    const storedBearer = localStorage.getItem(`bearer_${uuid}`);
    if (storedBearer) {
      setBearer(storedBearer);
      setIsOwner(true);
    } else {
      // Generate new bearer for owner
      generateBearer();
    }

    // Load initial content
    loadContent();

    // Setup polling for new content
    setIsPolling(true);
    const interval = setInterval(loadContent, 2000);
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [uuid, generateBearer, loadContent]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deletePage = async () => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;

    try {
      await fetch(`/${uuid}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${bearer}`
        },
      });
      
      localStorage.removeItem(`bearer_${uuid}`);
      setLogs([]);
      alert('Page deleted successfully');
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  return (
    <div className="log-page">
      <div className="top-bar">
        <div className="url-section">
          <span className="url">{currentUrl}</span>
          <button 
            className="copy-btn" 
            onClick={() => copyToClipboard(currentUrl)}
            title="Copy URL"
          >
            📋
          </button>
        </div>
        
        {isOwner && (
          <div className="owner-section">
            <span className="bearer-label">Bearer:</span>
            <span className="bearer">{bearer.substring(0, 20)}...</span>
            <button 
              className="copy-btn" 
              onClick={() => copyToClipboard(bearer)}
              title="Copy Bearer Token"
            >
              📋
            </button>
            <button 
              className="delete-btn" 
              onClick={deletePage}
              title="Delete Page"
            >
              🗑️
            </button>
          </div>
        )}
        
        <div className="spinner-section">
          {isPolling && (
            <div className="polling-indicator">
              <div className="spinner">🔄</div>
              <span className="polling-text">Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="content-area">
        {logs.length === 0 ? (
          <div className="empty-state">
            No logs yet. Send a POST request to this endpoint with your bearer token.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-entry">
              <div className="log-header">
                <span className="log-id">#{log.id}</span>
                <span className="log-time">{new Date(log.created).toLocaleString()}</span>
              </div>
              <ContentDisplay content={log.content} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPage;