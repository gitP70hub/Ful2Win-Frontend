import React from 'react';
import { useNavigate } from 'react-router-dom';
import controllerIcon from '../assets/controller.png';
import poker from '../assets/poker.png';
import ludo from '../assets/ludo.png';
import carrom from '../assets/carrom.png';
import borderBackground from '../assets/Border.png';

const PopularGames = () => {
  const navigate = useNavigate();

  const games = [
    { id: 1, name: 'Poker', path: '/comingsoon', image: poker },
    { id: 2, name: 'Ludo', path: '/comingsoon', image: ludo },
    { id: 3, name: 'Carrom', path: '/comingsoon', image: carrom },
  ];

  const totalColumns = 4;
  const placeholders = totalColumns - games.length;

  return (
    <section
      className="w-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${borderBackground})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        padding: '12px',
        paddingBottom: '32px',
      }}
    >
      <div className="max-w-screen-lg mx-auto px-3">
        <div className="p-6 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={controllerIcon} alt="icon" className="w-6 h-6" />
            <h2 className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
              Popular Games
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-2">
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
                <div className="h-[32px] sm:h-[36px] flex items-center justify-center text-center bg-white/5 px-1">
                  <p
                    className="text-[10px] sm:text-[11px] font-semibold leading-tight px-1 w-full whitespace-normal break-words"
                    style={{
                      color: '#C6D6FF',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {game.name}
                  </p>
                </div>
              </div>
            ))}
            {Array.from({ length: placeholders }).map((_, index) => (
              <div key={`placeholder-${index}`} className="invisible" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularGames;
