import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

// Función infalible para leer llaves ignorando mayúsculas/minúsculas
const getVal = (obj, keyName) => {
  if (!obj) return '';
  const exactKey = Object.keys(obj).find(k => k.toLowerCase() === keyName.toLowerCase());
  return exactKey ? obj[exactKey] : '';
};

// Helper para formatear fecha a YYYY-MM-DD para el input type="date"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return dateString;
  }
};

export default function AgroCampanias() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); 
  
  const [campanias, setCampanias] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id_campana: '',
    nombre_campana: '',
    variedad: '',
    fecha_siembra: '',
    fecha_cosecha: '',
    estado: 'PLANIFICADA',
    rendimiento_estimado: '',
    rendimiento_real: '',
    nro_lote: ''
  });

  const cargarCampanias = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-campanias`, {
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
      
      if (!data.success) throw new Error(data.message || 'Error al obtener campañas');
      
      setCampanias(data.list_campanias || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarLotes = async () => {
    try {
      const response = await fetch(`${API_URL}/get-terrenos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      if (data.success) {
        setLotes(data.list_terrenos || []);
      }
    } catch (err) {
      console.warn("Error al cargar lotes:", err.message);
    }
  };

  useEffect(() => {
    // Ejecución secuencial para evitar race condition en backend
    const inicializarDatos = async () => {
      await cargarLotes();
      await cargarCampanias();
    };
    inicializarDatos();
  }, []);

  const handleEliminar = async (id_campana, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la campaña "${nombre}"?`)) return;
    try {
      const response = await fetch(`${API_URL}/delete-campania`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_campana: id_campana }) 
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      cargarCampanias(); 
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ 
      id_campana: '', nombre_campana: '', variedad: '', 
      fecha_siembra: '', fecha_cosecha: '', estado: 'PLANIFICADA', 
      rendimiento_estimado: '', rendimiento_real: '', nro_lote: '' 
    });
    setShowModal(true);
  };

  const openEditModal = (campania) => {
    setIsEditing(true);
    setFormData({
      id_campana: getVal(campania, 'id_campana'),
      nombre_campana: getVal(campania, 'nombre_campana'),
      variedad: getVal(campania, 'variedad'),
      fecha_siembra: formatDateForInput(getVal(campania, 'fecha_siembra')),
      fecha_cosecha: formatDateForInput(getVal(campania, 'fecha_cosecha')),
      estado: getVal(campania, 'estado') || 'PLANIFICADA',
      rendimiento_estimado: getVal(campania, 'rendimiento_estimado'),
      rendimiento_real: getVal(campania, 'rendimiento_real') || '',
      nro_lote: getVal(campania, 'nro_lote') 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing ? '/update-campania' : '/add-campania';
    
    const payload = {
      ...formData,
      rendimiento_estimado: parseFloat(formData.rendimiento_estimado),
      rendimiento_real: formData.rendimiento_real ? parseFloat(formData.rendimiento_real) : null,
      nro_lote: parseInt(formData.nro_lote, 10)
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      setShowModal(false);
      cargarCampanias();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const campaniasFiltradas = campanias.filter((c) => {
    const termino = searchTerm.toLowerCase();
    const nombre = String(getVal(c, 'nombre_campana')).toLowerCase();
    const sector = String(getVal(c, 'nombre_sector')).toLowerCase();
    const variedad = String(getVal(c, 'variedad')).toLowerCase();
    return nombre.includes(termino) || sector.includes(termino) || variedad.includes(termino);
  });

  return (
    <div className="animate-fade-in relative max-w-full p-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Gestión de Campañas</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Control de ciclos de cultivo, variedades y rendimientos.</p>
        </div>
        <button onClick={openAddModal} className="w-full sm:w-auto bg-[#1A5729] hover:bg-[#144320] text-white text-sm font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nueva Campaña
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 text-sm font-bold">
          Error: {error}
        </div>
      )}
      
      {/* Tabla */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por campaña, sector o variedad..." 
            className="w-full max-w-sm pl-4 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#1A5729]/20" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4 text-center">ID</th>
                <th className="px-6 py-4">CAMPAÑA</th>
                <th className="px-6 py-4">VARIEDAD</th>
                <th className="px-6 py-4">LOTE (SECTOR)</th>
                <th className="px-6 py-4">ESTADO</th>
                <th className="px-6 py-4">REND. EST.</th>
                <th className="px-6 py-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
              {campaniasFiltradas.map((c, index) => {
                const idCampana = getVal(c, 'id_campana');
                const nombre = getVal(c, 'nombre_campana');
                const variedad = getVal(c, 'variedad');
                const sector = getVal(c, 'nombre_sector');
                const estado = getVal(c, 'estado');
                const rendEstimado = getVal(c, 'rendimiento_estimado');

                return (
                  <tr key={idCampana || index} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono text-xs text-gray-400">#{idCampana}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">{nombre}</td>
                    <td className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-300">{variedad}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-[12px]">{sector}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        estado === 'FINALIZADA' ? 'bg-green-100 text-green-700' : 
                        estado === 'PLANIFICADA' ? 'bg-blue-100 text-blue-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1A5729]">{rendEstimado} ton/ha</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(c)} className="p-2 text-gray-400 hover:text-cyan-600 rounded-lg transition-all">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={() => handleEliminar(idCampana, nombre)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-all">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tighter">{isEditing ? 'Editar Campaña' : 'Registrar Nueva Campaña'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-x-4 gap-y-5">
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre de Campaña *</label>
                <input name="nombre_campana" required value={formData.nombre_campana} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: SOYA INVIERNO 2026" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Variedad Sembrada *</label>
                <input name="variedad" required value={formData.variedad} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: SOYA MUNASQA" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Lote (Terreno) *</label>
                <select name="nro_lote" required value={formData.nro_lote} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent text-sm text-gray-700 dark:text-slate-200">
                  <option value="" disabled>Seleccione un Lote</option>
                  {lotes.map(l => (
                    <option key={getVal(l, 'nro_lote')} value={getVal(l, 'nro_lote')}>
                      {getVal(l, 'nombre_sector')} (Lote #{getVal(l, 'nro_lote')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Estado de Campaña *</label>
                <select name="estado" required value={formData.estado} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent text-sm text-gray-700 dark:text-slate-200">
                  <option value="PLANIFICADA">PLANIFICADA</option>
                  <option value="EN CURSO">EN CURSO</option>
                  <option value="FINALIZADA">FINALIZADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha de Siembra *</label>
                <input name="fecha_siembra" type="date" required value={formData.fecha_siembra} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha de Cosecha *</label>
                <input name="fecha_cosecha" type="date" required value={formData.fecha_cosecha} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent dark:[color-scheme:dark]" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Rend. Estimado (ton/ha) *</label>
                <input name="rendimiento_estimado" type="number" step="0.01" required value={formData.rendimiento_estimado} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: 3.5" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Rend. Real (ton/ha) {isEditing ? '' : '(Opcional)'}</label>
                <input name="rendimiento_real" type="number" step="0.01" value={formData.rendimiento_real} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: 3.2" />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="text-xs font-bold text-gray-400 uppercase">Cancelar</button>
                <button type="submit" className="bg-[#1A5729] text-white px-8 py-3 rounded-xl text-xs font-black uppercase shadow-lg">
                  {isEditing ? 'Guardar Cambios' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}