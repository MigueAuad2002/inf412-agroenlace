import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function SecurityUsers() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); // Por si el token expiró
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Efecto para cargar los usuarios al abrir la pantalla
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`${API_URL}/get-users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <- AQUÍ VA TU PASE VIP
          }
        });

        const data = await response.json();

        // Validación de expiración de token o falta de permisos
        if (response.status === 401) {
          logout();
          window.location.href = '/login';
          return;
        }

        if (!data.success) {
          throw new Error(data.message || 'Error al obtener usuarios');
        }

        // Asumimos que tu backend devuelve los datos en data.list_users (o data.data)
        setUsuarios(data.list_users || data.data || []);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [API_URL, token, logout]);

  // Filtro inteligente en tiempo real
  const usuariosFiltrados = usuarios.filter((user) => {
    const termino = searchTerm.toLowerCase();
    // Busca coincidencias en nombre, usuario o documento
    return (
      (user.nombre_razon_social && user.nombre_razon_social.toLowerCase().includes(termino)) ||
      (user.user_name && user.user_name.toLowerCase().includes(termino)) ||
      (user.documento_identidad && user.documento_identidad.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-black text-gray-800 dark:text-white">Directorio de Usuarios</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Gestión de cuentas con acceso al sistema.</p>
        </div>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors">
          + Nuevo Usuario
        </button>
      </div>

      {/* Mensaje de Error de Red */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded mb-6 text-sm">
          <span className="font-bold">Error de conexión:</span> {error}
        </div>
      )}
      
      {/* Contenedor de la Tabla */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Filtros y Buscador */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/80 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, Usuario o CI..." 
            className="px-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] focus:ring-2 focus:ring-cyan-500 outline-none w-full md:w-80 transition-all dark:text-slate-200 placeholder:text-gray-400"
          />
        </div>

        {/* Área de la Tabla */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
              <svg className="animate-spin h-8 w-8 text-cyan-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-bold tracking-wide uppercase">Cargando directorio...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-slate-400">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium">No se encontraron usuarios con esos criterios.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Nombre / Razón Social</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80 text-sm">
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id_usuario} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">
                      @{user.user_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-medium">
                      {user.nombre_razon_social}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">
                      {user.documento_identidad}
                    </td>
                    <td className="px-6 py-4">
                      {/* Badge (Etiqueta) de Rol */}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        user.rol === 'ADMINISTRADOR' || user.id_rol === 1
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}>
                        {user.rol || `Rol ID: ${user.id_rol}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold text-xs uppercase tracking-wider">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}