// frontend/src/components/common/Spinner.jsx
import React from 'react';
import './Spinner.css';

export const Spinner = ({ message }) => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      {message && <p>{message}</p>}
    </div>
  );
};
