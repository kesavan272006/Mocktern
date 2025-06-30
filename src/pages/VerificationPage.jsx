import React, { useState } from 'react';
import { database, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import Navbar from '../components/navbar';


const TABS = [
  { label: 'Course', value: 'courses' },
  { label: 'Project', value: 'projects' },
];

const initialForms = {
  courses: {
    title: '',
    price: '',
    contents: '', // comma separated
    provider: '',
  },
  projects: {
    title: '',
    description: '',
    techStack: '', // comma separated
    provider: '',
  }
};

function VoteWidget({ up, down, onUpvote, onDownvote, upLabel = 'Report as Real', downLabel = 'Report as Fake', loading, upvoted, downvoted }) {
  return (
    <div className="flex gap-4 items-center">
      <button
        onClick={onUpvote}
        disabled={loading}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all text-sm ${upvoted ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-700 hover:bg-green-500 hover:text-white'}`}
      >
        <ThumbsUp className="w-4 h-4" /> {upLabel} ({up})
      </button>
      <button
        onClick={onDownvote}
        disabled={loading}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all text-sm ${downvoted ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-700 hover:bg-red-500 hover:text-white'}`}
      >
        <ThumbsDown className="w-4 h-4" /> {downLabel} ({down})
      </button>
    </div>
  );
}

const VerificationPage = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [form, setForm] = useState(initialForms[activeTab]);
  const [loading, setLoading] = useState(false);
  const [aiScore, setAiScore] = useState(null);
  const [aiReason, setAiReason] = useState('');
  const [docId, setDocId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Voting state
  const [agree, setAgree] = useState(0);
  const [disagree, setDisagree] = useState(0);
  const [upvoters, setUpvoters] = useState([]);
  const [downvoters, setDownvoters] = useState([]);

  const [publicDecision, setPublicDecision] = useState(null);

  React.useEffect(() => {
    setForm(initialForms[activeTab]);
    setAiScore(null);
    setAiReason('');
    setDocId(null);
    setSubmitted(false);
    setError('');
    setAgree(0);
    setDisagree(0);
    setUpvoters([]);
    setDownvoters([]);
    setPublicDecision(null);
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- AI Analysis Functions ---
  const getGeminiScore = async (type, data) => {
    let prompt = '';
    if (type === 'courses') {
      prompt = `Rate this course (1-10) based on:\n1. Content depth vs price (₹${data.price})\n2. Syllabus: ${data.contents}\n3. Provider reputation\nReturn a number between 1 - 10, followed by a brief descreption, on why you gave that score. Please ensure that the first character of the answer is a number ranging from 1 to 10.`;
    } else if (type === 'projects') {
      prompt = `Rate this project (1-10) based on:\n1. Tech stack: ${data.techStack}\n2. Description: ${data.description}\n3. Provider reputation\nReturn a number between 1 - 10, followed by a brief descreption, on why you gave that score. Please ensure that the first character of the answer is a number ranging from 1 to 10.`;
    }
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!response.ok) throw new Error('Network error');
    const dataRes = await response.json();
    const text = dataRes.candidates[0].content.parts[0].text;
    return text;
  };

  // --- Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const aiRes = await getGeminiScore(activeTab, form);
      const aiScoreVal = parseInt(aiRes.match(/^\d+/)?.[0] || '0', 10);
      const aiReasonVal = aiRes.replace(/^\d+\s*-\s*/, '');
      let aiDecision = aiScoreVal > 5 ? 'real' : 'fake';
      let saveData = {
        ...form,
        aiScore: aiScoreVal,
        aiReason: aiReasonVal,
        agree: 0,
        disagree: 0,
        upvoters: [],
        downvoters: [],
        provider: form.provider,
        timestamp: serverTimestamp(),
        aiDecision,
        publicDecision: aiDecision,
      };
      if (activeTab === 'courses') {
        saveData.price = Number(form.price);
        saveData.contents = form.contents.split(',').map(s => s.trim());
      } else if (activeTab === 'projects') {
        saveData.techStack = form.techStack.split(',').map(s => s.trim());
      }
      const docRef = await addDoc(collection(database, activeTab), saveData);
      setAiScore(aiScoreVal);
      setAiReason(aiReasonVal);
      setAgree(0);
      setDisagree(0);
      setUpvoters([]);
      setDownvoters([]);
      setDocId(docRef.id);
      setSubmitted(true);
      setPublicDecision(aiDecision);
    } catch (err) {
      setError('Error submitting: ' + err.message);
    }
    setLoading(false);
  };

  // --- Voting Handler ---
  const handleVote = async (voteType) => {
    if (!docId) return;
    const currentUser = auth.currentUser;
    if (!currentUser) {
        setError("You must be logged in to vote.");
        return;
    }
    setLoading(true);
    try {
        const ref = doc(database, activeTab, docId);
        let currentUpvoters = [...upvoters];
        let currentDownvoters = [...downvoters];
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
        } else if (voteType === 'down') {
            if (isDownvoted) {
                currentDownvoters = currentDownvoters.filter(uid => uid !== currentUser.uid);
            } else {
                currentDownvoters.push(currentUser.uid);
                if (isUpvoted) {
                    currentUpvoters = currentUpvoters.filter(uid => uid !== currentUser.uid);
                }
            }
        }
        // Fetch aiDecision for this doc
        const snap = await getDoc(ref);
        let aiDecision = 'real';
        if (snap.exists() && snap.data().aiDecision) {
          aiDecision = snap.data().aiDecision;
        }
        // Calculate new publicDecision
        let newPublicDecision = aiDecision;
        if (currentUpvoters.length > currentDownvoters.length) {
          newPublicDecision = 'real';
        } else if (currentDownvoters.length > currentUpvoters.length) {
          newPublicDecision = 'fake';
        }
        await updateDoc(ref, {
            upvoters: currentUpvoters,
            downvoters: currentDownvoters,
            agree: currentUpvoters.length,
            disagree: currentDownvoters.length,
            publicDecision: newPublicDecision,
        });
        setAgree(currentUpvoters.length);
        setDisagree(currentDownvoters.length);
        setUpvoters(currentUpvoters);
        setDownvoters(currentDownvoters);
        setPublicDecision(newPublicDecision);
    } catch (err) {
        setError('Voting error: ' + err.message);
    }
    setLoading(false);
  };

  // --- Form Renderers ---
  const renderForm = () => {
    if (activeTab === 'courses') {
      return (
        <>
          
          <div>
            <label className="text-gray-200 mb-1 block">Course Title*</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Offered By*</label>
            <input name="provider" value={form.provider} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Price (INR)*</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Syllabus/Contents (comma separated)*</label>
            <input name="contents" value={form.contents} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
        </>
      );
    } else if (activeTab === 'projects') {
      return (
        <>
        
          <div>
            <label className="text-gray-200 mb-1 block">Project Title*</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Offered By*</label>
            <input name="provider" value={form.provider} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Tech Stack (comma separated)*</label>
            <input name="techStack" value={form.techStack} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Description*</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className='bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center py-8 px-2">
      
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl flex flex-col items-center">
        <div className="flex gap-4 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === tab.value ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-cyan-500 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          {renderForm()}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze & Submit'}
          </button>
          {error && <div className="text-red-400 text-center mt-2">{error}</div>}
        </form>
        {submitted && (
          <div className="w-full flex flex-col items-center justify-center mt-8">
            <div className="flex flex-col items-center mb-4">
              <div className="text-3xl font-bold text-cyan-400">AI Score: {aiScore}/10</div>
              <div className="text-white py-2 text-center">{aiReason}</div>
              <div className="text-lg mt-2 font-bold text-white">Current Decision: <span className={publicDecision === 'real' ? 'text-green-400' : 'text-red-400'}>{publicDecision === 'real' ? 'Real' : 'Fake'}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default VerificationPage;
 