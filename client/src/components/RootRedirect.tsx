import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const RootRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Generate a new UUID and navigate to it
    const newUuid = uuidv4();
    navigate(`/${newUuid}`);
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Generating new log page...
    </div>
  );
};

export default RootRedirect;