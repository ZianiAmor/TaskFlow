//frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/api';
import './styles/Login.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const[region,setRegion]=useState("")
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/auth/register', { username, email, password,region });
  
      if (response.data.success) {
        const userData = {
          _id: response.data.user._id,
          username: response.data.user.username,
          token: response.data.token,
          region: response.data.user.region  // include the region

        };
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className='login-container'>
      <div className="container">
        <form className="loginform" onSubmit={handleSubmit}>
          <p>Register</p>
          <div className="form">
            <div className="infos">
              <div className="icon-input">
                <button className="icon"><i className='bx bxs-user'></i></button>
                <input type="text" className="enter" placeholder="Username" value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="icon-input">
                <button className="icon"><i className='bx bxs-envelope'></i></button>
                <input type="email" className="enter" placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="icon-input">
                <button className="icon"><i className='bx bx-lock-alt'></i></button>
                <input type="password" className="enter" placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="icon-input">
              <button className="icon"><i className='bx bxs-map'></i></button>
              <input
                type="text"
                className="enter"
                placeholder="Region (e.g. London)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              />
            </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="button">
              <button className="login" type="submit">Register</button>   
            </div>
            <div className="signup">
              <p>Already have an account? <a href="/login" className="signup">Login now</a></p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
