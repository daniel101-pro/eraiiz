import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';

export default function ImageGallery({ images }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const remainingCount = images.length - 4;

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'Escape') setSelectedImageIndex(null);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextImage(),
    onSwipedRight: () => handlePrevImage(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedImageIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImageIndex]);

  return (
    <>
      {/* Main Image */}
      <div className="space-y-4">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={images[0]}
            alt="Main product image"
            width={600}
            height={600}
            className="w-full h-full object-center object-cover cursor-pointer hover:opacity-90 transition-opacity"
            priority
            onClick={() => setSelectedImageIndex(0)}
          />
        </div>
        
        {/* Thumbnail Grid */}
        <div className="grid grid-cols-4 gap-4">
          {images.slice(1, 5).map((image, index) => (
            <div 
              key={index} 
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
              onClick={() => setSelectedImageIndex(index + 1)}
            >
              <Image
                src={image}
                alt={`Product view ${index + 2}`}
                width={150}
                height={150}
                className="w-full h-full object-center object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
              />
              {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center group-hover:bg-opacity-60 transition-opacity">
                  <span className="text-white text-lg font-medium">+{remainingCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedImageIndex(null);
          }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          {...swipeHandlers}
        >
          {/* Close button - Moved outside the image container */}
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-[60] bg-black bg-opacity-50 p-2 rounded-full transition-all hover:bg-opacity-75 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Navigation arrows - Always visible on larger screens, visible on hover on mobile */}
            <div className="absolute inset-0 flex items-center justify-between z-50 px-4 md:px-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="group pointer-events-auto bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-3 focus:outline-none transition-all transform hover:scale-110 hover:bg-black"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white group-hover:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="group pointer-events-auto bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-3 focus:outline-none transition-all transform hover:scale-110 hover:bg-black"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white group-hover:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Current image */}
            <div className="relative max-h-[85vh] max-w-[85vw] select-none">
              <Image
                src={images[selectedImageIndex]}
                alt={`Product view ${selectedImageIndex + 1}`}
                width={1200}
                height={1200}
                className="object-contain w-auto h-auto max-h-[85vh]"
                priority
                draggable={false}
              />
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-6 py-3 rounded-full text-lg font-medium">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 