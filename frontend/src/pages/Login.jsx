import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/api';
import './styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/api/auth/login", { email, password });
  
      if (response.data.success) {
        const userData = {
          _id: response.data.user._id,
          username: response.data.user.username,
          token: response.data.token
        };
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className='login-container'>
      <div className="container">
        <form className="loginform" onSubmit={handleSubmit}>
          <p>Login Form</p>
          <div className="form">
            <div className="infos">
              <div className="icon-input">
                <button className="icon"><i className='bx bxs-user'></i></button>
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
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="button">
              <button className="login" type="submit">Login</button>   
            </div>
            <div className="signup">
              <p>Not a member? <a href="/register" className="signup">Signup now</a></p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
