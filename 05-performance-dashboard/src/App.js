import React from 'react';
import PerformanceChart from './PerformanceChart';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Performance Benchmarks</h1>
      </header>
      <PerformanceChart />
    </div>
  );
}

export default App;