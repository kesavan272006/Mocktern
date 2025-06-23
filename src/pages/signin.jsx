import { auth, database, googleprovider } from '../config/firebase';
import { useState, useEffect } from "react";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import googlepic from '../assets/Googlepic.png';
import { addDoc, collection } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Zap, ArrowRight } from 'lucide-react';

const Signin = () => {
    const [username, setUsername]=useState('');
    const navigate = useNavigate();
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/home");
            }
        });
        return () => unsubscribe();
    }, [navigate]);
    const signInWithGoogle = async () => {
        if (!username) {
            alert("Please enter username");
            return;
        }
        try {
            await signInWithPopup(auth, googleprovider);
            addUser();
            navigate("/home");
        } catch (error) {
            console.error("Error signing in with Google:", error.message);
            alert("Error signing in with Google. Please try again.");
        }
    };
    const addUser = async () => {
        const userRef = collection(database, "Users");
        const userDocRef = doc(userRef, auth.currentUser.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
                await setDoc(userDocRef, {
                    username: username,
                    email: auth.currentUser?.email,
                });
            }
        } catch (err) {
            console.error("Error adding user:", err);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="relative w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-8">
                    <Shield className="w-8 h-8 text-cyan-400" />
                    <span className="text-2xl font-bold text-white">Mocktern</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Sign In</h2>
                <p className="text-gray-300 mb-6 text-center">Enter your username to continue</p>
                <label className="text-gray-200 mb-1 self-start">Username</label>
                <input
                    type='text'
                    placeholder='Enter your username'
                    value={username}
                    onChange={(e)=>setUsername(e.target.value)}
                    className="w-full px-4 py-3 mb-6 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
                <button
                    className='w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg mb-4'
                    onClick={signInWithGoogle}
                >
                    <img className='w-7 h-7' src={googlepic} alt="Google logo" />
                    <span>Sign in with Google</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div className="text-xs text-gray-400 mt-2 text-center">Authenticate to contribute to internship verification</div>
            </div>
        </div>
    )
}

export default Signin