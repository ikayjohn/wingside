"use client";

import React, { useState } from 'react';

interface ConvertPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePoints: number;
  conversionRate?: number; // Naira per point (default: 10, meaning 1 point = ₦10)
}

export default function ConvertPointsModal({
  isOpen,
  onClose,
  availablePoints,
  conversionRate = 10 // 1 point = ₦10
}: ConvertPointsModalProps) {
  const [pointsToConvert, setPointsToConvert] = useState<string>('');

  if (!isOpen) return null;

  const pointsValue = parseInt(pointsToConvert) || 0;
  const cashValue = pointsValue * conversionRate; // 1 point = ₦10
  const maxConvertiblePoints = availablePoints;
  const maxConvertibleCash = maxConvertiblePoints * conversionRate;
  const minPoints = 100;
  const canConvert = pointsValue >= minPoints && pointsValue <= maxConvertiblePoints;

  const handlePercentageClick = (percentage: number) => {
    const points = Math.floor((maxConvertiblePoints * percentage) / 100);
    setPointsToConvert(points.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value === '' || parseInt(value) <= maxConvertiblePoints) {
      setPointsToConvert(value);
    }
  };

  const handleConvert = async () => {
    if (!canConvert) return;

    try {
      const response = await fetch('/api/points/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointsValue })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Conversion failed');
        return;
      }

      alert(`✅ Converted ${pointsValue} points to ₦${cashValue}`);
      onClose();
      window.location.reload(); // Refresh to show updated balance
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Failed to convert points. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container convert-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="convert-modal-header">
          <div className="convert-modal-header-content">
            <div className="convert-modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                <path d="m15 5 4 4"></path>
              </svg>
            </div>
            <div>
              <h2 className="convert-modal-title">Convert Points</h2>
              <p className="convert-modal-subtitle">Transform points into cash</p>
            </div>
          </div>
          <button className="convert-modal-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="convert-modal-body">

          {/* Rate Info */}
          <div className="convert-rate-banner">
            <h3 className="convert-rate-value">1 Point = ₦{conversionRate}</h3>
            <p className="convert-rate-max">
              You can convert up to {maxConvertiblePoints.toLocaleString()} points (₦{maxConvertibleCash.toLocaleString()})
            </p>
          </div>

          {/* Points Input */}
          <div className="convert-input-section">
            <label className="convert-label">Points to Convert</label>
            <div className="convert-input-wrapper">
              <input
                type="text"
                value={pointsToConvert}
                onChange={handleInputChange}
                placeholder="Enter points to convert"
                className="convert-input"
              />
              <div className="convert-input-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>pts</span>
              </div>
            </div>
            <p className="convert-available">Available point balance: {availablePoints.toLocaleString()}</p>
          </div>

          {/* Percentage Buttons */}
          <div className="convert-percentage-buttons">
            <button
              className="convert-percentage-btn"
              onClick={() => handlePercentageClick(25)}
            >
              25%
            </button>
            <button
              className="convert-percentage-btn"
              onClick={() => handlePercentageClick(50)}
            >
              50%
            </button>
            <button
              className="convert-percentage-btn"
              onClick={() => handlePercentageClick(100)}
            >
              All
            </button>
          </div>

          {/* Convert Button */}
          <button
            className={`convert-submit-btn ${canConvert ? 'active' : ''}`}
            onClick={handleConvert}
            disabled={!canConvert}
          >
            {canConvert
              ? `Convert ${pointsValue.toLocaleString()} points to ₦${cashValue.toLocaleString()}`
              : `Minimum ${minPoints} points required`
            }
          </button>

          {/* Conversion Details */}
          <div className="convert-details">
            <h4 className="convert-details-title">Conversion Details</h4>
            <div className="convert-details-grid">
              <div className="convert-detail-item">
                <span className="convert-detail-label">Processing time:</span>
                <span className="convert-detail-value">Instant</span>
              </div>
              <div className="convert-detail-item">
                <span className="convert-detail-label">Conversion fee:</span>
                <span className="convert-detail-value convert-detail-free">Free</span>
              </div>
              <div className="convert-detail-item">
                <span className="convert-detail-label">Minimum conversion:</span>
                <span className="convert-detail-value">{minPoints} points</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
