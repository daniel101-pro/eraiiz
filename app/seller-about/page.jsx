'use client';
import DualNavbarSell from '../components/DualNavbarSell';
import Footer from "../components/Footer";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decodeJwt } from '../utils/jwtDecode';

export default function SellerAboutPage() {
    const router = useRouter();

    useEffect(() => {
        document.title = 'About Us | Eraiiz Seller';
        
        // Check if user is authenticated and is a seller
        const checkAuth = () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const storedUser = localStorage.getItem('user');
                
                if (!accessToken || !storedUser) {
                    router.push('/about');
                    return;
                }

                // Decode the token to check if it's valid
                const decodedToken = decodeJwt(accessToken);
                if (!decodedToken || !decodedToken.exp) {
                    router.push('/about');
                    return;
                }

                // Check if token is expired
                const currentTime = Math.floor(Date.now() / 1000);
                if (decodedToken.exp < currentTime) {
                    router.push('/about');
                    return;
                }

                // Verify user is a seller
                try {
                    const userData = JSON.parse(storedUser);
                    if (userData.role !== 'seller') {
                        router.push('/about');
                    }
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    router.push('/about');
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
                router.push('/about');
            }
        };

        checkAuth();
    }, [router]);

    return (
        <>
            <div className="relative z-10">
                <DualNavbarSell />
            </div>
            <a
                href="/"
                className="text-sm text-black hover:text-green-600 bg-green-50 w-[100px] flex px-2 py-1 rounded-lg mt-[120px] md:mx-10 lg:mx-[300px] mx-6 border border-green-200"
            >
                <span className="mr-1">⦿</span> About Us
            </a>

            <div className="min-h-screen bg-white flex flex-col items-center mt-9">
                <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
                    <h1 className="text-[30px] font-medium text-gray-800 mb-6 leading-tight">
                        Join Us in Redefining Sustainable E-commerce
                    </h1>
                    <p className="text-sm text-gray-600 mb-10 text-justify leading-relaxed">
                        As a seller on Eraiiz, you're not just running a business – you're part of a movement towards sustainable commerce. We provide a platform for eco-conscious brands to reach global customers who share their commitment to environmental responsibility. Our marketplace is designed to showcase sustainable products and practices, helping you connect with customers who value both quality and environmental impact.
                        <br /><br />
                        Together, we're building a community of sellers dedicated to reducing waste and promoting sustainable practices in online retail.
                    </p>

                    <div className="w-full flex flex-col md:flex-row justify-between mb-12 gap-6">
                        <div className="w-full md:w-1/2 p-8 bg-gray-50 rounded-xl">
                            <h3 className="text-base font-medium text-gray-800 mb-3">Seller Benefits:</h3>
                            <p className="text-sm text-gray-600 mt-20">
                                Access to eco-conscious customers, dedicated seller support, and tools to showcase your sustainable practices and products effectively.
                            </p>
                        </div>
                        <div className="w-full md:w-1/2 p-8 bg-gray-50 rounded-xl flex items-start">
                            <div>
                                <h3 className="text-base font-medium text-gray-800 mb-3">Our Commitment:</h3>
                                <p className="text-sm text-gray-600 mt-20">
                                    We provide the technology and platform you need to grow your sustainable business while maintaining our shared commitment to environmental responsibility.
                                </p>
                            </div>
                            <span className="ml-3 mt-2 w-1 h-1 bg-pink-500 rounded-full"></span>
                        </div>
                    </div>

                    <div className="w-full">
                        <h2 className="text-[28px] text-gray-800 mb-6">Why Sell on Eraiiz:</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-3">
                            <li>
                                <span className="text-gray-800">Targeted Audience:</span>
                                <span className="text-sm"> Connect with customers who value sustainable products.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Growth Support:</span>
                                <span className="text-sm"> Access tools and resources to scale your sustainable business.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Brand Visibility:</span>
                                <span className="text-sm"> Showcase your commitment to sustainability to a global audience.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Community:</span>
                                <span className="text-sm"> Join a network of like-minded sellers committed to environmental responsibility.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Impact:</span>
                                <span className="text-sm"> Contribute to reducing carbon footprint in e-commerce supply chains.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
} 