import React, { useState } from 'react';

const CyberGameCard = () => {
  const [expanded, setExpanded] = useState(false);

  // Sample game icons - you can replace these with actual game icons
  const gameIcons = [
    { id: 1, name: "Cyber Runner", icon: "🎮" },
    { id: 2, name: "Neon Strike", icon: "⚡" },
    { id: 3, name: "Matrix Code", icon: "🔮" },
    { id: 4, name: "Quantum War", icon: "🚀" },
    { id: 5, name: "Digital Ghost", icon: "👻" },
    { id: 6, name: "Hack Master", icon: "💻" },
    { id: 7, name: "Cyber Punk", icon: "🤖" },
    { id: 8, name: "Data Storm", icon: "⚡" },
    { id: 9, name: "Neo City", icon: "🌆" },
    { id: 10, name: "Virtual Rush", icon: "🎯" },
    { id: 11, name: "Code Breaker", icon: "🔓" },
    { id: 12, name: "Pixel Wars", icon: "🎪" }
  ];

  const visibleIcons = expanded ? gameIcons : gameIcons.slice(0, 4);

  const cardClipPath = `polygon(
    0 0,
    100% 0,
    100% 85%,
    95% 100%,
    5% 100%,
    0 85%
  )`;

  const wrapperClipPath = `polygon(
    0 0,
    100% 0,
    100% 85%,
    95% 100%,
    5% 100%,
    0 85%
  )`;

  const topShapeClipPath = `polygon(15% 0, 85% 0, 90% 15%, 100% 15%, 100% 25%, 0 25%, 0 15%, 10% 15%)`;

  const gradientBackground = `linear-gradient(
    135deg,
    #2980b9 0%,
    #6dd5fa 50%,
    #ffffff 100%
  )`;

  const topShapeGradient = `linear-gradient(
    90deg,
    #2980b9 0%,
    #6dd5fa 50%,
    #ffffff 100%
  )`;

  const cardBackground = `
    linear-gradient(rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.8) 100%),
    repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.03) 0px,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px,
      transparent 3px
    )
  `;

  return (
    <div className="bg-black min-h-screen flex items-center justify-center p-4">
      <div className="relative inline-block w-full max-w-md">
        {/* Card wrapper pseudo-element - much thinner border */}
        <div 
          className="absolute -z-20 top-0 bottom-0 h-full w-full"
          style={{
            clipPath: wrapperClipPath,
            background: gradientBackground,
            left: '-1px',
            right: '-1px',
            top: '-1px',
            bottom: '-1px'
          }}
        />
        
        {/* Main card */}
        <div 
          className="relative overflow-visible min-h-64 w-full z-40 flex flex-col transition-all duration-300 hover:scale-[1.02]"
          style={{
            clipPath: cardClipPath,
            background: cardBackground
          }}
        >
          {/* Top decorative shape - thinner */}
          <div 
            className="absolute top-0 w-full h-8 z-50 pointer-events-none"
            style={{
              background: topShapeGradient,
              clipPath: topShapeClipPath,
              left: '0px'
            }}
          />

          {/* Header section */}
          <div className="pt-6 px-6 text-center mb-4">
            <h2 
              className="text-lg font-mono font-bold mb-1"
              style={{
                color: '#ffeaff',
                fontFamily: "'Share Tech Mono', monospace",
                textShadow: `
                  0 0 3px rgba(255, 192, 255, 0.3),
                  0 0 6px rgba(170, 100, 255, 0.2)
                `
              }}
            >
              CYBER GAMES
            </h2>
            <div 
              className="h-px w-16 mx-auto opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent, #6dd5fa, transparent)'
              }}
            />
          </div>

          {/* Game icons grid */}
          <div className="px-6 flex-1">
            <div className={`grid gap-4 transition-all duration-500 ${expanded ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4'}`}>
              {visibleIcons.map((game) => (
                <div 
                  key={game.id}
                  className="relative group cursor-pointer"
                >
                  {/* Icon container */}
                  <div 
                    className="aspect-square flex items-center justify-center rounded-lg border transition-all duration-300 hover:scale-110 group-hover:shadow-lg"
                    style={{
                      background: `
                        linear-gradient(135deg, rgba(41, 128, 185, 0.1), rgba(109, 213, 250, 0.1)),
                        rgba(0, 0, 0, 0.3)
                      `,
                      borderColor: '#2980b9',
                      borderWidth: '1px'
                    }}
                  >
                    <span className="text-2xl sm:text-3xl">{game.icon}</span>
                  </div>
                  
                  {/* Game name tooltip */}
                  <div 
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      color: '#6dd5fa',
                      fontSize: '10px',
                      fontFamily: "'Share Tech Mono', monospace",
                      textShadow: '0 0 2px rgba(109, 213, 250, 0.5)'
                    }}
                  >
                    {game.name}
                  </div>
                </div>
              ))}
            </div>

            {/* See more button */}
            <div className="mt-6 mb-4 text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="px-4 py-1.5 font-mono text-xs transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `
                    linear-gradient(135deg, rgba(41, 128, 185, 0.2), rgba(109, 213, 250, 0.2)),
                    rgba(0, 0, 0, 0.5)
                  `,
                  border: '1px solid #2980b9',
                  color: '#ffeaff',
                  fontFamily: "'Share Tech Mono', monospace",
                  textShadow: '0 0 3px rgba(255, 192, 255, 0.3)',
                  clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)'
                }}
              >
                {expanded ? 'SHOW LESS' : 'SEE MORE'}
              </button>
            </div>
          </div>

          {/* Subtle side glow effects - much thinner */}
          <div 
            className="absolute left-0 top-8 bottom-8 w-0.5 z-10 opacity-50"
            style={{
              background: 'linear-gradient(to bottom, transparent, #2980b9, transparent)',
            }}
          />
          <div 
            className="absolute right-0 top-8 bottom-8 w-0.5 z-10 opacity-50"
            style={{
              background: 'linear-gradient(to bottom, transparent, #2980b9, transparent)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CyberGameCard;