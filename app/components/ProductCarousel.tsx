'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CarouselItem {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  link: string;
}

interface ProductCarouselProps {
  items: CarouselItem[];
}

export default function ProductCarousel({ items }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="flex transition-transform duration-500 ease-in-out mb-4"
        style={{ transform: `translateX(-${currentIndex * (100 / (window.innerWidth >= 768 ? 2 : 1))}%)` }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full md:w-1/2 flex flex-col md:flex-row md:items-center p-2 md:mr-4"
          >
            <div className="relative w-full h-80 rounded-l-lg overflow-hidden md:block">
              <Image
                src={item.image}
                alt={item.alt}
                layout="fill"
                objectFit="cover"
                className="rounded-l-lg"
                draggable={false}
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
                <h2 className="text-2xl 2xl:text-2xl xl:text-xl lg:text-lg md:text-base font-medium text-black mb-4">{item.title}</h2>
                <p className="text-sm 2xl:text-sm xl:text-xs lg:text-xs md:text-xs -mt-1 text-gray-500 mb-4 md:mb-0">{item.subtitle}</p>
                <Link href={item.link}>
                  <button className="bg-green-600 mt-32 text-white px-6 py-2 rounded-md hover:bg-green-700 transition w-fit text-base 2xl:text-base xl:text-sm lg:text-sm md:text-xs">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${currentIndex === index ? 'bg-green-600' : 'bg-gray-200'}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
} 