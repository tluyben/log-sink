import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LogPage from './components/LogPage';
import RootRedirect from './components/RootRedirect';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/:uuid" element={<LogPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
