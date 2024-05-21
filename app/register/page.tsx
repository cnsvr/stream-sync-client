'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const Register = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, { fullName, email, password });
      router.push('/login');
    } catch (error: any) {
      setMessage('Error: ' + error.response?.data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl mb-4">Register</h1>
        <form onSubmit={handleSubmit} className="bg-transparent">
        <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded bg-white text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded bg-white text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded bg-white text-black"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 bg-blue-600 text-white p-2 rounded">Register</button>
          <p className="mt-4 text-center">Already have an account? <Link href="/login" className='text-blue-500'>Login here</Link></p>
        </form>
        {message && <p className="mt-4 text-red-500">{message}</p>}
      </div>
    </div>

    
  );
};

export default Register;
