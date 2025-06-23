import React, { useState } from 'react';
import Navbar from '../components/navbar';
import { database, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GEMINI_API_KEY = 'AIzaSyBXV-FGg8hpDOfp1VfiHKHFeWzBZkedk4g';

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
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRadio = (val) => {
    setForm({ ...form, askedToPay: val });
  };
  const getAIScore = async (formData) => {
  const prompt = `Analyze this internship opportunity for potential scams. Consider these factors:
  - Company: ${formData.company}
  - Position: ${formData.position}
  - Website: ${formData.website}
  - Contact: ${formData.contact}
  - Description: ${formData.description}
  - Requirements: ${formData.requirements}
  - Asked to pay: ${formData.askedToPay}
  
  Return ONLY a number between 0-10 (0=definitely fake, 10=definitely real)`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS",
            threshold: "BLOCK_NONE",
          }
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error('API request failed');
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) throw new Error('Empty response from AI');
    
    // Extract first number found in response
    const scoreMatch = responseText.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 5; // Default to 5 if no number found
    
    return Math.min(Math.max(score, 0), 10); // Clamp between 0-10
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return 5; // Return neutral score on error
  }
};
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const score = await getAIScore(form);
    setScore(score);
    setResult(score < 6 ? 'fake' : 'real');
    setSubmitted(true);
    
    // Store in Firestore
    const user = auth.currentUser;
    await addDoc(collection(database, 'InternshipReports'), {
      ...form,
      score,
      reportedBy: user?.displayName || user?.email || 'Anonymous',
      createdAt: serverTimestamp(),
      status: score < 5 ? 'likely_fake' : 'likely_real'
    });
    
  } catch (err) {
    setError('Analysis failed. Please try again.');
    console.error(err);
  } finally {
    setLoading(false);
  }
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-2 py-8 md:py-16 w-full">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl flex flex-col items-center">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Check Internship Authenticity</h2>
          {!submitted && (
              <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* Basic Information */}
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

                {/* Internship Details */}
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
                  <label className="text-gray-200 mb-1 block">Location (or Remote)</label>
                  <input 
                    name="location" 
                    value={form.location} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent" 
                  />
                </div>

                {/* Interview & Selection Process */}
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
                    required
                    rows={4} 
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none" 
                    placeholder="Paste the full contents of the offer letter"
                  />
                </div>

                {/* Red Flag Indicators */}
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
                      name="paymentDetails" 
                      value={form.paymentDetails} 
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

                {/* Final Submission */}
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
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Internship'}
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
                    <div className="text-lg text-white mt-2">Looks Legit!</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <XCircle className="w-16 h-16 text-red-400 animate-bounce mb-2" />
                    <div className="text-4xl font-bold text-red-400">{score}/10</div>
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