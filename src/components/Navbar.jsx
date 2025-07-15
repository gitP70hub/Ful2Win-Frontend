import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaHome, FaGamepad, FaTrophy, FaUsers, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/games', icon: <FaGamepad />, label: 'Games' },
    { path: '/tournaments', icon: <FaTrophy />, label: 'Tournaments' },
    { path: '/community', icon: <FaUsers />, label: 'Community' },
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
  ];

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);
  const activeItem = navItems[activeIndex] || navItems[2];

  const leftItems = navItems.filter((_, index) => index !== activeIndex).slice(0, 2);
  const rightItems = navItems.filter((_, index) => index !== activeIndex).slice(2);

  return (
    <>
      {/* Background Blur */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-[#022870] h-11 md:h-16 z-40" />

      {/* Main Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 lg:m-2 md:mx-16 lg:mx-64 rounded-t-lg md:rounded-lg bg-blueHorizontalGradient text-dullBlue z-50 h-11 md:h-14">
        <div className="max-w-3xl mx-auto px-4 relative h-full">

          {/* Grid */}
          <div className="grid grid-cols-5 text-center items-end h-full relative">
            {[...leftItems, null, ...rightItems].map((item, index) =>
              item ? (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-end pb-3 md:pb-4 ${
                    location.pathname === item.path ? 'text-yellow-400' : ''
                  }`}
                >
                  {React.cloneElement(item.icon, {
                    className: `text-xl md:text-2xl ${
                      location.pathname === item.path ? 'text-yellow-400' : ''
                    }`,
                  })}
                </Link>
              ) : (
                <div key={`center-empty`} className="w-full h-full" />
              )
            )}

            {/* Floating Active Icon */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-6 md:-top-7 z-10">
              <Link to={activeItem.path} className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-blueGradient shadow-lg ring-2 ring-white">
                  {React.cloneElement(activeItem.icon, {
                    className: 'text-yellow-400 text-lg md:text-xl',
                  })}
                </div>
                <span className="text-[10px] md:text-xs mt-1 text-yellow-400 whitespace-nowrap">
                  {activeItem.label}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
