import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth_store';

const API_URL = import.meta.env.VITE_API_URL;

export default function AgroOrdenes() {
  const token = useAuthStore((state) => state.token);
  const userRole = useAuthStore((state) => state.user?.id_rol || state.role); 
  const isBoss = Number(userRole) === 1 || Number(userRole) === 2;

  const [ordenes, setOrdenes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [campanias, setCampanias] = useState([]); // NUEVO ESTADO PARA CAMPAÑAS
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [empleadoId, setEmpleadoId] = useState('');

  const isFetching = useRef(false);

  const initialForm = {
    tipo_trabajo: '',
    fecha_inicio: '',
    fecha_fin: '',
    id_campana: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-ordenes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setOrdenes(result.list_ordenes || []);
    } catch (error) {
      console.error("Error en órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await fetch(`${API_URL}/get-empleados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setEmpleados(result.list_empleados || []);
    } catch (error) {
      console.error("Error en empleados:", error);
    }
  };

  // NUEVA FUNCIÓN PARA TRAER CAMPAÑAS
  const fetchCampanias = async () => {
    try {
      const response = await fetch(`${API_URL}/get-campanias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setCampanias(result.list_campanias || []);
      } else {
        console.error("Error en campañas:", result.message);
      }
    } catch (error) {
      console.error("Error de red al cargar campañas:", error);
    }
  };

  useEffect(() => {
    if (!token || isFetching.current) return;
    
    const cargarDatosProtegidos = async () => {
      isFetching.current = true; 
      
      await fetchOrdenes();
      if (isBoss) {
        await fetchEmpleados();
        await fetchCampanias(); // Agregado a la cadena secuencial
      }
      
      isFetching.current = false; 
    };

    cargarDatosProtegidos();
  }, [token, isBoss]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    if (!isBoss) return;
    setFormData(initialForm);
    setShowModal(true);
  };

  const openAssignModal = (orden) => {
    if (!isBoss) return;
    setCurrentOrder(orden);
    setEmpleadoId(orden.id_empleado || '');
    setShowAssignModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tipo_trabajo: formData.tipo_trabajo.toUpperCase(),
      fecha_fin: formData.fecha_fin ? formData.fecha_fin : null, 
      id_campana: parseInt(formData.id_campana)
    };

    try {
      const response = await fetch(`${API_URL}/add-orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        fetchOrdenes(); 
      } else {
        alert(`Atención: ${result.message}`);
      }
    } catch (error) {
      alert("Error de comunicación con el servidor.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!empleadoId) {
      alert("Seleccione un empleado.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/assign-responsible`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          nro_orden: currentOrder.nro_orden,
          id_empleado: parseInt(empleadoId)
        })
      });
      const result = await response.json();
      if (result.success) {
        setShowAssignModal(false);
        fetchOrdenes(); 
      } else {
        alert(`Atención: ${result.message}`);
      }
    } catch (error) {
      alert("Error de comunicación con el servidor.");
    }
  };

  const handleDelete = async (id, tipo) => {
    if (!isBoss) return;
    if (!window.confirm(`¿Está seguro de eliminar la orden de ${tipo}?`)) return;
    try {
      const response = await fetch(`${API_URL}/delete-orden`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nro_orden: id })
      });
      const result = await response.json();
      if (result.success) fetchOrdenes();
      else alert(result.message);
    } catch (error) {
      alert("Error al procesar la baja.");
    }
  };

  const filtered = ordenes.filter(o => 
    o.tipo_trabajo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.empleado_username && o.empleado_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: ordenes.length,
    pendientes: ordenes.filter(o => o.estado === 'PENDIENTE').length,
    enProceso: ordenes.filter(o => o.estado === 'EN PROCESO').length,
    finalizadas: ordenes.filter(o => o.estado === 'FINALIZADA').length,
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen max-w-[100vw] overflow-x-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 md:h-8 bg-[#1A5729]"></div>
            ÓRDENES DE TRABAJO
          </h1>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 ml-5">
            Planificación y Asignación de Actividades
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" placeholder="BUSCAR ORDEN..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-md text-xs font-bold uppercase outline-none focus:border-[#1A5729] focus:ring-1 focus:ring-[#1A5729] bg-white shadow-sm"
            />
          </div>
          {isBoss && (
            <button onClick={openAddModal} className="bg-[#1A5729] hover:bg-[#144320] text-white px-6 py-2.5 rounded-md font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              CREAR ORDEN
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white p-3 md:p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-slate-100 p-2 md:p-3 rounded-md text-slate-600">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Órdenes</p>
            <p className="text-lg md:text-xl font-black text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-amber-50 p-2 md:p-3 rounded-md text-amber-600">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendientes</p>
            <p className="text-lg md:text-xl font-black text-amber-700">{stats.pendientes}</p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-blue-50 p-2 md:p-3 rounded-md text-blue-600">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Proceso</p>
            <p className="text-lg md:text-xl font-black text-blue-700">{stats.enProceso}</p>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-emerald-50 p-2 md:p-3 rounded-md text-emerald-600">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalizadas</p>
            <p className="text-lg md:text-xl font-black text-emerald-700">{stats.finalizadas}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Nro</th>
                <th className="px-6 py-4">Actividad</th>
                <th className="px-6 py-4">Fechas</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Personal</th>
                {isBoss && <th className="px-6 py-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={isBoss ? "6" : "5"} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando Órdenes...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isBoss ? "6" : "5"} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay órdenes registradas</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.nro_orden} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400">
                      ORD-{String(o.nro_orden).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#1A5729]/10 p-2 rounded-md text-[#1A5729] shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-800 text-xs uppercase truncate">{o.tipo_trabajo}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Campaña ID: {o.id_campana}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Inicio: {o.fecha_inicio ? new Date(o.fecha_inicio).toLocaleDateString() : 'N/A'}
                        </div>
                        {o.fecha_fin && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Fin: {new Date(o.fecha_fin).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        o.estado === 'FINALIZADA' ? 'bg-emerald-100 text-emerald-800' :
                        o.estado === 'EN PROCESO' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-[10px]">
                         <div className="font-bold text-slate-700"><span className="text-slate-400 font-normal">Emp:</span> {o.empleado_username || 'SIN ASIGNAR'}</div>
                         <div className="text-slate-500 mt-1"><span className="text-slate-400 font-normal">Sup:</span> {o.supervisor_username}</div>
                       </div>
                    </td>
                    {isBoss && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => openAssignModal(o)} className="text-[#1A5729] hover:text-[#0f3418] font-black text-[9px] uppercase tracking-widest flex flex-col items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            Asignar
                          </button>
                          <button onClick={() => handleDelete(o.nro_orden, o.tipo_trabajo)} className="text-red-500 hover:text-red-700 font-black text-[9px] uppercase tracking-widest flex flex-col items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Borrar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREAR ORDEN CON SELECTOR DE CAMPAÑAS */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1A5729] to-[#247638] px-6 py-5 flex justify-between items-center text-white">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">NUEVA ORDEN DE TRABAJO</h3>
                <p className="text-[10px] text-emerald-100 font-bold uppercase mt-1">Planificación Inicial</p>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-slate-50">
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Actividad / Tarea *</label>
                  <select required name="tipo_trabajo" value={formData.tipo_trabajo} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-xs font-bold uppercase outline-none focus:border-[#1A5729] focus:ring-2 focus:ring-[#1A5729]/20 bg-white transition-all shadow-sm">
                    <option value="" disabled>-- SELECCIONE ACTIVIDAD --</option>
                    <option value="SIEMBRA">SIEMBRA</option>
                    <option value="FUMIGACION">FUMIGACIÓN</option>
                    <option value="COSECHA">COSECHA</option>
                    <option value="PREPARACION_SUELO">PREPARACIÓN DE SUELO</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Fecha Inicio *</label>
                    <input type="date" required name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-xs font-bold uppercase text-slate-700 outline-none focus:border-[#1A5729] focus:ring-2 focus:ring-[#1A5729]/20 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Fecha Fin (Aprox)</label>
                    <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-xs font-bold uppercase text-slate-700 outline-none focus:border-[#1A5729] focus:ring-2 focus:ring-[#1A5729]/20 transition-all shadow-sm" />
                  </div>
                </div>

                {/* NUEVO SELECTOR DE CAMPAÑAS */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Campaña Agrícola *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <select 
                      required 
                      name="id_campana"
                      value={formData.id_campana} 
                      onChange={handleChange} 
                      className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg text-xs font-bold uppercase outline-none focus:border-[#1A5729] focus:ring-2 focus:ring-[#1A5729]/20 bg-white cursor-pointer transition-all shadow-sm appearance-none"
                    >
                      <option value="" disabled>-- SELECCIONE CAMPAÑA --</option>
                      {campanias.map((camp) => (
                        <option key={camp.id_campana} value={camp.id_campana}>
                          {camp.nombre_campana} (Lote #{camp.nro_lote})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-[#1A5729] text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-md hover:bg-[#144320] transition-colors">CREAR ORDEN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASIGNAR RESPONSABLE */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-5 flex justify-between items-center text-white">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">ASIGNAR PERSONAL</h3>
                <p className="text-[10px] text-blue-200 font-bold uppercase mt-1">Orden #{String(currentOrder?.nro_orden).padStart(4, '0')}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAssign} className="p-6 bg-slate-50">
              
              <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actividad Requerida</p>
                  <p className="font-black text-slate-800 text-sm uppercase">{currentOrder?.tipo_trabajo}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">Campaña ID: {currentOrder?.id_campana}</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Seleccione al Personal *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <select 
                    required 
                    value={empleadoId} 
                    onChange={(e) => setEmpleadoId(e.target.value)} 
                    className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg text-xs font-bold uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white cursor-pointer transition-all shadow-sm appearance-none"
                  >
                    <option value="" disabled>-- DESPLIEGUE PARA SELECCIONAR --</option>
                    {empleados.map((emp) => (
                      <option key={emp.id_usuario} value={emp.id_usuario}>
                        {emp.user_name} - {emp.nombre_razon_social}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold tracking-wide">* Mostrando únicamente usuarios con Rol Operativo.</p>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-200">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-6 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-md hover:bg-blue-800 transition-colors">GUARDAR ASIGNACIÓN</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}