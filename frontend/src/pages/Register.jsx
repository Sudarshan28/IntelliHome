import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        alert(data.msg || data.error || 'Registration failed. Please check the backend connection.');
      }
    } catch (err) {
      alert('Network error: Could not reach the server.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 bg-brand-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl w-full max-w-md z-10 border border-white/10"
      >
        <h2 className="text-3xl font-bold mb-2 text-white">Create Account</h2>
        <p className="text-gray-400 mb-8">Join IntelliHome to automate your life.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div whileFocus={{ scale: 1.02 }} className="origin-left">
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input 
              type="text" 
              className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </motion.div>
          <motion.div whileFocus={{ scale: 1.02 }} className="origin-left">
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </motion.div>
          <motion.div whileFocus={{ scale: 1.02 }} className="origin-left">
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(20,184,166,0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-brand-500 text-white font-medium py-3 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.3)] mt-4 transition-all"
          >
            Sign Up
          </motion.button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
