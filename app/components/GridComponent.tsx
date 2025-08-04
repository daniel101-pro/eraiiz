import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GridComponent = () => {
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  const items = [
    { id: 1, image: '/image1.png', text: 'Plastic Made Products' },
    { id: 2, image: '/image2.png', text: 'Glass Made Products' },
    { id: 3, image: '/image3.png', text: 'Rubber Made Products' },
    { id: 4, image: '/image4.png', text: 'Others' },
  ];

  useEffect(() => {
    // Animate each text overlay with intro animation then continuous up/down movement
    textRefs.current.forEach((ref) => {
      if (ref) {
        gsap.fromTo(
          ref,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
            onComplete: () => {
              // Once the intro finishes, start an infinite up/down animation with a slight delay
              gsap.to(ref, {
                y: '-=10',
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
                delay: 0.5,
              });
            }
          }
        );
      }
    });
  }, []);

  return (
    <div className="max-w-[1500px] mx-auto grid grid-cols-2 gap-4 p-4 rounded-md -mt-20 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="relative h-64 bg-cover bg-center text-white flex items-end p-4 rounded-md"
          style={{ backgroundImage: `url(${item.image})` }}
        >
          <div 
            className="bg-black/50 p-2 rounded w-full text-center"
            ref={el => { textRefs.current[index] = el; }}
          >
            <p className="text-sm font-bold">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridComponent;
