'use client';
import Navbar from '../components/Navbar';
import Footer from "../components/Footer";
import { useEffect } from 'react';

export default function AboutPage() {
    useEffect(() => {
        document.title = 'About Us | Eraiiz';
    }, []);

    return (
        <>
            <div className="relative z-10">
                <Navbar />
            </div>
            <a
                href="/"
                className="text-sm text-black hover:text-green-600 bg-green-50 w-[100px] flex px-2 py-1 rounded-lg mt-[120px] md:mx-10 lg:mx-[300px] mx-6 border border-green-200"
            >
                <span className="mr-1">⦿</span> About Us
            </a>

            <div className="min-h-screen bg-white flex flex-col items-center mt-9">
                <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
                    <h1 className="text-xs sm:text-sm md:text-base lg:text-sm font-medium text-gray-800 mb-6 leading-tight">
                        Redefining climate change to include right shopping choices
                    </h1>
                    <p className="text-sm text-gray-600 mb-10 text-justify leading-relaxed">
                        Eraiiz was founded by a team of passionate climate enthusiasts with a shared vision: to reinvent the online shopping system that will create awareness of zero-waste culture in order to promote sustainable practice for environmental sustainability. We believe that as technological advancement continues to surge, online shopping, if not sustainably influenced, would negatively affect the environment exponentially. Our team has an understanding of the industry landscape, and we leverage this expertise to curate a network of sustainable brands.
                        <br /><br />
                        Eraiiz goes beyond just connecting businesses with global customers. We are committed to forging an environment that is free from waste.
                    </p>

                    <div className="w-full flex flex-col md:flex-row justify-between mb-12 gap-6">
                        <div className="w-full md:w-1/2 p-8 bg-gray-50 rounded-xl">
                            <h3 className="text-base font-medium text-gray-800 mb-3">Our Mission:</h3>
                            <p className="text-sm text-gray-600 mt-20">
                                To bridge the gap between sustainable brands and global consumers thereby reducing the level of carbon footprint in the whole supply chain.
                            </p>
                        </div>
                        <div className="w-full md:w-1/2 p-8 bg-gray-50 rounded-xl flex items-start">
                            <div>
                                <h3 className="text-base font-medium text-gray-800 mb-3">Our Vision:</h3>
                                <p className="text-sm text-gray-600 mt-20">
                                    To reinvent the online shopping system that will create awareness of zero-waste culture in order to promote sustainable practice for environmental sustainability.
                                </p>
                            </div>
                            <span className="ml-3 mt-2 w-1 h-1 bg-pink-500 rounded-full"></span>
                        </div>
                    </div>

                    <div className="w-full">
                        <h2 className="text-xs sm:text-sm md:text-base lg:text-sm text-gray-800 mb-6">Our Values:</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-3">
                            <li>
                                <span className="text-gray-800">Quality:</span>
                                <span className="text-sm"> We are committed to excellence in everything we do.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Innovation:</span>
                                <span className="text-sm"> We embrace new ideas and strive to continuously improve our ways of serving the public.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Greenery:</span>
                                <span className="text-sm"> We are a sustainable e-commerce platform hinged on green and environmental sustainability.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Transparency:</span>
                                <span className="text-sm"> We believe in open communications against greenwashing.</span>
                            </li>
                            <li>
                                <span className="text-gray-800">Community:</span>
                                <span className="text-sm"> Through our #Eraiizforgood program, we aim to create a supportive environment, especially for those affected by the effect of climate change disasters.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}