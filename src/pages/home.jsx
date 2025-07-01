import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react'
import { auth, database } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove, query, orderBy } from 'firebase/firestore';
import { Shield, LogOut, Home as HomeIcon, User, ArrowRight, ThumbsUp, ThumbsDown, Loader2, Eye, Calendar, MapPin, DollarSign,IndianRupee, Users, AlertTriangle, CheckCircle, BookOpen, Code } from 'lucide-react';
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
  const [courses, setCourses] = useState([]);
  const [projects, setProjects] = useState([]);
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
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const internshipPromise = getDocs(query(collection(database, "Internships"), orderBy("timestamp", "desc")));
        const coursePromise = getDocs(query(collection(database, "courses"), orderBy("timestamp", "desc")));
        const projectPromise = getDocs(query(collection(database, "projects"), orderBy("timestamp", "desc")));

        const [internshipSnapshot, courseSnapshot, projectSnapshot] = await Promise.all([internshipPromise, coursePromise, projectPromise]);

        const internshipData = internshipSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const courseData = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const projectData = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setInternships(internshipData);
        setCourses(courseData);
        setProjects(projectData);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchAllData();
  }, []);

  const handleVote = async (collectionName, id, voteType) => {
    setVoteLoading(id + voteType);
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const itemRef = doc(database, collectionName, id);
      const itemSnap = await getDoc(itemRef);
      if (!itemSnap.exists()) return;

      const data = itemSnap.data();
      let currentUpvoters = data.upvoters || [];
      let currentDownvoters = data.downvoters || [];
      const isUpvoted = currentUpvoters.includes(currentUser.uid);
      const isDownvoted = currentDownvoters.includes(currentUser.uid);

      if (voteType === 'up') {
        if (isUpvoted) {
          currentUpvoters = currentUpvoters.filter(uid => uid !== currentUser.uid);
        } else {
          currentUpvoters.push(currentUser.uid);
          if (isDownvoted) {
            currentDownvoters = currentDownvoters.filter(uid => uid !== currentUser.uid);
          }
        }
      } else { 
        if (isDownvoted) {
          currentDownvoters = currentDownvoters.filter(uid => uid !== currentUser.uid);
        } else {
          currentDownvoters.push(currentUser.uid);
          if (isUpvoted) {
            currentUpvoters = currentUpvoters.filter(uid => uid !== currentUser.uid);
          }
        }
      }

      const newAgree = currentUpvoters.length;
      const newDisagree = currentDownvoters.length;
      let aiDecision = data.aiDecision || 'real';
      let newPublicDecision = aiDecision;
      if (newAgree > newDisagree) {
        newPublicDecision = 'real';
      } else if (newDisagree > newAgree) {
        newPublicDecision = 'fake';
      }
      let updatePayload = {
        upvoters: currentUpvoters,
        downvoters: currentDownvoters,
        agree: newAgree,
        disagree: newDisagree,
        publicDecision: newPublicDecision,
      };
      await updateDoc(itemRef, updatePayload);
      const updateState = (setter) => (prevItems) => {
        return prevItems.map(item => item.id === id ? { ...item, ...updatePayload } : item);
      };
      if (collectionName === 'Internships') {
        setInternships(updateState(setInternships));
      } else if (collectionName === 'courses') {
        setCourses(updateState(setCourses));
      } else if (collectionName === 'projects') {
        setProjects(updateState(setProjects));
      }
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
  const [isselected, setIsSelected]=useState(true);
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
        <>
          <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-6 md:py-12 md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-white">Internship Database</h1>
            <div className='flex items-center gap-4'>
              <button
              onClick={() => navigate('/predict')}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Check Internship</span>
            </button>
            <button
              onClick={() => navigate('/verification')}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Verify Courses</span>
            </button>
            </div>
          </div>
          <div className="flex flex-col w-full max-w-4xl mx-auto px-4 py-6 md:py-12 md:flex-row md:items-center md:justify-center gap-4">
            <button
              onClick={() => setIsSelected(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span>View Verified Internships</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSelected(false)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span>View Verified Courses & Projects</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {isselected && (
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-12">
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
                            <IndianRupee className="w-4 h-4 text-gray-400" />
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
                            onClick={() => handleVote('Internships', item.id, 'up')}
                            disabled={voteLoading === item.id + 'up'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                              item.upvoters?.includes(auth.currentUser?.uid) 
                                ? 'bg-green-500 text-white' 
                                : 'bg-white/10 text-gray-200 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>Report as Real ({item.agree || 0})</span>
                          </button>
                          <button
                            onClick={() => handleVote('Internships', item.id, 'down')}
                            disabled={voteLoading === item.id + 'down'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                              item.downvoters?.includes(auth.currentUser?.uid) 
                                ? 'bg-red-500 text-white' 
                                : 'bg-white/10 text-gray-200 hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>Report as fake ({item.disagree || 0})</span>
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
          )}
          {!isselected && (
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Verified Courses</h2>
              {loading ? <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /> : courses.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No courses found.</div>
              ) : (
                <div className="grid gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                            <span className="px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 bg-cyan-100/10 text-cyan-400 border-cyan-400/30">
                              <BookOpen className="w-4 h-4 mt-0.5" /> <span>Course</span>
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ml-2 ${course.publicDecision === 'real' ? 'bg-green-100/10 text-green-400 border-green-400/30' : 'bg-red-100/10 text-red-400 border-red-400/30'}`}>{course.publicDecision === 'real' ? 'Real' : 'Fake'}</span>
                            {course.aiDecision && course.publicDecision !== course.aiDecision && (
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 ml-2">
                                AI: {course.aiDecision}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 mb-2">Provider: {course.provider}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Price: ₹{course.price}</span>
                            <span>•</span>
                            <span>AI Score: <span className="font-bold text-cyan-400">{course.aiScore}/10</span></span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[90px]">
                          <div className="text-2xl font-bold text-cyan-400 animate-pulse">{course.aiScore}/10</div>
                          <div className="text-gray-400 text-xs">AI Score</div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-gray-300 mb-1">Syllabus/Contents</h4>
                        <p className="text-sm text-gray-400 line-clamp-2">{Array.isArray(course.contents) ? course.contents.join(', ') : course.contents}</p>
                      </div>
                      {course.aiReason && (
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold text-gray-300 mb-1">AI Analysis</h4>
                          <p className="text-sm text-gray-400">{course.aiReason}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleVote('courses', course.id, 'up')} disabled={voteLoading === course.id + 'up'} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${course.upvoters?.includes(auth.currentUser?.uid) ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-green-500 hover:text-white'}`}>
                            <ThumbsUp className="w-4 h-4" />
                            <span>Report as Real ({course.agree || 0})</span>
                          </button>
                          <button onClick={() => handleVote('courses', course.id, 'down')} disabled={voteLoading === course.id + 'down'} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${course.downvoters?.includes(auth.currentUser?.uid) ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-red-500 hover:text-white'}`}>
                            <ThumbsDown className="w-4 h-4" />
                            <span>Report as Fake ({course.disagree || 0})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          )}
          {!isselected && (
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Verified Projects</h2>
              {loading ? <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /> : projects.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No projects found.</div>
              ) : (
                <div className="grid gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                            <span className="px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 bg-purple-100/10 text-purple-400 border-purple-400/30">
                              <Code className="w-4 h-4 mt-0.25" /> <span>Project</span>
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ml-2 ${project.publicDecision === 'real' ? 'bg-green-100/10 text-green-400 border-green-400/30' : 'bg-red-100/10 text-red-400 border-red-400/30'}`}>{project.publicDecision === 'real' ? 'Real' : 'Fake'}</span>
                            {project.aiDecision && project.publicDecision !== project.aiDecision && (
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 ml-2">
                                AI: {project.aiDecision}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 mb-2">Provider: {project.provider}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>AI Score: <span className="font-bold text-purple-400">{project.aiScore}/10</span></span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 min-w-[90px]">
                          <div className="text-2xl font-bold text-purple-400 animate-pulse">{project.aiScore}/10</div>
                          <div className="text-gray-400 text-xs">AI Score</div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-gray-300 mb-1">Tech Stack</h4>
                        <p className="text-sm text-gray-400 line-clamp-2">{Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack}</p>
                      </div>
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-gray-300 mb-1">Description</h4>
                        <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
                      </div>
                      {project.aiReason && (
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold text-gray-300 mb-1">AI Analysis</h4>
                          <p className="text-sm text-gray-400">{project.aiReason}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleVote('projects', project.id, 'up')} disabled={voteLoading === project.id + 'up'} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${project.upvoters?.includes(auth.currentUser?.uid) ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-green-500 hover:text-white'}`}>
                            <ThumbsUp className="w-4 h-4" />
                            <span>Report as Real ({project.agree || 0})</span>
                          </button>
                          <button onClick={() => handleVote('projects', project.id, 'down')} disabled={voteLoading === project.id + 'down'} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${project.downvoters?.includes(auth.currentUser?.uid) ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-red-500 hover:text-white'}`}>
                            <ThumbsDown className="w-4 h-4" />
                            <span>Report as Fake ({project.disagree || 0})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          )}
        </>
      )}
      
    </div>
  )
}

export default Home