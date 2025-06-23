import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/home'
import Landing from './pages/landing'
import Signin from './pages/signin'
import Profile from './pages/profile'
import Predict from './pages/predict'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Home />} path='/home' />
        <Route element={<Landing />} path='/' />
        <Route element={<Signin />} path='/signin' />
        <Route element={<Profile />} path='/profile' />
        <Route element={<Predict />} path='/predict' />
      </Routes>
    </Router>
  )
}

export default App  