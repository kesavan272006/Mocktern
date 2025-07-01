import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { database, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Predict = () => {

  const [form, setForm] = useState({
    company: '',
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
  });

  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [geminiReply, setGeminiReply] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRadio = (val) => {
    setForm({ ...form, askedToPay: val });
  };

  const checkExistingEntry = async () => {
    if (!form.company || !form.position || !form.contact) return;
    
    setCheckingExisting(true);
    try {
      const q = query(
        collection(database, "Internships"),
        where("company", "==", form.company),
        where("position", "==", form.position),
        where("contact", "==", form.contact)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const existing = querySnapshot.docs[0].data();
        setExistingEntry({
          id: querySnapshot.docs[0].id,
          ...existing
        });
      } else {
        setExistingEntry(null);
      }
    } catch (error) {
      console.error('Error checking existing entry:', error);
    }
    setCheckingExisting(false);
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (form.company && form.position && form.contact) {
        checkExistingEntry();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [form.company, form.position, form.contact]);

  const getAIScore = async () => {
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this internship opportunity for potential scams. Consider these factors:
                - Company: ${form.company}
                - Position: ${form.position}
                - Website: ${form.website}
                - Contact: ${form.contact}
                - Description: ${form.description}
                - Requirements: ${form.requirements || "The user didnt specify about this section, and left it blank"}
                - Duration : ${form.duration || "The user didnt specify about this section, and left it blank"}
                - Stripend: ${form.stipend || "The user didnt specify about this section, and left it blank"}
                -location : ${form.location || "The user didnt specify about this section, and left it blank"}}
                - Interview Process: ${form.interviewProcess}
                - OfferLetter contents: ${form.offerLetter || "The user didnt specify about this section, and left it blank"} 
                - Asked to pay: ${form.askedToPay || "The user didnt specify about this section, and left it blank"}}
                - Payment details: ${form.paymentAmount || "The user didnt specify about this section, and left it blank"}}
                - Unsual requests: ${form.unusualRequests || "The user didnt specify about this section, and left it blank"}}
                - Recruiter Behaviour : ${form.recruiterBehavior}
                - Additional Notes: ${form.other}
                if the position is Web developer intern or Junior AI developer or Frontend developer or something like that then make sure you give double attention on it because nowadays web developer interns are less in number because AI is doing all their jobs. so make sure to inform them about this.
                
                Return ONLY a number between 0 and 10 (0 = definitely fake, 10 = definitely real). Make your answer short, dont limit it to just a number, give a reason in a sentence or two. Please ensure that the first character of the answer is a number ranging from 0 to 10`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botResponse = data.candidates[0].content.parts[0].text;

      return botResponse;

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  const saveToDatabase = async (aiScore, aiDecision, aiReason) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const internshipData = {
      ...form,
      aiScore: aiScore,
      aiDecision: aiDecision,
      aiReason: aiReason,
      publicDecision: aiDecision, 
      agree: 0,
      disagree: 0,
      upvoters: [],
      downvoters: [],
      reportedBy: currentUser.username || 'Anonymous',
      reportedByUID: currentUser.uid,
      timestamp: serverTimestamp(),
      reports: 1
    };

    const docRef = await addDoc(collection(database, "Internships"), internshipData);
    return docRef.id;
  };

  const updateExistingEntry = async (entryId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const entryRef = doc(database, "Internships", entryId);
    const entrySnap = await getDoc(entryRef);
    
    if (entrySnap.exists()) {
      const currentData = entrySnap.data();
      const newReports = (currentData.reports || 0) + 1;
      
      await updateDoc(entryRef, {
        reports: newReports,
        lastUpdated: serverTimestamp()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (existingEntry) {
        await updateExistingEntry(existingEntry.id);
        setResult(existingEntry.publicDecision);
        setScore(existingEntry.aiScore);
        setGeminiReply(existingEntry.aiReason);
        setSubmitted(true);
        setLoading(false);
        return;
      }
      const result = await getAIScore();
      console.log('Server response:', result);
      const aiScore = parseInt(result[0]);
      const aiDecision = aiScore > 5 ? 'real' : 'fake';
      const aiReason = result.substring(2);
      await saveToDatabase(aiScore, aiDecision, aiReason);

      setScore(aiScore);
      setResult(aiDecision);
      setGeminiReply(aiReason);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm({
      company: '',
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
    });
    setScore(null);
    setResult(null);
    setError('');
    setSubmitted(false);
    setGeminiReply('');
    setExistingEntry(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-2 py-8 md:py-16 w-full">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl flex flex-col items-center">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Check Internship Authenticity</h2>
          {existingEntry && (
            <div className="w-full mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Similar Entry Found</span>
              </div>
              <p className="text-yellow-200 text-sm">
                This internship has been reported before. AI Score: {existingEntry.aiScore}/10 
                ({existingEntry.publicDecision === 'real' ? 'Legitimate' : 'Fake'})
              </p>
              <p className="text-yellow-200 text-sm mt-1">
                Reports: {existingEntry.reports || 1} | 
                Agree: {existingEntry.agree || 0} | 
                Disagree: {existingEntry.disagree || 0}
              </p>
            </div>
          )}

          {checkingExisting && (
            <div className="w-full mb-4 flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking for existing entries...</span>
            </div>
          )}

          {!submitted && (
            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-gray-200 mb-1 block">Company Name*</label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Position Title*</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Company Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  type="url"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Contact Email/Phone*</label>
                <input
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-gray-200 mb-1 block">Internship Description*</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Requirements/Qualifications</label>
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-200 mb-1 block">Duration</label>
                  <input
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="3 months, 6 months, etc."
                  />
                </div>

                <div>
                  <label className="text-gray-200 mb-1 block">Stipend/Salary</label>
                  <input
                    name="stipend"
                    value={form.stipend}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="Amount per month"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Location (Remote / Online)</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-gray-200 mb-1 block">Interview Process*</label>
                <textarea
                  name="interviewProcess"
                  value={form.interviewProcess}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                  placeholder="Describe the interview rounds, questions asked, etc."
                />
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Offer Letter Contents*</label>
                <textarea
                  name="offerLetter"
                  value={form.offerLetter}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                  placeholder="Paste the full contents of the offer letter"
                />
              </div>
              <div>
                <label className="text-gray-200 mb-1 block">Were you asked to pay any money?*</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleRadio('Yes')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${form.askedToPay === 'Yes' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-red-500 hover:text-white'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRadio('No')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${form.askedToPay === 'No' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-green-500 hover:text-white'}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {form.askedToPay === 'Yes' && (
                <div>
                  <label className="text-gray-200 mb-1 block">Payment Details</label>
                  <input
                    name="paymentAmount"
                    value={form.paymentAmount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="Amount, purpose, payment method, etc."
                  />
                </div>
              )}

              <div>
                <label className="text-gray-200 mb-1 block">Unusual Requests</label>
                <textarea
                  name="unusualRequests"
                  value={form.unusualRequests}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                  placeholder="Any strange requests or requirements?"
                />
              </div>

              <div>
                <label className="text-gray-200 mb-1 block">Recruiter Behavior</label>
                <textarea
                  name="recruiterBehavior"
                  value={form.recruiterBehavior}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                  placeholder="How did the recruiter communicate? Any red flags?"
                />
              </div>
              <div>
                <label className="text-gray-200 mb-1 block">Additional Notes (optional)</label>
                <textarea
                  name="other"
                  value={form.other}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : existingEntry ? 'View Existing Report' : 'Verify Internship'}
              </button>

              {error && <div className="text-red-400 text-center mt-2">{error}</div>}
            </form>
          )}
          {submitted && (
            <div className="w-full flex flex-col items-center justify-center">
              <div className={`flex flex-col items-center justify-center mb-6 w-full animate-fade-in`}>
                {result === 'real' ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-16 h-16 text-green-400 animate-bounce mb-2" />
                    <div className="text-4xl font-bold text-green-400">{score}/10</div>
                    <div className='text-white py-2 ml-4 text-center'>{geminiReply}</div>
                    <div className="text-lg text-white mt-2">Looks Legit!</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <XCircle className="w-16 h-16 text-red-400 animate-bounce mb-2" />
                    <div className="text-4xl font-bold text-red-400">{score}/10</div>
                    <div className='text-white py-2 ml-4 text-center'>{geminiReply}</div>
                    <div className="text-lg text-white mt-2">Likely Fake Internship</div>
                  </div>
                )}
              </div>
              <button onClick={resetForm} className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all border border-white/20 mb-2">Check Another</button>
              <button onClick={() => window.location.href = '/home'} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg">Go to Home</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Predict; 