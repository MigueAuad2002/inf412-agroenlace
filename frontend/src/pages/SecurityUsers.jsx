import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function SecurityUsers() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); 
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADOS PARA EL MODAL
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Agregamos id_usuario al estado inicial
  const [formData, setFormData] = useState({
    id_usuario: '',
    user: '',
    doc: '',
    name: '',
    mail: '',
    number: '',
    dir: '', 
    password: '',
    id_role: 4 
  });

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        if(response.status === 401) logout();
        window.location.href = '/login';
        return;
      }
      if (!data.success) throw new Error(data.message || 'Error al obtener usuarios');
      
      setUsuarios(data.list_users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleEliminar = async (username) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario @${username}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/delete-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user: username })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      cargarUsuarios(); 
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id_usuario: '', user: '', doc: '', name: '', mail: '', number: '', dir: '', password: '', id_role: 4 });
    setShowModal(true);
  };

  const openEditModal = (userObj) => {
    setIsEditing(true);
    setFormData({
      id_usuario: userObj.id_usuario || '', // Capturamos el ID
      user: userObj.user_name || '',
      doc: userObj.documento_identidad || '',
      name: userObj.nombre_razon_social || '',
      mail: userObj.correo || '', 
      number: userObj.telefono || '',
      dir: userObj.direccion || '',
      password: '', 
      id_role: userObj.id_rol || 4
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing ? '/update-users' : '/add-users';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setShowModal(false);
      cargarUsuarios();
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const usuariosFiltrados = usuarios.filter((user) => {
    const termino = searchTerm.toLowerCase();
    // Agregamos el ID al filtro por si quieres buscar a alguien por su número exacto
    const id = user.id_usuario ? String(user.id_usuario) : '';
    const nombre = user.nombre_razon_social ? String(user.nombre_razon_social).toLowerCase() : '';
    const username = user.user_name ? String(user.user_name).toLowerCase() : '';
    const ci = user.documento_identidad ? String(user.documento_identidad).toLowerCase() : '';

    return nombre.includes(termino) || username.includes(termino) || ci.includes(termino) || id.includes(termino);
  });

  return (
    <div className="animate-fade-in relative">
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-black text-gray-800 dark:text-white">Usuarios y Roles</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Gestión de cuentas con acceso al sistema.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded mb-6 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/80 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, Nombre, Usuario o CI..." 
            className="px-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] focus:ring-2 focus:ring-cyan-500 outline-none w-full md:w-80 transition-all dark:text-slate-200 placeholder:text-gray-400"
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-cyan-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-bold tracking-wide uppercase">Cargando directorio...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-sm font-medium">No se encontraron usuarios.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 w-16">ID</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Nombre / Razón Social</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80 text-sm">
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id_usuario} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-500 font-mono text-xs font-bold">{user.id_usuario}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">@{user.user_name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-medium">{user.nombre_razon_social}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{user.documento_identidad}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-medium">{user.telefono || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        user.rol?.toUpperCase() === 'ADMINISTRADOR'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}>
                        {user.rol || 'SIN ROL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                          Editar
                        </button>
                        <div className="w-px h-3 bg-gray-200 dark:bg-slate-700"></div>
                        <button 
                          onClick={() => handleEliminar(user.user_name)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
            
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* CAMPO NUEVO: ID de Usuario (Siempre deshabilitado) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">ID Sistema</label>
                  <input type="text" disabled value={isEditing ? formData.id_usuario : 'AUTO-GENERADO'}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-400 font-mono cursor-not-allowed outline-none" />
                </div>

                {/* Usuario */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Usuario</label>
                  <input type="text" name="user" required disabled={isEditing} value={formData.user} onChange={handleChange} placeholder="Ej: migue123"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>

                {/* Documento */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">CI / NIT</label>
                  <input type="text" name="doc" required={!isEditing} value={formData.doc} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Teléfono</label>
                  <input type="text" name="number" required={!isEditing} value={formData.number} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>

                {/* Nombre Completo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Nombre / Razón Social</label>
                  <input type="text" name="name" required={!isEditing} value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Correo Electrónico</label>
                  <input type="email" name="mail" required={!isEditing} value={formData.mail} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Rol del Sistema</label>
                  <select name="id_role" value={formData.id_role} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value={1}>ADMINISTRADOR</option>
                    <option value={2}>SUPERVISOR</option>
                    <option value={3}>EMPLEADO</option>
                    <option value={4}>CLIENTE/TERCERO</option>
                  </select>
                </div>

                {/* Contraseña */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Contraseña {isEditing && <span className="text-xs font-normal text-gray-400 lowercase">(Dejar en blanco para no cambiar)</span>}
                  </label>
                  <input type="password" name="password" required={!isEditing} value={formData.password} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
              </div>

              {/* Botones */}
              <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition-colors">
                  {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}