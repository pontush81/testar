import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, User, Home, AlertCircle } from 'lucide-react';

interface RegisterProps {
  darkMode: boolean;
}

const Register: React.FC<RegisterProps> = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Register the user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            apartment,
            role: 'member' // Default role
          }
        }
      });

      if (authError) throw authError;
      
      if (authData.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: authData.user.id,
              email,
              full_name: fullName,
              apartment,
              role: 'member' // Default role
            }
          ]);
          
        if (profileError) throw profileError;
      }
      
      // Redirect to login page with success message
      navigate('/login');
    } catch (error: any) {
      setError(error.message || 'Ett fel uppstod vid registrering');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <div className={`w-full max-w-md p-6 md:p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-2xl font-bold mb-6 text-center">Registrera konto</h2>
        
        {error && (
          <div className={`p-3 mb-4 rounded-md flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">E-post</label>
            <div className="relative">
              <Mail size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 p-2.5 rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-blue-500`}
                placeholder="din@email.se"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Lösenord</label>
            <div className="relative">
              <Lock size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 p-2.5 rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-blue-500`}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <p className="text-xs mt-1 text-gray-500">Minst 6 tecken</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Fullständigt namn</label>
            <div className="relative">
              <User size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full pl-10 p-2.5 rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-blue-500`}
                placeholder="Anna Andersson"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Lägenhetsnummer</label>
            <div className="relative">
              <Home size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className={`w-full pl-10 p-2.5 rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-blue-500`}
                placeholder="1001"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-md bg-blue-600 text-white font-medium ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registrerar...
              </span>
            ) : 'Registrera'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p>
            Har du redan ett konto?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;