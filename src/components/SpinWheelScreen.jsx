import React, { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import { toast } from 'react-toastify';

const COLORS = [
  '#800080', '#FF1493', '#FFB6C1', '#FF0000',
  '#FF7F00', '#FFD700', '#90EE90', '#008000',
  '#00FFFF', '#87CEFA', '#0000FF', '#4B0082',
];

const SEGMENT_COUNT = COLORS.length;
const SEGMENT_DEGREE = 360 / SEGMENT_COUNT;
const LABELS = Array.from({ length: SEGMENT_COUNT }, (_, i) => `${(i + 1) * 50}`);

function getConicGradient() {
  let currentDeg = 0;
  return `conic-gradient(${COLORS.map((clr) => {
    const segment = `${clr} ${currentDeg}deg ${currentDeg + SEGMENT_DEGREE}deg`;
    currentDeg += SEGMENT_DEGREE;
    return segment;
  }).join(', ')})`;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const SPINS_KEY = 'spinWheel_spinsLeft';
const TIMER_KEY = 'spinWheel_timer';
const LAST_TIMESTAMP_KEY = 'spinWheel_lastTimestamp';

const SpinWheelScreen = ({ onClose, isVisible, initialSpins = 5 }) => {
  const REFILL_TIME = 120;
  const [isSpinning, setIsSpinning] = useState(false);

  const [spinsLeft, setSpinsLeft] = useState(() => {
    const saved = localStorage.getItem(SPINS_KEY);
    return saved !== null ? Number(saved) : initialSpins;
  });

  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem(TIMER_KEY);
    return saved !== null ? Number(saved) : REFILL_TIME;
  });

  const [lastTimestamp, setLastTimestamp] = useState(() => {
    const saved = localStorage.getItem(LAST_TIMESTAMP_KEY);
    return saved !== null ? Number(saved) : Date.now();
  });

  const [rotation, setRotation] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState('');
  const timerId = useRef(null);
  const refilled = useRef(false);

  useEffect(() => {
    setLastTimestamp(Date.now());
  }, []);

  useEffect(() => {
    localStorage.setItem(SPINS_KEY, spinsLeft.toString());
  }, [spinsLeft]);

  useEffect(() => {
    localStorage.setItem(TIMER_KEY, timer.toString());
  }, [timer]);

  useEffect(() => {
    localStorage.setItem(LAST_TIMESTAMP_KEY, lastTimestamp.toString());
  }, [lastTimestamp]);

  const spin = async () => {
    if (isSpinning || spinsLeft === 0) return;

    const randomOffset = Math.random() * 360;
    const fullSpins = 5;
    const totalRotation = fullSpins * 360 + randomOffset;
    const finalRotation = rotation + totalRotation;

    setRotation(finalRotation);
    setIsSpinning(true);

    setTimeout(async () => {
      const finalAngle = finalRotation % 360;
      const pointerAngle = (360 - finalAngle + SEGMENT_DEGREE / 2) % 360;
      const index = Math.floor(pointerAngle / SEGMENT_DEGREE) % SEGMENT_COUNT;
      const correctedIndex = (index - 4 + SEGMENT_COUNT) % SEGMENT_COUNT;
      const coinsWon = parseInt(LABELS[correctedIndex], 10);

      try {
        // Register coin win in backend
        await authService.spinWheelWin(coinsWon);
        // Refresh user profile (wallet, history, etc.)
        await authService.getCurrentUserProfile();
        setIsSpinning(false);
        setSpinsLeft((s) => Math.max(0, s - 1));
        setCurrentReward(`${LABELS[correctedIndex]} Coins`);

         //window.dispatchEvent(new CustomEvent("play-sound", { detail: "coin" })); //another sound coin effect.
        window.dispatchEvent(new CustomEvent("play-sound", { detail: "win" })); // ✅ Play win sound

        setShowReward(true);
        setLastTimestamp(Date.now());
        toast.success(`You won ${coinsWon} coins!`);
      } catch (error) {
        setIsSpinning(false);
        toast.error('Failed to register coin win. Please try again.');
      }
    }, 3500);
  };

  useEffect(() => {
    if (timerId.current) clearInterval(timerId.current);

    timerId.current = setInterval(() => {
      setTimer((prev) => {
        if (spinsLeft >= initialSpins) {
          refilled.current = false;
          return REFILL_TIME;
        }

        if (prev <= 1) {
          if (!refilled.current) {
            setSpinsLeft((s) => Math.min(initialSpins, s + 1));
            refilled.current = true;
          }
          return REFILL_TIME;
        }

        refilled.current = false;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId.current);
  }, [spinsLeft]);

  const handleCloseReward = () => {
    setShowReward(false);
    setCurrentReward('');
  };

  if (!isVisible) return null;

  const wheelSize = 'min(70vw, 320px)';

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4" onClick={onClose}>
        <div className="relative w-full max-w-[400px] bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-2xl font-extrabold text-[#FFD700] text-center mb-6">Daily Spin Wheel</h2>

          <div className="relative flex items-center justify-center mb-8" style={{ width: wheelSize, height: wheelSize }}>
            {/* Upward Arrow */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-white z-10" />

            <div
              className="rounded-full transition-transform duration-[3500ms] ease-out relative"
              style={{
                width: '100%',
                height: '100%',
                background: getConicGradient(),
                transform: `rotate(${rotation + SEGMENT_DEGREE / 2}deg)`,
              }}
            >
              {LABELS.map((label, index) => {
                const angle = index * SEGMENT_DEGREE + SEGMENT_DEGREE / 2;
                const radius = 44;
                const rad = (angle * Math.PI) / 180;
                const x = 50 + radius * Math.cos(rad);
                const y = 50 + radius * Math.sin(rad);
                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    }}
                  >
                    <div
                      className="text-white text-[13px] font-bold"
                      style={{ transform: `rotate(${-angle}deg)` }}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}

              {/* Center Black Circle */}
              <div className="absolute left-1/2 top-1/2 w-6 h-6 bg-black rounded-full z-20" style={{ transform: 'translate(-50%, -50%)' }} />
            </div>
          </div>

          <button
            onClick={spin}
            disabled={isSpinning || spinsLeft === 0}
            className={`w-4/5 h-12 rounded-lg font-bold text-white text-lg transition-opacity ${
              isSpinning || spinsLeft === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: '#DC2626' }}
          >
            {spinsLeft > 0 ? `Spin (${spinsLeft} left)` : 'No Spins Left'}
          </button>

          {spinsLeft < initialSpins && (
            <p className="mt-2 text-yellow-300 font-semibold text-sm select-none">
              Next spin in: {formatTime(timer)}
            </p>
          )}

          <button onClick={onClose} className="absolute top-2 right-3 text-gray-300 text-xl">×</button>
        </div>
      </div>

      {showReward && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4" onClick={handleCloseReward}>
          <div
            className="relative w-full max-w-xs rounded-2xl p-6 flex flex-col items-center bg-white/10 backdrop-blur-lg border border-yellow-400 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 0 15px 5px rgba(255, 215, 0, 0.5)' }}
          >
            <h3 className="text-2xl font-extrabold text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)] mb-2">Reward Unlocked!</h3>
            <p className="text-white text-base mb-6 text-center drop-shadow-md font-semibold">Congratulations! You have won:</p>
            <p className="text-3xl font-bold text-yellow-300 mb-8 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)] animate-pulse">{currentReward}</p>
            <button onClick={handleCloseReward} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-extrabold text-lg px-10 py-3 rounded-full shadow-lg transition-colors duration-300">OK</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SpinWheelScreen;
