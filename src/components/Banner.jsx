import React, { useEffect, useState } from 'react';
import slide1 from '../assets/bgmi.jpg';
import slide2 from '../assets/2048.jpg';
import slide3 from '../assets/car.jpg';

const images = [slide1, slide2, slide3];

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // 3 seconds per slide

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-center px-4 mt-6 mb-2">
      <div className="relative w-full max-w-4xl aspect-[16/7] overflow-hidden rounded-2xl shadow-xl">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index + 1}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
