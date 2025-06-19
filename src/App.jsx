import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/home'
import Landing from './pages/landing'
import Signin from './pages/signin'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Home />} path='/home' />
        <Route element={<Landing />} path='/' />
        <Route element={<Signin />} path='/signin' />
      </Routes>
    </Router>
  )
}

export default App  