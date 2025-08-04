'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, Leaf, Globe, ArrowRight, Star, Zap, Heart, ChevronDown } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BlurText from '../TextAnimations/BlurText/BlurText';

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transform values for scroll-based animations
  const welcomeOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const welcomeScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const featuresY = useTransform(scrollYProgress, [0.2, 0.5], [100, 0]);
  const featuresOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.6, 0.9], [100, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.6, 0.9], [0, 1]);

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') || 'buyer' : 'buyer';
    if (role === 'seller') setName('EcoVendor');
    else if (role === 'buyer') setName('PlanetGuardian');

    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleContinue = () => {
    const role = localStorage.getItem('role') || 'buyer';
    router.push(`/dashboard/${role}`);
  };

  if (!name) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-green-50">
        <div className="relative">
          <LoadingSpinner size={60} color="#10b981" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Leaf className="w-8 h-8 text-emerald-500" />
          </motion.div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Leaf,
      title: "Sustainable Shopping",
      description: "Discover eco-friendly products that make a difference",
      color: "bg-green-900"
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Join a community committed to environmental change",
      color: "bg-green-900"
    },
    {
      icon: Star,
      title: "Quality Assured",
      description: "Premium recycled products with verified sustainability",
      color: "bg-green-900"
    },
    {
      icon: Heart,
      title: "Community Driven",
      description: "Connect with like-minded eco-conscious individuals",
      color: "bg-green-900"
    }
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Confetti */}
      {windowSize.width > 0 && windowSize.height > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={150}
          recycle={false}
          gravity={0.15}
          colors={['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']}
        />
      )}

      {/* Hero Section - Welcome Message */}
      <section className="h-screen w-full bg-gradient-to-br from-white via-gray-50 to-green-50 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-emerald-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-teal-200 rounded-full opacity-30"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Welcome Content */}
        <motion.div 
          className="text-center z-10"
          style={{ opacity: welcomeOpacity, scale: welcomeScale }}
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">Welcome to the Future of Shopping</span>
          </motion.div>

          <div className="mb-6">
            <BlurText
              text={`Welcome, ${name}!`}
              delay={100}
              animateBy="words"
              direction="top"
              className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-bold text-green-900"
            />
          </div>

          <motion.p
            className="text-sm md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            You've joined the revolution of responsible commerce. Together, we're saving the planet, one sustainable choice at a time. 🌱
          </motion.p>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-8 h-8 text-green-900 opacity-60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen w-full bg-white flex items-center justify-center py-20 px-4">
        <motion.div
          className="max-w-6xl mx-auto"
          style={{ y: featuresY, opacity: featuresOpacity }}
        >
          <motion.h2
            className="text-sm sm:text-base md:text-lg lg:text-base font-bold text-green-900 text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Why Choose Eraiiz?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 50, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ 
                  delay: index * 0.2, 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-green-50 group-hover:to-emerald-50">
                  <motion.div
                    className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen w-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-20 px-4 relative overflow-hidden">
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-20 text-emerald-600"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="w-12 h-12 opacity-40" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-20 text-green-600"
          animate={{ y: [0, 20, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Globe className="w-12 h-12 opacity-40" />
        </motion.div>

        <motion.div
          className="text-center max-w-4xl mx-auto"
          style={{ y: ctaY, opacity: ctaOpacity }}
        >
          <motion.h2
            className="text-sm sm:text-base md:text-lg lg:text-base xl:text-sm font-bold text-green-900 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to Make a Difference?
          </motion.h2>

          <motion.p
            className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
          >
            Join thousands of eco-conscious individuals who are already making sustainable choices with Eraiiz.
          </motion.p>

          <motion.button
            className="group relative inline-flex items-center gap-4 bg-green-900 text-white font-bold px-10 py-5 rounded-2xl shadow-2xl hover:shadow-green-900/25 transition-all duration-300 overflow-hidden text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinue}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-800 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <span className="relative z-10 flex items-center gap-3">
              <Zap className="w-6 h-6" />
              Start Your Eco-Journey
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </motion.button>

          <motion.p
            className="text-sm text-gray-600 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            viewport={{ once: true }}
          >
            Your sustainable shopping adventure begins now! 🌱
          </motion.p>
        </motion.div>
      </section>
    </div>
  );
}