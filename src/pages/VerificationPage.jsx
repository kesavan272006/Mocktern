import React, { useState } from 'react';
import { database, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

const TABS = [
  { label: 'Course', value: 'courses' },
  { label: 'Project', value: 'projects' },
];

const initialForms = {
  internships: {
    provider: '', // company
    position: '',
    website: '',
    contact: '',
    description: '',
    requirements: '',
    duration: '',
    stipend: '',
    location: '',
    interviewProcess: '',
    offerLetter: '',
    askedToPay: '',
    paymentAmount: '',
    unusualRequests: '',
    recruiterBehavior: '',
    other: ''
  },
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

function VoteWidget({ up, down, onUpvote, onDownvote, upLabel = 'Upvote', downLabel = 'Downvote', loading }) {
  return (
    <div className="flex gap-4 items-center">
      <button
        onClick={onUpvote}
        disabled={loading}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all text-sm bg-green-500/20 text-green-700 hover:bg-green-500 hover:text-white`}
      >
        <ThumbsUp className="w-4 h-4" /> {upLabel} ({up})
      </button>
      <button
        onClick={onDownvote}
        disabled={loading}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all text-sm bg-red-500/20 text-red-700 hover:bg-red-500 hover:text-white`}
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
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [docId, setDocId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setForm(initialForms[activeTab]);
    setAiScore(null);
    setAiReason('');
    setVotes({ up: 0, down: 0 });
    setDocId(null);
    setSubmitted(false);
    setError('');
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- AI Analysis Functions ---
  const getGeminiScore = async (type, data) => {
    let prompt = '';
    if (type === 'courses') {
      prompt = `Rate this course (1-10) based on:\n1. Content depth vs price ($${data.price})\n2. Syllabus: ${data.contents}\n3. Provider reputation\nReturn ONLY the number.`;
    } else if (type === 'projects') {
      prompt = `Rate this project (1-10) based on:\n1. Tech stack: ${data.techStack}\n2. Description: ${data.description}\n3. Provider reputation\nReturn ONLY the number.`;
    } else {
      // internships
      prompt = `Analyze this internship opportunity for potential scams.\n- Provider: ${data.provider}\n- Position: ${data.position}\n- Website: ${data.website}\n- Contact: ${data.contact}\n- Description: ${data.description}\n- Requirements: ${data.requirements}\n- Duration: ${data.duration}\n- Stipend: ${data.stipend}\n- Location: ${data.location}\n- Interview Process: ${data.interviewProcess}\n- Offer Letter: ${data.offerLetter}\n- Asked to pay: ${data.askedToPay}\n- Payment details: ${data.paymentAmount}\n- Unusual requests: ${data.unusualRequests}\n- Recruiter Behaviour: ${data.recruiterBehavior}\n- Additional Notes: ${data.other}\nReturn ONLY a number between 0 and 10 (0 = definitely fake, 10 = definitely real). Make your answer short, give a reason in a sentence or two. Please ensure that the first character of the answer is a number ranging from 0 to 10`;
    }
    const API_KEY = 'AIzaSyD6m3mj3D7M-6W2G_CkGAaEhXX7E-AXYfw';
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
      let aiScoreVal = null;
      let aiReasonVal = '';
      let docRef = null;
      let saveData = {};
      if (activeTab === 'courses') {
        const aiRes = await getGeminiScore('courses', form);
        aiScoreVal = parseInt(aiRes[0]);
        aiReasonVal = aiRes.substring(2);
        saveData = {
          ...form,
          price: Number(form.price),
          contents: form.contents.split(',').map(s => s.trim()),
          aiScore: aiScoreVal,
          aiReason: aiReasonVal,
          votes: { up: 0, down: 0 },
          provider: form.provider,
          timestamp: serverTimestamp(),
        };
        docRef = await addDoc(collection(database, 'courses'), saveData);
      } else if (activeTab === 'projects') {
        const aiRes = await getGeminiScore('projects', form);
        aiScoreVal = parseInt(aiRes[0]);
        aiReasonVal = aiRes.substring(2);
        saveData = {
          ...form,
          techStack: form.techStack.split(',').map(s => s.trim()),
          aiScore: aiScoreVal,
          aiReason: aiReasonVal,
          votes: { up: 0, down: 0 },
          provider: form.provider,
          timestamp: serverTimestamp(),
        };
        docRef = await addDoc(collection(database, 'projects'), saveData);
      } else {
        // internships
        const aiRes = await getGeminiScore('internships', form);
        aiScoreVal = parseInt(aiRes[0]);
        aiReasonVal = aiRes.substring(2);
        saveData = {
          ...form,
          aiScore: aiScoreVal,
          aiReason: aiReasonVal,
          votes: { up: 0, down: 0 },
          provider: form.provider,
          timestamp: serverTimestamp(),
        };
        docRef = await addDoc(collection(database, 'internships'), saveData);
      }
      setAiScore(aiScoreVal);
      setAiReason(aiReasonVal);
      setVotes({ up: 0, down: 0 });
      setDocId(docRef.id);
      setSubmitted(true);
    } catch (err) {
      setError('Error submitting: ' + err.message);
    }
    setLoading(false);
  };

  // --- Voting Handler ---
  const updateVotes = async (col, id, delta) => {
    if (!id) return;
    setLoading(true);
    try {
      const ref = doc(database, col, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      let up = data.votes?.up || 0;
      let down = data.votes?.down || 0;
      if (delta === 1) up += 1;
      if (delta === -1) down += 1;
      await updateDoc(ref, { votes: { up, down } });
      setVotes({ up, down });
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
            <label className="text-gray-200 mb-1 block">Price (USD)*</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Syllabus/Contents (comma separated)*</label>
            <input name="contents" value={form.contents} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
        </>
      );
    } else if (activeTab === 'internships'){
      return (
        <>
          <div>
            <label className="text-gray-200 mb-1 block">Provider*</label>
            <input name="provider" value={form.provider} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Position Title*</label>
            <input name="position" value={form.position} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Website</label>
            <input name="website" value={form.website} onChange={handleChange} type="url" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="https://" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Contact Email/Phone*</label>
            <input name="contact" value={form.contact} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Internship Description*</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Requirements/Qualifications</label>
            <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-200 mb-1 block">Duration</label>
              <input name="duration" value={form.duration} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="3 months, 6 months, etc." />
            </div>
            <div>
              <label className="text-gray-200 mb-1 block">Stipend/Salary</label>
              <input name="stipend" value={form.stipend} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="Amount per month" />
            </div>
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Location (Remote / Online)</label>
            <input name="location" value={form.location} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Interview Process*</label>
            <textarea name="interviewProcess" value={form.interviewProcess} onChange={handleChange} required rows={2} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="Describe the interview rounds, questions asked, etc." />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Offer Letter Contents*</label>
            <textarea name="offerLetter" value={form.offerLetter} onChange={handleChange} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="Paste the full contents of the offer letter" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Were you asked to pay any money?*</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setForm(f => ({ ...f, askedToPay: 'Yes' }))} className={`px-4 py-2 rounded-lg font-medium transition-all ${form.askedToPay === 'Yes' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-red-500 hover:text-white'}`}>Yes</button>
              <button type="button" onClick={() => setForm(f => ({ ...f, askedToPay: 'No' }))} className={`px-4 py-2 rounded-lg font-medium transition-all ${form.askedToPay === 'No' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-green-500 hover:text-white'}`}>No</button>
            </div>
          </div>
          {form.askedToPay === 'Yes' && (
            <div>
              <label className="text-gray-200 mb-1 block">Payment Details</label>
              <input name="paymentAmount" value={form.paymentAmount} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="Amount, purpose, payment method, etc." />
            </div>
          )}
          <div>
            <label className="text-gray-200 mb-1 block">Unusual Requests</label>
            <textarea name="unusualRequests" value={form.unusualRequests} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="Any strange requests or requirements?" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Recruiter Behavior</label>
            <textarea name="recruiterBehavior" value={form.recruiterBehavior} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" placeholder="How did the recruiter communicate? Any red flags?" />
          </div>
          <div>
            <label className="text-gray-200 mb-1 block">Additional Notes (optional)</label>
            <textarea name="other" value={form.other} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          </div>
        </>
      );
    } else {
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
  };

  return (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
 