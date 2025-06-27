import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { database, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';


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

  // const [form, setForm] = useState({
  //   company: 'BrightTech Solutions',
  //   position: 'Frontend Development Intern',
  //   website: 'https://brighttech.in',
  //   contact: 'hr@brighttech.in',
  //   description: 'A 3-month internship where you’ll assist in developing UI components for client projects.',
  //   requirements: 'Knowledge of HTML, CSS, JavaScript. React is a plus.',
  //   duration: '3 months',
  //   stipend: '₹5000/month',
  //   location: 'Remote',
  //   interviewProcess: 'One round of online technical interview.',
  //   offerLetter: 'Yes',
  //   askedToPay: 'No',
  //   paymentAmount: '₹0',
  //   unusualRequests: 'None',
  //   recruiterBehavior: 'Professional and responsive during communication.',
  //   other: 'The internship is listed on Internshala and company has a verified LinkedIn profile.'
  // });

  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [geminiReply, setGeminiReply] = useState('');
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
  // ...existing code...
  const getAIScore = async () => {
    try {
      const API_KEY = 'AIzaSyD6m3mj3D7M-6W2G_CkGAaEhXX7E-AXYfw'; // Replace with your actual key

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


      return botResponse

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    setError('');

    try {
      const result = await getAIScore();
      console.log('Server response:', result); // This will show the actual data
      console.log('Score:', result[0])
      setScore(parseInt(result[0]))

      const trimmedReply = result.substring(2);
      setGeminiReply(trimmedReply)
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
    setSubmitted(true)
    if(score > 5){
      setResult('real')
    }
    else{
      setResult('fake')
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
    setGeminiReply('');
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
                <label className="text-gray-200 mb-1 block">Location (Remote / Online)</label>
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
                    <div className='text-white py-2 ml-4'>{geminiReply}</div>
                    <div className="text-lg text-white mt-2">Looks Legit!</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <XCircle className="w-16 h-16 text-red-400 animate-bounce mb-2" />
                    <div className="text-4xl font-bold text-red-400">{score}/10</div>
                    <div className='text-white py-2 ml-4'>{geminiReply}</div>
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