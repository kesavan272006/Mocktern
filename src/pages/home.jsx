import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react'
import { auth, database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, query, orderBy } from 'firebase/firestore';
import { Shield, LogOut, Home as HomeIcon, User, ArrowRight, ThumbsUp, ThumbsDown, Loader2, Eye, Calendar, MapPin, DollarSign, Users, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all');

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
      try {
        const q = query(collection(database, "Internships"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setInternships(data);
      } catch (error) {
        console.error('Error fetching internships:', error);
      }
      setLoading(false);
    };
    fetchInternships();
  }, []);

  const handleVote = async (id, type) => {
    setVoteLoading(id + type);
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const internshipRef = doc(database, "Internships", id);
      const internship = internships.find(i => i.id === id);
      const upvoters = internship.upvoters || [];
      const downvoters = internship.downvoters || [];
      
      let newAgree = internship.agree || 0;
      let newDisagree = internship.disagree || 0;
      let newUpvoters = [...upvoters];
      let newDownvoters = [...downvoters];

      if (type === 'up') {
        if (upvoters.includes(currentUser.uid)) {
          newUpvoters = upvoters.filter(uid => uid !== currentUser.uid);
          newAgree = Math.max(0, newAgree - 1);
        } else {
          newUpvoters.push(currentUser.uid);
          newAgree += 1;
          if (downvoters.includes(currentUser.uid)) {
            newDownvoters = downvoters.filter(uid => uid !== currentUser.uid);
            newDisagree = Math.max(0, newDisagree - 1);
          }
        }
      } else {
        if (downvoters.includes(currentUser.uid)) {
          newDownvoters = downvoters.filter(uid => uid !== currentUser.uid);
          newDisagree = Math.max(0, newDisagree - 1);
        } else {
          newDownvoters.push(currentUser.uid);
          newDisagree += 1;
          if (upvoters.includes(currentUser.uid)) {
            newUpvoters = upvoters.filter(uid => uid !== currentUser.uid);
            newAgree = Math.max(0, newAgree - 1);
          }
        }
      }
      let publicDecision = internship.aiDecision;
      if (newAgree > newDisagree) {
        publicDecision = 'real';
      } else if (newDisagree > newAgree) {
        publicDecision = 'fake';
      }
      await updateDoc(internshipRef, {
        agree: newAgree,
        disagree: newDisagree,
        upvoters: newUpvoters,
        downvoters: newDownvoters,
        publicDecision: publicDecision
      });
      setInternships(internships.map(i => 
        i.id === id ? {
          ...i,
          agree: newAgree,
          disagree: newDisagree,
          upvoters: newUpvoters,
          downvoters: newDownvoters,
          publicDecision: publicDecision
        } : i
      ));
    } catch (error) {
      console.error('Error updating vote:', error);
    }
    setVoteLoading('');
  };

  const filteredInternships = internships.filter(i => {
    const matchesSearch = i.company?.toLowerCase().includes(search.toLowerCase()) ||
                         i.position?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'fake') {
      return matchesSearch && i.publicDecision === 'fake';
    } else if (activeTab === 'real') {
      return matchesSearch && i.publicDecision === 'real';
    }
    return matchesSearch;
  });

  const fakeCount = internships.filter(i => i.publicDecision === 'fake').length;
  const realCount = internships.filter(i => i.publicDecision === 'real').length;
  const totalCount = internships.length;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navbar />
      {username && email && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16 w-full">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Welcome, <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{username}</span>!</h2>
          <p className="text-lg text-gray-300 mb-8 text-center">{email}</p>
        </main>
      )}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Internship Database</h1>
          <button
            onClick={() => navigate('/predict')}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            <span>Check Internship</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{totalCount}</div>
            <div className="text-gray-400 text-sm">Total Reports</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{fakeCount}</div>
            <div className="text-gray-400 text-sm">Fake Internships</div>
          </div>
          <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{realCount}</div>
            <div className="text-gray-400 text-sm">Real Internships</div>
          </div>
          <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20">
            <div className="text-2xl font-bold text-cyan-400">{internships.filter(i => i.reports > 1).length}</div>
            <div className="text-gray-400 text-sm">Multiple Reports</div>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('fake')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'fake' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            Fake ({fakeCount})
          </button>
          <button
            onClick={() => setActiveTab('real')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'real' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            Real ({realCount})
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
          <div className="text-center text-gray-400 py-16">No internships found.</div>
        ) : (
          <div className="grid gap-6">
            {filteredInternships.map((item) => (
              <div key={item.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{item.company}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${
                        item.publicDecision === 'fake' 
                          ? 'bg-red-100/10 text-red-400 border-red-400/30' 
                          : 'bg-green-100/10 text-green-400 border-green-400/30'
                      }`}>
                        {item.publicDecision === 'fake' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        <span>{item.publicDecision === 'fake' ? 'Fake' : 'Real'}</span>
                      </span>
                      {item.aiDecision !== item.publicDecision && (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          AI: {item.aiDecision}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-2">{item.position}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Reported by {item.reportedBy || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{formatDate(item.timestamp)}</span>
                      {item.reports > 1 && (
                        <>
                          <span>•</span>
                          <span>{item.reports} reports</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 min-w-[90px]">
                    <div className={`text-2xl font-bold ${item.aiScore > 5 ? 'text-green-400' : 'text-red-400'} animate-pulse`}>
                      {item.aiScore}/10
                    </div>
                    <div className="text-gray-400 text-xs">AI Score</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {item.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate">
                        {item.website}
                      </a>
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.stipend && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{item.stipend}</span>
                    </div>
                  )}
                </div>
                {item.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">Description</h4>
                    <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                  </div>
                )}
                {item.aiReason && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-1">AI Analysis</h4>
                    <p className="text-sm text-gray-400">{item.aiReason}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleVote(item.id, 'up')}
                      disabled={voteLoading === item.id + 'up'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        item.upvoters?.includes(auth.currentUser?.uid) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white/10 text-gray-200 hover:bg-green-500 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Agree ({item.agree || 0})</span>
                    </button>
                    <button
                      onClick={() => handleVote(item.id, 'down')}
                      disabled={voteLoading === item.id + 'down'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        item.downvoters?.includes(auth.currentUser?.uid) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/10 text-gray-200 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Disagree ({item.disagree || 0})</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{item.upvoters?.length || 0} agreed, {item.downvoters?.length || 0} disagreed</span>
                  </div>
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