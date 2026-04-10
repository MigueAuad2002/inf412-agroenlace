import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function SecurityRoles() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); 
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    nombre_rol: ''
  });

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-roles`, {
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
      if (!data.success) throw new Error(data.message || 'Error al obtener roles');
      
      setRoles(data.list_roles || []);
    } catch (err) {
      console.warn("Backend no conectado aún:", err.message);
      setRoles([
        { id: 1, nombre_rol: 'ADMINISTRADOR', created_at: '2026-04-10 00:00:00' },
        { id: 2, nombre_rol: 'SUPERVISOR', created_at: '2026-04-10 00:05:00' },
        { id: 3, nombre_rol: 'EMPLEADO', created_at: '2026-04-10 00:10:00' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const handleEliminar = async (id, nombre_rol) => {
    if (id === 1) {
      alert("Por seguridad, el rol de ADMINISTRADOR principal no puede ser eliminado.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar el rol de ${nombre_rol}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/delete-roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: id })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      cargarRoles(); 
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id: '', nombre_rol: '' });
    setShowModal(true);
  };

  const openEditModal = (rolObj) => {
    setIsEditing(true);
    setFormData({
      id: rolObj.id || '', 
      nombre_rol: rolObj.nombre_rol || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing ? '/update-roles' : '/add-roles';
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
      cargarRoles();
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const rolesFiltrados = roles.filter((rol) => {
    const termino = searchTerm.toLowerCase();
    const idStr = rol.id ? String(rol.id) : '';
    const nombre = rol.nombre_rol ? String(rol.nombre_rol).toLowerCase() : '';

    return nombre.includes(termino) || idStr.includes(termino);
  });

  return (
    <div className="animate-fade-in relative max-w-full">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-4">
        <div className="w-full sm:w-auto">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Roles del Sistema</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Administración de perfiles y niveles de acceso.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full sm:w-auto justify-center bg-[#1A5729] hover:bg-[#144320] dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white text-sm sm:text-xs font-semibold px-4 py-2.5 sm:py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nuevo Rol
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 rounded mb-5 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      
      {/* Contenedor Principal */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Buscador */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-slate-700/80 bg-gray-50/40 dark:bg-slate-800/40 flex items-center">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID o nombre..." 
              className="w-full pl-9 pr-4 py-2 sm:py-1.5 text-base sm:text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-[#0F172A] focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all dark:text-slate-200 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="animate-spin h-6 w-6 text-cyan-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-semibold tracking-wider uppercase">Cargando...</p>
            </div>
          ) : rolesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-medium">No se encontraron roles.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 w-16 text-center">ID</th>
                  <th className="px-4 sm:px-5 py-3 w-full">Nombre del Rol</th>
                  <th className="px-4 sm:px-5 py-3 w-48">Fecha de Creación</th>
                  <th className="px-4 sm:px-5 py-3 w-28 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80 text-sm">
                {rolesFiltrados.map((rol) => (
                  <tr key={rol.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 text-center text-gray-400 dark:text-slate-500 font-mono text-xs">{rol.id}</td>
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 font-bold text-gray-800 dark:text-slate-200">{rol.nombre_rol}</td>
                    
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 text-gray-500 dark:text-slate-400 font-mono text-[11px]">
                      {rol.created_at || '-'}
                    </td>
                    
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2 sm:gap-1 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(rol)}
                          title="Editar"
                          className="p-2 sm:p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:text-cyan-400 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button 
                          onClick={() => handleEliminar(rol.id, rol.nombre_rol)}
                          title="Eliminar"
                          disabled={rol.id === 1} 
                          className="p-2 sm:p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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

      {/* MODAL RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-slate-700 animate-slide-up sm:animate-none">
            
            <div className="px-5 py-4 sm:py-3.5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-base font-bold text-gray-800 dark:text-white">
                {isEditing ? 'Editar Rol' : 'Nuevo Rol'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-5">
              <div className="flex flex-col gap-4 sm:gap-4">
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">ID del Rol</label>
                  <input type="text" disabled value={isEditing ? formData.id : 'AUTO-GENERADO'}
                    className="w-full px-3 py-2.5 sm:py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-md text-base sm:text-sm text-gray-400 font-mono cursor-not-allowed outline-none" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nombre del Rol</label>
                  <input type="text" name="nombre_rol" required value={formData.nombre_rol} onChange={handleChange} placeholder="Ej: VENDEDOR"
                    className="w-full px-3 py-2.5 sm:py-2 bg-white dark:bg-[#0F172A] border border-gray-300 dark:border-slate-600 rounded-md text-base sm:text-sm text-gray-800 dark:text-slate-200 focus:ring-2 sm:focus:ring-1 focus:ring-cyan-500 outline-none uppercase" />
                </div>

              </div>

              {/* Botones Apilados en Móvil / Alineados en PC */}
              <div className="mt-8 sm:mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm sm:text-xs font-bold sm:font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg sm:rounded-md transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm sm:text-xs font-bold sm:font-semibold text-white bg-[#1A5729] hover:bg-[#144320] dark:bg-cyan-600 dark:hover:bg-cyan-700 rounded-lg sm:rounded-md shadow-sm transition-colors">
                  {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}