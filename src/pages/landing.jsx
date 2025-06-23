import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Search, Shield, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, MessageSquare, Star, ArrowRight, Zap, Target, Globe } from 'lucide-react';
import Footer from '../components/footer';


const Mocktern = () => {
const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [animatedScore, setAnimatedScore] = useState(0);

  // Mock data for recent verifications
  const recentVerifications = [
    {
      id: 1,
      company: "TechFlow Solutions",
      position: "Software Engineering Intern",
      fakeScore: 87,
      votes: { fake: 24, real: 3 },
      status: 'confirmed-fake',
      reportedBy: "Alex_Dev92",
      timeAgo: "2 hours ago",
      redFlags: ["Unpaid but demands 60hr/week", "No company website", "Gmail contact"]
    },
    {
      id: 2,
      company: "Microsoft",
      position: "Product Management Intern",
      fakeScore: 12,
      votes: { fake: 2, real: 18 },
      status: 'verified-real',
      reportedBy: "InternHunter",
      timeAgo: "5 hours ago",
      redFlags: []
    },
    {
      id: 3,
      company: "DataMine Corp",
      position: "Data Science Intern",
      fakeScore: 73,
      votes: { fake: 15, real: 8 },
      status: 'under-review',
      reportedBy: "CS_Student",
      timeAgo: "1 day ago",
      redFlags: ["Immediate hiring", "No interview process", "Requests personal info upfront"]
    },
    {
      id: 4,
      company: "Amazon",
      position: "Marketing Intern",
      fakeScore: 8,
      votes: { fake: 1, real: 22 },
      status: 'verified-real',
      reportedBy: "MarketingMajor",
      timeAgo: "2 days ago",
      redFlags: []
    }
  ];

  const stats = {
    totalVerifications: 2847,
    fakesCaught: 1293,
    communityMembers: 12456,
    accuracy: 94.2
  };

  // Animate the fake score counter
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedScore(prev => {
        if (prev < stats.fakesCaught) {
          return prev + 23;
        }
        return stats.fakesCaught;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed-fake': return 'text-red-600 bg-red-50 border-red-200';
      case 'verified-real': return 'text-green-600 bg-green-50 border-green-200';
      case 'under-review': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed-fake': return <XCircle className="w-4 h-4" />;
      case 'verified-real': return <CheckCircle className="w-4 h-4" />;
      case 'under-review': return <Eye className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredVerifications = recentVerifications.filter(item => {
    const matchesSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
              Protect students from scam internships and unrealistic opportunities.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-cyan-400">{stats.totalVerifications.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Verifications</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-red-400">{animatedScore.toLocaleString()}</div>
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
      <div className="px-6 py-12 mx-auto max-w-7xl lg:px-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies, positions, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All', icon: Globe },
                { key: 'confirmed-fake', label: 'Fake', icon: XCircle },
                { key: 'verified-real', label: 'Verified', icon: CheckCircle },
                { key: 'under-review', label: 'Review', icon: Eye }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    selectedFilter === key
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-16 mx-auto max-w-7xl lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Recent Verifications</h2>
        <div className="grid gap-6">
          {filteredVerifications.map((item) => (
            <div key={item.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{item.company}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="capitalize">{item.status.replace('-', ' ')}</span>
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{item.position}</p>
                  
                  {item.redFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.redFlags.map((flag, index) => (
                        <span key={index} className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-sm border border-red-500/30">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Reported by {item.reportedBy}</span>
                    <span>{item.timeAgo}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${item.fakeScore > 50 ? 'text-red-400' : 'text-green-400'}`}>
                      {item.fakeScore}%
                    </div>
                    <div className="text-gray-400 text-sm">Fake Score</div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-white">{item.votes.fake}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white">{item.votes.real}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all border border-white/20">
            Load More Verifications
          </button>
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
            <p className="text-gray-300">Our AI scans internship postings for red flags, unrealistic claims, and scam patterns to generate a fake probability score.</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Community Voting</h3>
            <p className="text-gray-300">Students and professionals vote on the AI's assessment. With 70% agreement, we confirm the internship status.</p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-pink-500 to-red-500 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Protection</h3>
            <p className="text-gray-300">Verified fake internships are flagged publicly, protecting future students from wasting time on scams.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Mocktern;