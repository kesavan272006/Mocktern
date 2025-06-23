import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react'
import { auth, database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, LogOut, Home as HomeIcon, User } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
      const logout = async () => {
        try {
          await signOut(auth);
          navigate("/");
        } catch (error) {
          console.error("Error signing out:", error);
        }
      };
    const navItems = [
        {
          label: 'Home',
          icon: <HomeIcon className="w-5 h-5" />,
          onClick: () => navigate('/home'),
          active: window.location.pathname === '/home',
        },
        {
          label: 'Profile',
          icon: <User className="w-5 h-5" />,
          onClick: () => navigate('/profile'),
          active: window.location.pathname === '/profile',
        },
        {
          label: 'Logout',
          icon: <LogOut className="w-5 h-5" />,
          onClick: logout,
          active: false,
        },
      ];
  return (
    <div>
      <nav className="sticky top-0 z-30 w-full bg-white/10 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 py-3 md:py-4 md:px-12 md:top-0 md:bottom-auto md:flex-row md:justify-between md:items-center md:rounded-none md:shadow-none shadow-lg md:static">
        <div className="flex items-center space-x-2">
          <Shield className="w-7 h-7 text-cyan-400" />
          <span className="text-xl font-bold text-white">Mocktern</span>
        </div>
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${item.active ? 'bg-cyan-500 text-white' : 'text-gray-200 hover:bg-white/10'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/10 backdrop-blur-md border-t border-white/10 flex justify-around items-center px-2 py-2 md:hidden shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all text-xs ${item.active ? 'bg-cyan-500 text-white' : 'text-gray-200 hover:bg-white/10'}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Navbar
