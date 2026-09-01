'use client';

import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import DualNavbarSell from './DualNavbarSell';

export default function AppNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('accessToken')));
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed top-0 left-0 w-full h-16 bg-white shadow-md z-50" />
    );
  }

  return isLoggedIn ? <DualNavbarSell /> : <Navbar />;
}
