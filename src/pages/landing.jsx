import React from 'react'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
    const navigate = useNavigate();
  return (
    <div>
      <h1>Welcome to Mocktern</h1>
      <button onClick={()=>navigate('/signin')}>click here</button>
    </div>
  )
}

export default Landing
