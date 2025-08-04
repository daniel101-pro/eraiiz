'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useTransform as useMotionTransform } from 'framer-motion';
import { CheckCircle, ArrowRight, Shield, Users, TrendingUp, Leaf, ChevronDown, FileText, Zap, ShoppingCart, Store, DollarSign, Globe } from 'lucide-react';
import Link from 'next/link';

export default function MigratePage() {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [name, setName] = useState('');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const termsRef = useRef(null);
  const containerRef = useRef(null);
  const sliderRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transform values for scroll-based animations
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);

  // Handle slider drag
  const handleSliderDrag = (e) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleSliderDrag(e);
      const handleMouseUp = () => setIsDragging(false);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Handle scroll to track progress and bottom detection
  const handleScroll = () => {
    if (!termsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsScrolledToBottom(true);
    } else {
      setIsScrolledToBottom(false);
    }
  };

  // Handle form submission (migrate to seller)
  const handleAcceptAndContinue = async () => {
    if (!isScrolledToBottom) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending PATCH request to:', `${process.env.NEXT_PUBLIC_API_URL}/api/users/migrate-to-seller`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/migrate-to-seller`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade to seller account');
      }

      // Verify the role was actually updated
      if (data.user && data.user.role !== 'seller') {
        throw new Error('Role update failed - please try again');
      }

      // Update localStorage with new user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('role', data.user.role);

      setIsLoading(false);
      setShowSuccess(true);
      
      // Redirect after success animation
      setTimeout(() => {
        window.location.href = '/dashboard/seller';
      }, 3000);

    } catch (error) {
      console.error('Migration error:', error);
      setIsLoading(false);
      setError(error.message);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') || 'buyer' : 'buyer';
    if (role === 'seller') setName('EcoVendor');
    else if (role === 'buyer') setName('PlanetGuardian');

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      setIsMobile(width < 768);
    };
    
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const buyerFeatures = [
    { icon: ShoppingCart, text: "Browse & Purchase Products" },
    { icon: Leaf, text: "Support Sustainable Brands" },
    { icon: Shield, text: "Secure Shopping Experience" },
    { icon: Users, text: "Join Eco-Conscious Community" }
  ];

  const sellerFeatures = [
    { icon: Store, text: "Create Your Store" },
    { icon: DollarSign, text: "Earn Revenue" },
    { icon: Globe, text: "Reach Global Customers" },
    { icon: TrendingUp, text: "Scale Your Business" }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-green-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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
      </div>

      {/* Hero Section */}
      <motion.section 
        className="relative h-screen flex items-center justify-center px-4 pt-20 md:pt-0"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <Zap className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">Upgrade Your Account</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-green-900 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
          >
            Become a Seller
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            Experience the difference between buying and selling on Eraiiz
          </motion.p>

          {/* Transformation Cards */}
          <motion.div
            className="max-w-6xl mx-auto mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Current: Buyer Card */}
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Current: Buyer</h3>
                  <p className="text-blue-600 font-medium">Your Present Experience</p>
                </div>
                <div className="space-y-4">
                  {buyerFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2 + index * 0.1, duration: 0.5 }}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Future: Seller Card */}
              <motion.div
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border border-green-200"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2, duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-10 h-10 text-green-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Future: Seller</h3>
                  <p className="text-green-700 font-medium">Your Potential Growth</p>
                </div>
                <div className="space-y-4">
                  {sellerFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.2 + index * 0.1, duration: 0.5 }}
                    >
                      <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Arrow Transformation */}
            <div className="flex justify-center my-8">
              <motion.div
                className="flex items-center gap-4 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, duration: 0.6, type: "spring" }}
              >
                <span className="text-gray-600 font-medium">Transform into</span>
                <ArrowRight className="w-6 h-6 text-green-600" />
                <span className="text-green-700 font-bold">Seller</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-8 h-8 text-green-900 opacity-60" />
          </motion.div>
        </div>
      </motion.section>

      {/* Terms Section */}
      <section className="min-h-screen w-full bg-white flex items-center justify-center py-20 px-4 mt-16 md:mt-0">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: isMobile ? 0 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0 : 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: isMobile ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isMobile ? 0 : 0.2, duration: isMobile ? 0 : 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-green-100 rounded-full">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Terms & Conditions</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4">Seller Agreement</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Please read and accept our terms to complete your seller registration
            </p>
          </motion.div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                          <div
                ref={termsRef}
                onScroll={handleScroll}
                className="h-96 overflow-y-scroll p-8 relative z-10 cursor-auto"
                style={{ 
                  maxHeight: '24rem',
                  overflowY: 'scroll',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
                tabIndex={0}
              >
              <h3 className="text-2xl font-bold text-green-900 mb-6">Eraiiz Seller Terms and Conditions</h3>
              <p className="text-sm text-gray-600 mb-6 italic">Effective Date: January 1, 2024 | Last Updated: December 15, 2024</p>
              
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">1. Welcome to Eraiiz Seller Program</h4>
                  <p className="mb-2">By joining Eraiiz as a seller, you become part of a sustainable commerce revolution. These terms govern your participation in our eco-conscious marketplace where environmental responsibility meets profitable business.</p>
                  <p>You acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, Community Guidelines, and Sustainability Standards.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">2. Seller Eligibility & Account Requirements</h4>
                  <p className="mb-2"><strong>Age & Legal Capacity:</strong> You must be at least 18 years old and have legal capacity to enter binding contracts in your jurisdiction.</p>
                  <p className="mb-2"><strong>Business Information:</strong> Provide accurate business details including tax identification, banking information, and valid contact details.</p>
                  <p className="mb-2"><strong>Account Security:</strong> You are solely responsible for maintaining account confidentiality and all activities under your account.</p>
                  <p><strong>Verification:</strong> Eraiiz reserves the right to verify your identity and business credentials at any time.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">3. Sustainability Standards & Product Requirements</h4>
                  <p className="mb-2"><strong>Eco-Friendly Products:</strong> All products must align with our sustainability mission. This includes using recycled materials, renewable resources, or contributing to environmental conservation.</p>
                  <p className="mb-2"><strong>Carbon Footprint Reporting:</strong> Sellers must provide accurate carbon footprint information for their products using our integrated carbon calculator.</p>
                  <p className="mb-2"><strong>Prohibited Items:</strong> Items made from endangered species, single-use plastics (where alternatives exist), or products with excessive packaging are strictly prohibited.</p>
                  <p><strong>Sustainability Certification:</strong> Preference given to products with recognized environmental certifications (FSC, Fair Trade, Energy Star, etc.).</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">4. Product Listings & Quality Standards</h4>
                  <p className="mb-2"><strong>Accurate Descriptions:</strong> Product descriptions must be truthful, detailed, and include sustainability information.</p>
                  <p className="mb-2"><strong>High-Quality Images:</strong> Minimum 3 clear, well-lit photos per product. Images must accurately represent the item's condition and features.</p>
                  <p className="mb-2"><strong>Pricing Policy:</strong> Competitive and fair pricing. No price manipulation or artificial inflation.</p>
                  <p><strong>Inventory Management:</strong> Maintain accurate stock levels. Out-of-stock items must be marked unavailable within 24 hours.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">5. Order Fulfillment & Shipping</h4>
                  <p className="mb-2"><strong>Processing Time:</strong> Orders must be processed within 1-2 business days unless otherwise specified.</p>
                  <p className="mb-2"><strong>Eco-Friendly Packaging:</strong> Use sustainable packaging materials whenever possible. Minimize packaging waste.</p>
                  <p className="mb-2"><strong>Shipping Methods:</strong> Partner with eco-conscious shipping providers when available. Offer carbon-neutral shipping options.</p>
                  <p><strong>Tracking Information:</strong> Provide tracking details to customers within 24 hours of shipment.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">6. Customer Service Excellence</h4>
                  <p className="mb-2"><strong>Response Time:</strong> Respond to customer inquiries within 24 hours, preferably within 12 hours.</p>
                  <p className="mb-2"><strong>Professional Communication:</strong> Maintain courteous, helpful, and professional communication at all times.</p>
                  <p className="mb-2"><strong>Return Policy:</strong> Honor reasonable return requests within 30 days. Clearly state your return policy on product listings.</p>
                  <p><strong>Issue Resolution:</strong> Work collaboratively with Eraiiz support to resolve customer disputes promptly and fairly.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">7. Fees, Payments & Financial Terms</h4>
                  <p className="mb-2"><strong>Commission Structure:</strong> Eraiiz charges a competitive 8-12% commission on sales, varying by product category and seller performance.</p>
                  <p className="mb-2"><strong>Payment Schedule:</strong> Payments are processed weekly, with a 7-day holding period for new sellers.</p>
                  <p className="mb-2"><strong>Transaction Fees:</strong> Additional fees may apply for payment processing (typically 2.9% + $0.30 per transaction).</p>
                  <p><strong>Tax Responsibility:</strong> Sellers are responsible for all applicable taxes, including sales tax, VAT, and income tax reporting.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">8. Performance Metrics & Seller Standards</h4>
                  <p className="mb-2"><strong>Seller Rating:</strong> Maintain a minimum 4.0-star average rating. Consistent poor performance may result in account review.</p>
                  <p className="mb-2"><strong>Order Cancellation Rate:</strong> Keep cancellation rates below 5%. Excessive cancellations may impact account standing.</p>
                  <p className="mb-2"><strong>Sustainability Score:</strong> Participate in our unique sustainability scoring system to boost product visibility.</p>
                  <p><strong>Performance Reviews:</strong> Monthly performance reviews with personalized recommendations for improvement.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">9. Intellectual Property & Content</h4>
                  <p className="mb-2"><strong>Original Content:</strong> All product images, descriptions, and content must be original or properly licensed.</p>
                  <p className="mb-2"><strong>Brand Rights:</strong> Do not infringe on trademarks, copyrights, or other intellectual property rights.</p>
                  <p><strong>Content License:</strong> By uploading content, you grant Eraiiz a non-exclusive license to use it for promotional and operational purposes.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">10. Account Termination & Violations</h4>
                  <p className="mb-2"><strong>Violation Consequences:</strong> Account suspension or termination for repeated violations, fraudulent activity, or failure to meet sustainability standards.</p>
                  <p className="mb-2"><strong>Appeal Process:</strong> Fair appeal process available for disputed account actions. Submit appeals within 30 days.</p>
                  <p><strong>Data Retention:</strong> Upon termination, seller data will be retained according to legal requirements and our Privacy Policy.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">11. Support & Community</h4>
                  <p className="mb-2"><strong>Seller Support:</strong> Dedicated seller support team available Monday-Friday, 9 AM - 6 PM EST.</p>
                  <p className="mb-2"><strong>Educational Resources:</strong> Access to sustainability guides, marketing tips, and business growth resources.</p>
                  <p className="mb-2"><strong>Community Forums:</strong> Participate in seller community discussions and sustainability initiatives.</p>
                  <p><strong>Success Programs:</strong> Eligibility for featured seller programs and sustainability awards.</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-3">12. Legal & Compliance</h4>
                  <p className="mb-2"><strong>Governing Law:</strong> These terms are governed by the laws of the jurisdiction where Eraiiz operates.</p>
                  <p className="mb-2"><strong>Dispute Resolution:</strong> Binding arbitration for disputes, with option for mediation first.</p>
                  <p className="mb-2"><strong>Limitation of Liability:</strong> Eraiiz's liability is limited to the amount of fees paid by the seller in the preceding 12 months.</p>
                  <p><strong>Updates to Terms:</strong> Terms may be updated with 30 days notice. Continued use constitutes acceptance of new terms.</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">Contact & Support Information</h4>
                  <p className="mb-1"><strong>Seller Support:</strong> seller-support@eraiiz.com</p>
                  <p className="mb-1"><strong>General Inquiries:</strong> hello@eraiiz.com</p>
                  <p className="mb-1"><strong>Phone Support:</strong> +1 (555) 372-4499</p>
                  <p className="mb-1"><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST</p>
                  <p><strong>Emergency Contact:</strong> Available 24/7 for critical issues via our seller dashboard.</p>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    Thank you for choosing Eraiiz as your sustainable commerce platform. Together, we're building a more environmentally conscious marketplace for the future.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 pb-6 relative z-10">
              <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {Math.round(scrollProgress)}% read {scrollProgress > 0 ? '✓ Scrolling works!' : '❌ Try scrolling the terms above'}
              </p>
              <div className="text-center mt-2">
                <button 
                  onClick={() => {
                    if (termsRef.current) {
                      termsRef.current.scrollTop = termsRef.current.scrollHeight;
                    }
                  }}
                  className="text-xs text-green-600 hover:text-green-700 underline"
                >
                  Click here to scroll to bottom
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: isMobile ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isMobile ? 0 : 0.3, duration: isMobile ? 0 : 0.8 }}
            viewport={{ once: true }}
          >
            <motion.button
              onClick={handleAcceptAndContinue}
              disabled={!isScrolledToBottom || isLoading}
              className={`group relative inline-flex items-center gap-4 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                isScrolledToBottom && !isLoading
                  ? 'bg-green-900 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={isScrolledToBottom && !isLoading ? { scale: 1.05 } : {}}
              whileTap={isScrolledToBottom && !isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? (
                <motion.div
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <CheckCircle className="w-6 h-6" />
              )}
              <span>
                {isLoading ? 'Processing...' : 'Accept Terms & Continue'}
              </span>
              {!isLoading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />}
            </motion.button>

            {!isScrolledToBottom && (
              <p className="text-sm text-gray-500 mt-4">
                Please read through all terms before continuing
              </p>
            )}

            {error && (
              <motion.div
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="text-red-800 text-sm font-medium">❌ {error}</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Seller!</h3>
              <p className="text-gray-600 mb-6">
                Your account has been successfully upgraded. You're now ready to start selling on Eraiiz!
              </p>
              <motion.div
                className="w-full bg-green-100 rounded-lg p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-green-700">
                  Redirecting to your seller dashboard...
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center py-12 text-gray-500 relative z-10 mt-16 md:mt-0">
        <motion.p
          className="text-lg mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: isMobile ? 0 : 0.6 }}
          viewport={{ once: true }}
        >
          Ready to grow with Eraiiz? Your sustainable selling journey begins with acceptance.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isMobile ? 0 : 0.2, duration: isMobile ? 0 : 0.6 }}
          viewport={{ once: true }}
        >
          <Link 
            href="/dashboard/seller" 
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Explore Seller Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </footer>
    </div>
  );
}