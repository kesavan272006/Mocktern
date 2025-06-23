import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react'
import { auth, database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Navbar from '../components/navbar';
import { Shield, User, Save, Loader2 } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(database, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUsername(userData.username || '');
          setEmail(userData.email || '');
          setBio(userData.bio || '');
        } else {
          navigate("/signin");
        }
      } else {
        navigate("/signin");
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(database, "Users", currentUser.uid);
        await setDoc(userRef, {
          username,
          email,
          bio,
        }, { merge: true });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      alert("Error saving profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16 w-full">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-6">
            <User className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Profile</span>
          </div>
          <form className="w-full flex flex-col gap-5" onSubmit={handleSave}>
            <div>
              <label className="text-gray-200 mb-1 block">Email</label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-gray-200 mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="text-gray-200 mb-1 block">About / Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            {success && <div className="text-green-400 text-center mt-2">Profile updated!</div>}
          </form>
        </div>
      </main>
    </div>
  )
}

export default Profile