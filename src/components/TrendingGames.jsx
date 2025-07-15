import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import controllerIcon from '../assets/game.png';
import flappyball from '../assets/Flappy-Ball.png';
import colorsmash from '../assets/colorsmash.png';
import matchmerge from '../assets/MatchMerge.png';
import eggcatcher from '../assets/EggCatcher.png';
import gravityhop from '../assets/GravityHop.png';
import borderBackground from '../assets/Border1.png';

const TrendingGames = () => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const gridRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(0);
  const [hasSecondRow, setHasSecondRow] = useState(false);

  const games = [
    { id: 1, name: 'Flappy Ball', path: '/flappyball', image: flappyball },
    { id: 2, name: 'Color Smash', path: '/colorsmash', image: colorsmash },
    { id: 3, name: 'Match Merge', path: '/matchmerge', image: matchmerge },
    { id: 4, name: 'Egg Catcher', path: '/eggcatcher', image: eggcatcher },
    { id: 5, name: 'Gravity Hop', path: '/gravityhop', image: gravityhop },
  ];

  useLayoutEffect(() => {
    const checkRows = () => {
      const grid = gridRef.current;
      if (!grid) return;

      const cards = Array.from(grid.children);
      if (cards.length < 2) return;

      const firstRowTop = cards[0].getBoundingClientRect().top;
      let secondRowTop = 0;

      for (let i = 1; i < cards.length; i++) {
        const cardTop = cards[i].getBoundingClientRect().top;
        if (cardTop > firstRowTop + 5) {
          secondRowTop = cardTop;
          break;
        }
      }

      if (secondRowTop) {
        const rowHeight = secondRowTop - firstRowTop;
        setRowHeight(rowHeight);
        setHasSecondRow(true);
      } else {
        setRowHeight(0);
        setHasSecondRow(false);
      }
    };

    checkRows();
    window.addEventListener('resize', checkRows);
    return () => window.removeEventListener('resize', checkRows);
  }, [games]);

  return (
    <section
      className="w-full bg-no-repeat bg-top relative z-0"
      style={{
        backgroundImage: `url(${borderBackground})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top',
        backgroundSize: '100% auto',
      }}
    >
      <div
        className="max-w-full mx-auto mt-3"
        style={{
          paddingTop: 'clamp(24px, 5vw, 56px)',
          paddingBottom: 'clamp(20px, 3.5vw, 36px)',
          paddingLeft: 'clamp(20px, 5vw, 60px)',
          paddingRight: 'clamp(20px, 5vw, 60px)',
        }}
      >
        <div className="max-w-screen-lg mx-auto">
          {/* Header */}
          <div className="flex justify-center items-center gap-2 mb-3">
            <img src={controllerIcon} alt="icon" className="w-5 h-5" />
            <h2
              className="font-bold text-white font-orbitron italic leading-tight"
              style={{
                fontSize: 'clamp(12px, 3vw, 24px)',
              }}
            >
              Trending Games
            </h2>
          </div>

          {/* Game Grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-4 sm:grid-cols-5 gap-2 transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              maxHeight: showAll || rowHeight === 0 ? '1000px' : `${rowHeight}px`,
            }}
          >
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => navigate(game.path)}
                className="bg-white/10 border border-white/20 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-full aspect-square">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* See More / See Less */}
          {hasSecondRow && (
            <div className="text-center leading-none mt-1">
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="text-white text-[10px] underline hover:text-gray-300 transition p-0 m-0"
              >
                {showAll ? 'See Less' : 'See More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingGames;
