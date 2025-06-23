import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react'
import { auth, database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, LogOut, Home as HomeIcon, User } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="px-6 py-8 mx-auto max-w-7xl lg:px-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold text-white">Mocktern</span>
          </div>
          <div className="flex space-x-6 text-gray-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">API Documentation</a>
          </div>
        </div>
        <div className="text-center text-gray-400 text-sm mt-4">
          © 2025 Mocktern. Protecting students from fake internships.
        </div>
      </footer>
  )
}

export default Footer
