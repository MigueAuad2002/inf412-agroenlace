import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoAgro from '../assets/LOGO.png'; 

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas. Intente de nuevo.');
      }

      const data = await response.json();
      console.log('Login exitoso:', data);
      
      // Guardamos el token (luego usaremos Zustand, por ahora localStorage)
      localStorage.setItem('token', data.token);
      navigate('/dashboard'); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D9F0FB] flex items-center justify-center p-4 font-sans antialiased">
      
      {/* Tarjeta de Login */}
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md border border-white/20 relative overflow-hidden">
        
        {/* Decoración sutil superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#5B9D1E]"></div>

        {/* Logo y Encabezado */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoAgro} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-xl shadow-sm hover:scale-105 transition-transform cursor-pointer" />
          </Link>
          <h2 className="text-3xl font-black text-[#1A5729] tracking-tight">Bienvenido</h2>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-1 opacity-70">Acceso Institucional</p>
        </div>

        {/* Mensaje de Error con estilo profesional */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-6 text-sm flex items-center animate-shake">
            <span className="font-bold mr-2">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Input Correo */}
          <div>
            <label className="block text-xs font-bold text-[#1A5729] uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B9D1E] focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder:text-gray-400 text-sm"
              placeholder="nombre@empresa.com"
            />
          </div>

          {/* Input Contraseña */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-[#1A5729] uppercase tracking-wider">
                Contraseña
              </label>
              <a href="#" className="text-[10px] font-bold text-[#5B9D1E] uppercase hover:underline">¿Olvidaste tu clave?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B9D1E] focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder:text-gray-400 text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Botón de Acción con efecto de carga */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2D6A4F] hover:bg-[#1B4332] hover:shadow-[#2D6A4F]/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Autenticando...
              </span>
            ) : "INGRESAR AL SISTEMA"}
          </button>
        </form>

        {/* Pie de la tarjeta */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 font-medium">
            ¿Aún no tienes acceso?{' '}
            <Link to="/register" className="text-[#5B9D1E] font-bold hover:text-[#1A5729] transition-colors">
              SOLICITAR CUENTA
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}