import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react'
import { auth, database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Shield, LogOut, Home as HomeIcon, User, ArrowRight, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import Navbar from '../components/navbar';

const Home = () => {
  const navigate = useNavigate();
  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(database, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUsername(userData.username || 'No Username');
          setEmail(userData.email || 'No email found');
        } else {
          navigate("/signin");
        }
      } else {
        navigate("/signin");
      }
    };
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(database, "FakeInternships"));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setInternships(data);
      setLoading(false);
    };
    fetchInternships();
  }, []);

  const handleVote = async (id, type) => {
    setVoteLoading(id + type);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const internshipRef = doc(database, "FakeInternships", id);
    const internship = internships.find(i => i.id === id);
    const upvoters = internship.upvoters || [];
    const downvoters = internship.downvoters || [];
    if (type === 'up') {
      if (upvoters.includes(currentUser.uid)) return setVoteLoading('');
      await updateDoc(internshipRef, {
        upvoters: arrayUnion(currentUser.uid),
        downvoters: arrayRemove(currentUser.uid)
      });
    } else {
      if (downvoters.includes(currentUser.uid)) return setVoteLoading('');
      await updateDoc(internshipRef, {
        downvoters: arrayUnion(currentUser.uid),
        upvoters: arrayRemove(currentUser.uid)
      });
    }
    // Refresh votes
    const updatedDoc = await getDoc(internshipRef);
    setInternships(internships.map(i => i.id === id ? { ...i, ...updatedDoc.data() } : i));
    setVoteLoading('');
  };

  const filteredInternships = internships.filter(i =>
    i.company?.toLowerCase().includes(search.toLowerCase()) ||
    i.position?.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navbar />
      {username && email && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16 w-full">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Welcome, <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{username}</span>!</h2>
          <p className="text-lg text-gray-300 mb-8 text-center">{email}</p>
        </main>
      )}
      <main className="flex-1 w-full max-w-3xl mx-auto px-2 py-6 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Fake Internships</h1>
          <button
            onClick={() => navigate('/predict')}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            <span>Check Internship</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by company or position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="text-center text-gray-400 py-16">No fake internships found.</div>
        ) : (
          <div className="grid gap-6">
            {filteredInternships.map((item) => (
              <div key={item.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/10 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{item.company}</h3>
                    <span className="px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 bg-red-100/10 text-red-400 border-red-400/30">
                      Fake
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{item.position}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Submitted by {item.reportedBy || 'Anonymous'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 min-w-[90px]">
                  <div className="text-2xl font-bold text-red-400 animate-pulse">{item.score}/10</div>
                  <div className="text-gray-400 text-xs">AI Score</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleVote(item.id, 'up')}
                    disabled={voteLoading === item.id + 'up'}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all text-sm ${item.upvoters?.includes(auth.currentUser?.uid) ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-green-500 hover:text-white'}`}
                  >
                    <ThumbsUp className="w-4 h-4" /> {item.upvoters?.length || 0}
                  </button>
                  <button
                    onClick={() => handleVote(item.id, 'down')}
                    disabled={voteLoading === item.id + 'down'}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all text-sm ${item.downvoters?.includes(auth.currentUser?.uid) ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-red-500 hover:text-white'}`}
                  >
                    <ThumbsDown className="w-4 h-4" /> {item.downvoters?.length || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Home