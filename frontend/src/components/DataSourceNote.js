import React from 'react';
import './DataSourceNote.css';

function DataSourceNote({ compact = false }) {
  return (
    <div className={`data-source-note ${compact ? 'compact' : ''}`}>
      Data sourced from Yahoo Finance and configured market news providers (with resilient fallback data).
    </div>
  );
}

export default DataSourceNote;
