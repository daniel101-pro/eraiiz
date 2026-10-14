'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaqList from '../components/FaqList';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-green-950">
      <Navbar />
      <main className="px-4 pb-16 pt-28 sm:px-6">
        <FaqList />
      </main>
      <Footer />
    </div>
  );
}
