import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { database } from '../config/firebase';
import { Shield, Users, Zap, ArrowRight, Target, Globe, AlertTriangle, CheckCircle, XCircle, Eye, Star, MessageSquare } from 'lucide-react';
import Footer from '../components/footer';

const Mocktern = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVerifications: 0,
    fakesCaught: 0,
    communityMembers: 0,
    accuracy: 0,
  });
  const [animatedFakes, setAnimatedFakes] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const [internshipsSnap, coursesSnap, projectsSnap, usersSnap] = await Promise.all([
        getDocs(collection(database, 'Internships')),
        getDocs(collection(database, 'courses')),
        getDocs(collection(database, 'projects')),
        getDocs(collection(database, 'Users')),
      ]);
      const internships = internshipsSnap.docs.map(doc => doc.data());
      const courses = coursesSnap.docs.map(doc => doc.data());
      const projects = projectsSnap.docs.map(doc => doc.data());
      const users = usersSnap.docs;
      const totalVerifications = internships.length + courses.length + projects.length;
      const fakesCaught =
        internships.filter(i => i.publicDecision === 'fake').length +
        courses.filter(c => c.publicDecision === 'fake').length +
        projects.filter(p => p.publicDecision === 'fake').length;
      const communityMembers = users.length;
      const allItems = [...internships, ...courses, ...projects];
      const accurate = allItems.filter(i => i.publicDecision === i.aiDecision).length;
      const accuracy = allItems.length > 0 ? ((accurate / allItems.length) * 100).toFixed(1) : 0;
      setStats({
        totalVerifications,
        fakesCaught,
        communityMembers,
        accuracy,
      });
    };
    fetchStats();
  }, []);
  useEffect(() => {
    setAnimatedFakes(0);
    if (stats.fakesCaught > 0) {
      const step = Math.max(1, Math.floor(stats.fakesCaught / 40));
      const timer = setInterval(() => {
        setAnimatedFakes(prev => {
          if (prev + step < stats.fakesCaught) return prev + step;
          return stats.fakesCaught;
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [stats.fakesCaught]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
        <div className="relative px-6 py-12 mx-auto max-w-7xl lg:px-8">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">Mocktern</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-gray-300">
              <a href="#work" className="hover:text-white transition-colors">How it Works</a>
              <button onClick={()=>navigate('/signin')} className="hover:text-white transition-colors">Community</button>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105">
                Submit Internship
              </button>
            </div>
          </nav>
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Fake
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Internships</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Crowdsourced verification platform powered by AI and community voting. 
              Protect students from scam internships, predatory courses, and unrealistic opportunities.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">{stats.totalVerifications.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Verifications</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{animatedFakes.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Fakes Caught</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-purple-400">{stats.communityMembers.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Community</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-green-400">{stats.accuracy}%</div>
                <div className="text-gray-300 text-sm">Accuracy</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button onClick={()=>navigate('/signin')} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Verify Internship</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/5 transition-all">
                Browse Database
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="relative px-6 py-16 mx-auto max-w-7xl lg:px-8 flex items-center justify-center">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-purple-500/40 to-cyan-500/30 rounded-full filter blur-3xl opacity-60 animate-pulse z-0" />
        <div className="absolute -bottom-32 right-0 w-96 h-96 bg-gradient-to-tr from-pink-500/30 to-blue-500/30 rounded-full filter blur-3xl opacity-50 animate-pulse z-0" />
        <div className="relative z-10 w-full max-w-5xl mx-auto rounded-3xl bg-white/10 backdrop-blur-xl border border-cyan-400/20 shadow-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
          <div className="flex-1 min-w-[250px]">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">A Smarter Way to Verify Opportunities</h2>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-6">AI-powered. Community-driven. Transparent. Secure.</p>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full mb-4" />
            <p className="text-white/70 text-base md:text-lg">Mocktern combines advanced AI analysis with real community consensus to protect you from scams and highlight real opportunities—instantly, transparently, and securely.</p>
          </div>
          <div className="flex-1 min-w-[250px] flex flex-col gap-8">
            <div className="flex items-start gap-4">
              <Shield className="w-7 h-7 text-cyan-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">AI Risk Analysis</h4>
                <p className="text-white/70">Gemini AI instantly flags red flags, unrealistic promises, and scam patterns in internships, courses, and projects.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Users className="w-7 h-7 text-purple-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Community Consensus</h4>
                <p className="text-white/70">Every opportunity is reviewed and voted on by real users—so you get the wisdom of the crowd, not just an algorithm.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Eye className="w-7 h-7 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Real-Time Transparency</h4>
                <p className="text-white/70">See every vote, every change, and every analysis—instantly. No hidden decisions, no secrets.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-7 h-7 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Protecting Your Future</h4>
                <p className="text-white/70">Mocktern helps you avoid scams and focus on real, valuable opportunities—so you can build your career with confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id='work' className="px-6 py-16 mx-auto max-w-7xl lg:px-8 border-t border-white/10">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">How Mocktern Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-cyan-500 to-purple-500 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
            <p className="text-gray-300">Our AI scans internship and course postings for red flags, unrealistic claims, and scam patterns to generate a risk score.</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Community Voting</h3>
            <p className="text-gray-300">Students and professionals vote on the AI's assessment. With enough agreement, we confirm the opportunity's status.</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-pink-500 to-red-500 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Protection</h3>
            <p className="text-gray-300">Verified fake internships and courses are flagged publicly, protecting future students from scams.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Mocktern;