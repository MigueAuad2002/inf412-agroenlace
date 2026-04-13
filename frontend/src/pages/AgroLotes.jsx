import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

// Función infalible para leer llaves ignorando mayúsculas/minúsculas
const getVal = (obj, keyName) => {
  if (!obj) return '';
  const exactKey = Object.keys(obj).find(k => k.toLowerCase() === keyName.toLowerCase());
  return exactKey ? obj[exactKey] : '';
};

export default function AgroLotes() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); 
  
  const [lotes, setLotes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    nro_lote: '',
    nombre_sector: '',
    tamano_hectareas: '',
    latitud: '',
    longitud: '',
    estado: 'ACTIVO',
    id_usuario: '' 
  });

  const cargarTerrenos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-terrenos`, {
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
      
      if (!data.success) throw new Error(data.message || 'Error al obtener terrenos');
      
      setLotes(data.list_terrenos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/get-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.list_users || []);
      }
    } catch (err) {
      console.warn("Error al cargar usuarios:", err.message);
    }
  };

  useEffect(() => {
    // Solución a la condición de carrera: ejecutar secuencialmente
    const inicializarDatos = async () => {
      await cargarUsuarios();
      await cargarTerrenos();
    };
    inicializarDatos();
  }, []);

  const handleEliminar = async (nro_lote, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el terreno "${nombre}"?`)) return;
    try {
      const response = await fetch(`${API_URL}/delete-terreno`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nro_lote: nro_lote }) 
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

  const openEditModal = (lote) => {
    setIsEditing(true);
    // Usamos getVal para asegurar que capturemos el dato sí o sí
    setFormData({
      nro_lote: getVal(lote, 'nro_lote'),
      nombre_sector: getVal(lote, 'nombre_sector'),
      tamano_hectareas: getVal(lote, 'tamano_hectareas'),
      latitud: getVal(lote, 'latitud'),
      longitud: getVal(lote, 'longitud'),
      estado: getVal(lote, 'estado') || 'ACTIVO',
      id_usuario: getVal(lote, 'id') // El alias de ID_USUARIO
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing ? '/update-terreno' : '/add-terreno';
    
    // Parseo de los valores antes de enviarlos al backend para asegurar tipos correctos
    const payload = {
      ...formData,
      tamano_hectareas: parseFloat(formData.tamano_hectareas),
      latitud: parseFloat(formData.latitud),
      longitud: parseFloat(formData.longitud),
      id_usuario: parseInt(formData.id_usuario, 10)
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
    const nombre = String(getVal(lote, 'nombre_sector')).toLowerCase();
    const propietario = String(getVal(lote, 'propietario')).toLowerCase();
    return nombre.includes(termino) || propietario.includes(termino);
  });

  return (
    <div className="animate-fade-in relative max-w-full p-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Gestión de Terrenos</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Control de áreas agrícolas y propietarios.</p>
        </div>
        <button onClick={openAddModal} className="w-full sm:w-auto bg-[#1A5729] hover:bg-[#144320] text-white text-sm font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nuevo Terreno
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
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar sector..." 
            className="w-full max-w-xs pl-4 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-[#1A5729]/20" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                <th className="px-6 py-4 text-center">NRO LOTE</th>
                <th className="px-6 py-4">SECTOR</th>
                <th className="px-6 py-4">SUPERFICIE</th>
                <th className="px-6 py-4">COORDENADAS</th>
                <th className="px-6 py-4">PROPIETARIO</th>
                <th className="px-6 py-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
              {lotesFiltrados.map((lote, index) => {
                // Extrayendo variables de forma segura
                const nroLote = getVal(lote, 'nro_lote');
                const nombreSector = getVal(lote, 'nombre_sector');
                const tamano = getVal(lote, 'tamano_hectareas');
                const latitud = getVal(lote, 'latitud');
                const longitud = getVal(lote, 'longitud');
                const propietario = getVal(lote, 'propietario');

                return (
                  <tr key={nroLote || index} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono text-xs text-gray-400">#{nroLote}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-200">{nombreSector}</td>
                    <td className="px-6 py-4 font-semibold text-[#1A5729]">{tamano} Ha</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{latitud}, {longitud}</td>
                    <td className="px-6 py-4">
                      <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md text-[10px] font-bold">
                          @{propietario ? String(propietario).toLowerCase() : 'sin propietario'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(lote)} className="p-2 text-gray-400 hover:text-cyan-600 rounded-lg transition-all">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={() => handleEliminar(nroLote, nombreSector)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-all">
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
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tighter">{isEditing ? 'Editar Terreno' : 'Registrar Nuevo Lote'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre del Sector *</label>
                <input name="nombre_sector" required value={formData.nombre_sector} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: Lote Norte" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Superficie (Ha) *</label>
                <input name="tamano_hectareas" type="number" step="0.01" required value={formData.tamano_hectareas} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: 50.5" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Estado *</label>
                <select name="estado" required value={formData.estado} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent text-sm text-gray-700 dark:text-slate-200">
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="EN PREPARACION">EN PREPARACIÓN</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Latitud *</label>
                <input name="latitud" type="number" step="any" required value={formData.latitud} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: -17.783" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Longitud *</label>
                <input name="longitud" type="number" step="any" required value={formData.longitud} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent" placeholder="Ej: -63.182" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Propietario Asignado *</label>
                <select name="id_usuario" required value={formData.id_usuario} onChange={handleChange} className="w-full border-b-2 py-2 outline-none focus:border-[#1A5729] bg-transparent text-sm text-gray-700 dark:text-slate-200">
                  <option value="" disabled>Seleccione un propietario</option>
                  {usuarios.map(u => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nombre_razon_social} (@{u.user_name}) - CI: {u.documento_identidad}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-6">
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