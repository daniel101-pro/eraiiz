'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSlideWidth = () => {
    if (windowWidth < 768) return 1; // Mobile: full width
    if (windowWidth <= 1366) return 1.5; // Intermediate screens: adjusted width
    return 2; // Desktop: half width
  };

  const carouselItems = [
    {
      image: '/plastic-products.png',
      alt: 'Plastic Made Products',
      title: 'Plastic Made Chairs',
      subtitle: 'Discover a range of innovative and sustainable products crafted from recycled plastics.',
      link: '/category/plastic',
    },
    {
      image: '/glass-products.png',
      alt: 'Glass Made Products',
      title: 'Glass Made Chairs',
      subtitle: 'Explore the beauty of sustainability with our Glass Made Products, combining elegance with eco-consciousness.',
      link: '/category/glass',
    },
    {
      image: '/recycled-products.png',
      alt: 'Fruits Waste Products',
      title: 'Fruits Waste Chairs',
      subtitle: 'Discover innovation in every piece with our Recycled Products — turning waste into purposeful beauty.',
      link: '/category/fruits-waste',
    },
  ];

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselItems.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, carouselItems.length]);

  return (
    <div 
      className="mb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out mb-4"
          style={{ transform: `translateX(-${currentIndex * (100 / (typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1))}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {carouselItems.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full md:w-1/2 flex flex-col md:flex-row md:items-center p-2 md:mr-4"
              role="group"
              aria-hidden={currentIndex !== index}
            >
              <div className="relative w-full h-80 rounded-l-lg overflow-hidden md:block" style={{ position: 'relative' }}>
                <Image
                  src={item.image}
                  alt={item.alt}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-l-lg"
                  draggable={false}
                  priority={index === 0}
                  onError={() => setImageError(`Failed to load image: ${item.image}`)}
                />
                <Link href={item.link} className="md:hidden block w-full h-full">
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg"></div>
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white rounded-b-lg">
                    <h2 className="text-xl font-bold">{item.title}</h2>
                    <p className="text-sm">{item.subtitle}</p>
                  </div>
                </Link>
              </div>
              <div className="hidden md:flex flex-col justify-center md:mt-0 md:flex-[0_0_40%] md:pl-4 h-80 border border-gray-200 md:border-l md:border-r md:rounded-r-lg md:flex-row md:items-center">
                <div className="md:flex-1">
                  <h2 className="text-2xl lg:text-2xl xl:text-2xl 2xl:text-2xl custom-md:text-lg min-[800px]:text-base min-[900px]:text-lg min-[1200px]:text-xl font-medium text-black mb-4">{item.title}</h2>
                  <p className="text-sm lg:text-sm xl:text-sm 2xl:text-sm custom-md:text-xs min-[800px]:text-[10px] min-[900px]:text-[11px] min-[1200px]:text-xs -mt-1 text-gray-500 mb-4 md:mb-0">{item.subtitle}</p>
                  <Link href={item.link}>
                    <button
                      className="bg-green-600 mt-32 custom-md:mt-16 min-[800px]:mt-12 min-[900px]:mt-14 min-[1200px]:mt-16 text-white text-base lg:text-base xl:text-base 2xl:text-base custom-md:text-sm min-[800px]:text-xs min-[900px]:text-sm min-[1200px]:text-base px-6 custom-md:px-4 min-[800px]:px-3 min-[900px]:px-4 py-2 min-[800px]:py-1.5 min-[900px]:py-2 rounded-md hover:bg-green-700 transition w-fit"
                    >
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2" role="tablist">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${currentIndex === index ? 'bg-green-600' : 'bg-gray-200'}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={currentIndex === index}
            role="tab"
          />
        ))}
      </div>
      {imageError && <p className="text-red-600 text-center mt-4">{imageError}</p>}
    </div>
  );
} 