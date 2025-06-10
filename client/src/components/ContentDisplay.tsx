import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';

interface ContentDisplayProps {
  content: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content }) => {
  const [htmlMode, setHtmlMode] = useState<'rendered' | 'source'>('rendered');
  const [jsonExpanded, setJsonExpanded] = useState<{ [key: string]: boolean }>({});

  // Ensure content is always a string
  const contentString = typeof content === 'string' ? content : String(content);

  const detectContentType = (content: string): 'json' | 'html' | 'markdown' | 'text' => {
    const trimmed = content.trim();
    
    // Check for JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch (e) {
        //console.log('Failed to parse as JSON:', e, trimmed.substring(0, 100) + '...');
      }
    }
    
    // Also check if it looks like serialized JSON (quoted strings that contain JSON)
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
      try {
        const unquoted = JSON.parse(trimmed); // This removes the outer quotes
        if (typeof unquoted === 'string') {
          const innerTrimmed = unquoted.trim();
          if ((innerTrimmed.startsWith('{') && innerTrimmed.endsWith('}')) || 
              (innerTrimmed.startsWith('[') && innerTrimmed.endsWith(']'))) {
            try {
              JSON.parse(innerTrimmed);
              console.log('Detected nested JSON content:', innerTrimmed.substring(0, 100) + '...');
              return 'json';
            } catch (e) {
              // Not valid nested JSON
            }
          }
        }
      } catch (e) {
        // Not valid quoted string
      }
    }
    
    // Check for HTML
    if (trimmed.startsWith('<') && trimmed.includes('>')) {
      return 'html';
    }
    
    // Check for Markdown indicators
    if (trimmed.includes('# ') || trimmed.includes('## ') || 
        trimmed.includes('**') || trimmed.includes('```') ||
        (trimmed.includes('[') && trimmed.includes(']('))) {
      return 'markdown';
    }
    
    return 'text';
  };

  const renderJsonTree = (obj: any, path: string = '', depth: number = 0): React.ReactNode => {
    if (obj === null) return <span className="json-null">null</span>;
    if (typeof obj === 'boolean') return <span className="json-boolean">{obj.toString()}</span>;
    if (typeof obj === 'number') return <span className="json-number">{obj}</span>;
    if (typeof obj === 'string') return <span className="json-string">"{obj}"</span>;
    
    if (Array.isArray(obj)) {
      const isExpanded = jsonExpanded[path] !== false;
      return (
        <div className="json-array">
          <span 
            className="json-toggle" 
            onClick={() => setJsonExpanded(prev => ({ ...prev, [path]: !isExpanded }))}
          >
            {isExpanded ? '▼' : '▶'} [{obj.length}]
          </span>
          {isExpanded && (
            <div className="json-content" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
              {obj.map((item, index) => (
                <div key={index} className="json-item">
                  <span className="json-key">{index}:</span>
                  {renderJsonTree(item, `${path}[${index}]`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      const isExpanded = jsonExpanded[path] !== false;
      return (
        <div className="json-object">
          <span 
            className="json-toggle" 
            onClick={() => setJsonExpanded(prev => ({ ...prev, [path]: !isExpanded }))}
          >
            {isExpanded ? '▼' : '▶'} {`{${keys.length}}`}
          </span>
          {isExpanded && (
            <div className="json-content" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
              {keys.map(key => (
                <div key={key} className="json-item">
                  <span className="json-key">"{key}":</span>
                  {renderJsonTree(obj[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <span>{String(obj)}</span>;
  };

  const contentType = detectContentType(contentString);

  const renderContent = () => {
    switch (contentType) {
      case 'json':
        try {
          let jsonData;
          const trimmed = contentString.trim();
          
          // Handle regular JSON
          if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
              (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            jsonData = JSON.parse(trimmed);
          }
          // Handle nested JSON (quoted JSON string)
          else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            const unquoted = JSON.parse(trimmed);
            if (typeof unquoted === 'string') {
              jsonData = JSON.parse(unquoted);
            } else {
              jsonData = unquoted;
            }
          } else {
            jsonData = JSON.parse(contentString);
          }
          
          return (
            <div className="content-json">
              <div className="content-header">
                <span className="content-type-badge">JSON</span>
              </div>
              <div className="json-tree">
                {renderJsonTree(jsonData)}
              </div>
            </div>
          );
        } catch (e) {
          console.error('Error parsing JSON for display:', e);
          return <pre className="content-text">{contentString}</pre>;
        }
      
      case 'html':
        return (
          <div className="content-html">
            <div className="content-header">
              <span className="content-type-badge">HTML</span>
              <button 
                className="mode-toggle"
                onClick={() => setHtmlMode(htmlMode === 'rendered' ? 'source' : 'rendered')}
              >
                {htmlMode === 'rendered' ? 'Show Source' : 'Show Rendered'}
              </button>
            </div>
            {htmlMode === 'rendered' ? (
              <div 
                className="html-rendered"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentString) }}
              />
            ) : (
              <SyntaxHighlighter language="html" style={tomorrow}>
                {contentString}
              </SyntaxHighlighter>
            )}
          </div>
        );
      
      case 'markdown':
        return (
          <div className="content-markdown">
            <div className="content-header">
              <span className="content-type-badge">Markdown</span>
            </div>
            <ReactMarkdown>{contentString}</ReactMarkdown>
          </div>
        );
      
      default:
        return (
          <div className="content-text">
            <div className="content-header">
              <span className="content-type-badge">Text</span>
            </div>
            <pre>{contentString}</pre>
          </div>
        );
    }
  };

  return <div className="content-display">{renderContent()}</div>;
};

export default ContentDisplay;
