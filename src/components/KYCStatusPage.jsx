import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import BackgroundBubbles from './BackgroundBubbles';
import BackgroundCircles from './BackgroundCircles';
import { FaArrowLeft } from 'react-icons/fa';

const STATUS = {
  NOT_SUBMITTED: {
    icon: '',
    text: 'Not Submitted',
    desc: 'Start your KYC to unlock rewards!',
    cardClass: 'status-not-submitted',
  },
  PENDING: {
    icon: '⏳',
    text: 'Pending Verification',
    desc: 'KYC under review. Please wait up to 24 hours.',
    cardClass: 'status-pending',
  },
  VERIFIED: {
    icon: '✅',
    text: 'Verified',
    desc: "You're verified! Withdrawals are now unlocked.",
    cardClass: 'status-verified',
  },
  REJECTED: {
    icon: '❌',
    text: 'Rejected',
    desc: 'There was an issue with your KYC.',
    cardClass: 'status-rejected',
  },
};

const mockUser = {
  name: 'Amit S.',
  pan: 'ABCDE**1F',
  submitted: '2024-06-01',
  verified: '2024-06-02',
  rejectionReason: 'Document blurred',
};

const Popup = ({ title, message, onClose, inputMode = false, onInputSubmit }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onInputSubmit?.(inputValue);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-xl p-6 relative w-[90%] max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-2 right-3 text-white text-xl font-bold" onClick={onClose}>×</button>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm mb-2">{message}</p>
        {inputMode && (
          <div className="mt-4">
            <input
              type="text"
              className="w-full px-3 py-2 border border-white/30 bg-white/10 text-white rounded-md placeholder-white/70 focus:outline-none"
              placeholder="Enter PAN"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Submit PAN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const KYCStatusPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('NOT_SUBMITTED');
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState({ title: '', message: '', inputMode: false });
  const fileInputRef = useRef(null);

  const handleSubmit = () => setStatus('PENDING');
  const handleResubmit = () => setStatus('PENDING');

  const statusObj = STATUS[status];

  const handleStepClick = (step) => {
    if (step === 'document' || step === 'selfie') {
      fileInputRef.current.click();
    } else if (step === 'pan') {
      setPopupContent({
        title: 'Enter PAN',
        message: 'Enter your PAN details accurately.',
        inputMode: true,
      });
      setShowPopup(true);
    }
  };

  const handlePANInput = (value) => {
    alert(`PAN submitted: ${value}`);
  };

  return (
    <div
      className="min-h-screen w-full text-white overflow-hidden relative"
      style={{
        background: 'linear-gradient(to bottom, #0A2472 0%, #0D47A1 45%, #1565C0 100%)',
      }}
    >
      <BackgroundCircles />
      <BackgroundBubbles />

      <div className="relative z-10 px-4 pt-16 pb-24">
        {/* Back Button and Title */}
        <div className="flex items-center justify-center gap-3 mb-6 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 text-white text-2xl px-2"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-xl font-semibold text-center">KYC Status</h1>
        </div>

        {/* Glassmorphic Status Card */}
        <div className={`rounded-xl p-6 text-center text-white backdrop-blur-md bg-white/10 border border-white/20 shadow-lg mb-6 ${statusObj.cardClass}`}>
          <div className="text-4xl mb-2">{statusObj.icon}</div>
          <div className="text-lg font-semibold">{statusObj.text}</div>
          <div className="text-sm text-white/70 mt-1">{statusObj.desc}</div>
        </div>

        {status === 'NOT_SUBMITTED' && (
          <div className="text-center space-y-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg" onClick={handleSubmit}>
              Submit KYC
            </button>
            <ul className="space-y-3 text-left">
              {['document', 'selfie', 'pan'].map((step) => (
                <li key={step}>
                  <button
                    onClick={() => handleStepClick(step)}
                    className="w-full backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-md hover:bg-white/20"
                  >
                    {step === 'document' ? 'Upload ID' : step === 'selfie' ? 'Take Selfie' : 'Enter PAN'}
                  </button>
                </li>
              ))}
            </ul>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" />
          </div>
        )}

        {status === 'PENDING' && (
          <div className="text-center mt-6">
            <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full w-12 h-12 mx-auto mb-3"></div>
            <p>KYC under review. Please wait up to 24 hours.</p>
          </div>
        )}

        {status === 'VERIFIED' && (
          <div className="text-center mt-6 text-green-400">
            <div className="text-3xl">✅</div>
            <p className="font-semibold mt-2">You're Verified! Withdrawals are unlocked.</p>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="text-center mt-6 text-red-400">
            <div className="text-3xl">❌</div>
            <p className="font-semibold mt-2">KYC Rejected: {mockUser.rejectionReason}</p>
            <button onClick={handleResubmit} className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">
              Resubmit KYC
            </button>
          </div>
        )}

        {(status === 'VERIFIED' || status === 'REJECTED' || status === 'PENDING') && (
          <div className="mt-6 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-lg p-4 shadow-sm space-y-1">
            <div><b>Name:</b> {mockUser.name}</div>
            <div><b>PAN:</b> {mockUser.pan}</div>
            <div><b>Submitted:</b> {mockUser.submitted}</div>
            {status === 'VERIFIED' && <div><b>Verified:</b> {mockUser.verified}</div>}
          </div>
        )}
      </div>

      {/* Footer Support Link */}
      <footer className="text-center text-sm text-white/90 py-4 z-10 relative">
        Need help?{" "}
        <span className="underline cursor-pointer" onClick={() => navigate("/supports")}>
          Contact Support
        </span>
      </footer>

      {/* Popup */}
      {showPopup && (
        <Popup
          title={popupContent.title}
          message={popupContent.message}
          inputMode={popupContent.inputMode}
          onClose={() => setShowPopup(false)}
          onInputSubmit={handlePANInput}
        />
      )}

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <Navbar />
      </div>
    </div>
  );
};

export default KYCStatusPage;