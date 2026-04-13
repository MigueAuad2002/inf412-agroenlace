import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function LotesManagement() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); 
  
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Adaptado a la estructura de tu tabla Config.T_TERRENO
  const [formData, setFormData] = useState({
    nro_lote: '',
    nombre_sector: '',
    tamano_hectareas: '',
    latitud: '',
    longitud: '',
    estado: 'ACTIVO',
    id_usuario: '' // Requerido por tu API
  });

  const cargarTerrenos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/get-terrenos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        if(response.status === 401) logout();
        // window.location.href = '/login'; 
        setError(data.message);
        return;
      }
      
      if (!data.success) throw new Error(data.message || 'Error al obtener terrenos');
      
      // Tu API devuelve 'list_terrenos'
      setLotes(data.list_terrenos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTerrenos();
  }, []);

  const handleEliminar = async (nro_lote, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el terreno "${nombre}"?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/api/delete-terreno`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nro_lote: nro_lote }) // Tu API espera nro_lote
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      cargarTerrenos(); 
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ nro_lote: '', nombre_sector: '', tamano_hectareas: '', latitud: '', longitud: '', estado: 'ACTIVO', id_usuario: '' });
    setShowModal(true);
  };

  const openEditModal = (loteObj) => {
    setIsEditing(true);
    setFormData({
      nro_lote: loteObj.NRO_LOTE || '', 
      nombre_sector: loteObj.NOMBRE_SECTOR || '',
      tamano_hectareas: loteObj.TAMANO_HECTAREAS || '',
      latitud: loteObj.LATITUD || '',
      longitud: loteObj.LONGITUD || '',
      estado: loteObj.ESTADO || 'ACTIVO',
      id_usuario: loteObj.ID || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing ? '/api/update-terreno' : '/api/add-terreno';
    
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
      cargarTerrenos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const lotesFiltrados = lotes.filter((lote) => {
    const termino = searchTerm.toLowerCase();
    const nombre = lote.NOMBRE_SECTOR ? String(lote.NOMBRE_SECTOR).toLowerCase() : '';
    const propietario = lote.PROPIETARIO ? String(lote.PROPIETARIO).toLowerCase() : '';

    return nombre.includes(termino) || propietario.includes(termino);
  });

  return (
    <div className="animate-fade-in relative max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Gestión de Terrenos</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Administración de áreas de cultivo y propietarios.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full sm:w-auto bg-[#1A5729] hover:bg-[#144320] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Registrar Terreno
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-5 text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50/40">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por sector o propietario..." 
            className="w-full sm:w-80 pl-4 pr-4 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md outline-none focus:ring-1 focus:ring-[#1A5729]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-center">NRO LOTE</th>
                <th className="px-5 py-3">SECTOR</th>
                <th className="px-5 py-3">TAMAÑO (HA)</th>
                <th className="px-5 py-3">UBICACIÓN (GPS)</th>
                <th className="px-5 py-3">PROPIETARIO</th>
                <th className="px-5 py-3 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
              {lotesFiltrados.map((lote) => (
                <tr key={lote.NRO_LOTE} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-5 py-3 text-center font-mono text-xs">{lote.NRO_LOTE}</td>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-slate-200">{lote.NOMBRE_SECTOR}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-300">{lote.TAMANO_HECTAREAS} ha</td>
                  <td className="px-5 py-3 text-gray-400 text-xs font-mono">{lote.LATITUD}, {lote.LONGITUD}</td>
                  <td className="px-5 py-3">
                    <span className="text-cyan-600 font-semibold">@{lote.PROPIETARIO?.toLowerCase()}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEditModal(lote)} className="p-1.5 text-gray-500 hover:text-cyan-600 rounded">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                      <button onClick={() => handleEliminar(lote.NRO_LOTE, lote.NOMBRE_SECTOR)} className="p-1.5 text-gray-500 hover:text-red-600 rounded">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{isEditing ? 'Editar Terreno' : 'Nuevo Terreno'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Sector</label>
                <input name="nombre_sector" required value={formData.nombre_sector} onChange={handleChange} className="w-full border-b py-1.5 outline-none focus:border-[#1A5729]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tamaño (Hectáreas)</label>
                <input name="tamano_hectareas" type="number" step="0.01" required value={formData.tamano_hectareas} onChange={handleChange} className="w-full border-b py-1.5 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">ID Propietario (Usuario)</label>
                <input name="id_usuario" type="number" required value={formData.id_usuario} onChange={handleChange} className="w-full border-b py-1.5 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Latitud</label>
                <input name="latitud" type="number" step="any" required value={formData.latitud} onChange={handleChange} className="w-full border-b py-1.5 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Longitud</label>
                <input name="longitud" type="number" step="any" required value={formData.longitud} onChange={handleChange} className="w-full border-b py-1.5 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full border-b py-1.5 outline-none">
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="BARBECHO">BARBECHO</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="text-sm font-semibold text-gray-500">Cancelar</button>
                <button type="submit" className="bg-[#1A5729] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md">
                  {isEditing ? 'Guardar Cambios' : 'Registrar Terreno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}