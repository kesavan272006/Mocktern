# Mocktern - Internship & Course Verification Platform

A crowdsourced verification platform powered by AI and community voting to protect students from fake internships, scam courses, and unrealistic opportunities.

## 🌟 Features

### 🔍 AI-Powered Analysis
- **Gemini AI Integration**: Advanced AI analysis of internships and courses
- **Smart Scoring**: 0-10 scoring system with detailed reasoning
- **Red Flag Detection**: Automatic identification of scam patterns

### 👥 Community Verification
- **Crowdsourced Voting**: Community members vote on AI assessments
- **Public Decision Making**: 70% agreement threshold for final verification
- **Real-time Updates**: Live voting and score updates

### 📊 Comprehensive Database
- **Internship Verification**: Check company legitimacy, offer letters, payment requests
- **Course Analysis**: Evaluate content depth, pricing, and provider reputation
- **Project Verification**: Assess technical projects and their authenticity

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on all devices
- **Gradient Backgrounds**: Beautiful glass-morphism design
- **Smooth Animations**: Enhanced user experience with loading states

## 🚀 Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Firebase Firestore, Firebase Authentication
- **AI**: Google Gemini API
- **Deployment**: Vercel

## 📁 Project Structure

```
Mocktern/
├── src/
│   ├── components/
│   │   ├── navbar.jsx          # Navigation component
│   │   └── footer.jsx          # Footer component
│   ├── pages/
│   │   ├── landing.jsx         # Landing page with hero section
│   │   ├── home.jsx            # Main dashboard
│   │   ├── predict.jsx         # Internship verification form
│   │   ├── VerificationPage.jsx # Course/Project verification
│   │   └── signin.jsx          # Authentication
│   ├── config/
│   │   └── firebase.js         # Firebase configuration
│   └── App.jsx                 # Main app component
├── .env                        # Environment variables
├── package.json
└── README.md
```

## 🎯 How It Works

### For Internships (0-10 Scale)
1. **Submit Details**: Company, position, offer letter, contact info
2. **AI Analysis**: Gemini AI analyzes for scam patterns and red flags
3. **Community Vote**: Users vote to agree/disagree with AI assessment
4. **Final Decision**: Public decision based on community consensus

### For Courses & Projects (1-10 Scale)
1. **Submit Information**: Title, provider, price, syllabus/tech stack
2. **AI Evaluation**: Analysis of content depth vs. pricing
3. **Score Display**: Detailed reasoning with improvement suggestions

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Google Gemini API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Mocktern.git
cd Mocktern
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Add your domain to authorized domains

### 5. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 6. Start Development Server
```bash
npm start
```

Visit `http://localhost:3000` to see the application.


## 📱 Key Pages

### Landing Page (`/`)
- Hero section with animated statistics
- Search functionality with real-time filtering
- Recent verifications showcase
- "How It Works" section

### Dashboard (`/home`)
- Toggle between internships and courses/projects
- Comprehensive statistics and filtering
- Community voting interface
- Real-time updates

### Verification Pages
- **Internship Check** (`/predict`): Detailed form for internship analysis
- **Course/Project Verify** (`/verification`): Multi-tab interface for courses and projects

## 🔒 Security Features

- **Environment Variables**: API keys secured in `.env`
- **Firebase Rules**: Database security with user authentication
- **Input Validation**: Client-side and server-side validation
- **Rate Limiting**: Prevents API abuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📊 Database Collections

### Internships Collection
```javascript
{
  company: "Company Name",
  position: "Position Title",
  aiScore: 7,
  aiReason: "Analysis reasoning",
  aiDecision: "real",
  publicDecision: "real",
  agree: 15,
  disagree: 3,
  upvoters: ["uid1", "uid2"],
  downvoters: ["uid3"],
  timestamp: "Firebase Timestamp"
}
```

### Courses Collection
```javascript
{
  title: "Course Title",
  provider: "Provider Name",
  price: 2999,
  aiScore: 8,
  aiReason: "Analysis reasoning",
  contents: "Course syllabus",
  timestamp: "Firebase Timestamp"
}
```

## 🐛 Known Issues

- Audio/video play() interruption warnings (browser auto-play policies)
- API rate limiting on high traffic
- Mobile responsive improvements needed for complex forms


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- [Kesavan G](https://github.com/kesavan272006)
- [Aditya A](https://github.com/theblag)


## 🌐 Live Demo

Visit the live application: [Mocktern Platform](https://mocktern.vercel.app/)

## 📞 Support

For support, email support@mocktern.com or join our community Discord.

---

**Made with ❤️ to protect students from fake opportunities**