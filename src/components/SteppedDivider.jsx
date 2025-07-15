import React from 'react';

const SteppedDivider = ({ 
  color = 'yellow-400',
  thickness = '3',
  stepHeight = '30',
  leftWidth = '200',
  rightWidth = '200',
  className = ''
}) => {
  // Helper function to get RGB values for colors
  const getColorRGB = (colorClass) => {
    const colorMap = {
      'yellow-400': '250, 204, 21',
      'blue-500': '59, 130, 246',
      'red-500': '239, 68, 68',
      'green-500': '34, 197, 94',
      'purple-500': '168, 85, 247',
      'pink-500': '236, 72, 153',
      'indigo-500': '99, 102, 241',
      'gray-500': '107, 114, 128',
      'orange-500': '249, 115, 22',
      'teal-500': '20, 184, 166',
      'cyan-500': '6, 182, 212',
      'lime-500': '132, 204, 22',
      'amber-500': '245, 158, 11',
      'emerald-500': '16, 185, 129',
      'violet-500': '139, 92, 246',
      'fuchsia-500': '217, 70, 239',
      'rose-500': '244, 63, 94',
      'sky-500': '14, 165, 233',
      'slate-500': '100, 116, 139'
    };
    return colorMap[colorClass] || colorMap['yellow-400'];
  };

  return (
    <div className={`relative ${className}`} style={{ height: `${parseInt(stepHeight) + 20}px` }}>
      <svg 
        width={parseInt(leftWidth) + parseInt(rightWidth) + 40} 
        height={parseInt(stepHeight) + 20}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="neonBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00cfff" />
            <stop offset="50%" stopColor="#00b8ff" />
            <stop offset="100%" stopColor="#007bff" />
          </linearGradient>
        </defs>
        <path
          d={`M 0 10 
              L ${leftWidth} 10 
              L ${parseInt(leftWidth) + 20} ${parseInt(stepHeight) + 10} 
              L ${parseInt(leftWidth) + parseInt(rightWidth) + 40} ${parseInt(stepHeight) + 10}`}
          stroke="url(#neonBlueGradient)"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default SteppedDivider;