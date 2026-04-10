import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function SecurityAudit() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout); 
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // FUNCIÓN PARA CARGAR LA BITÁCORA (Lista para que tus compañeros conecten el backend)
  const cargarBitacora = async () => {
    setLoading(true);
    try {
      // TODO: Tus compañeros deben crear este endpoint en Flask
      const response = await fetch(`${API_URL}/get-audit`, {
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
      if (!data.success) throw new Error(data.message || 'Error al obtener la bitácora');
      
      setLogs(data.list_audit || []);
    } catch (err) {
      // Como aún no hay backend, no mostramos error fatal, solo lo dejamos vacío para la demo
      console.warn("Backend no conectado aún:", err.message);
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  // Filtro de búsqueda (Buscando por usuario, módulo o detalle)
  const logsFiltrados = logs.filter((log) => {
    const termino = searchTerm.toLowerCase();
    const usuario = log.user_name ? String(log.user_name).toLowerCase() : '';
    const modulo = log.modulo ? String(log.modulo).toLowerCase() : '';
    const detalle = log.detalle ? String(log.detalle).toLowerCase() : '';

    return usuario.includes(termino) || modulo.includes(termino) || detalle.includes(termino);
  });

  // Función auxiliar para pintar las etiquetas de colores según la acción
  const getActionBadge = (accion) => {
    const actionUpper = accion?.toUpperCase() || 'INFO';
    switch (actionUpper) {
      case 'INSERT':
      case 'CREAR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'UPDATE':
      case 'EDITAR':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'DELETE':
      case 'ELIMINAR':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'LOGIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className="animate-fade-in relative max-w-full">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Bitácora del Sistema</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Registro inmutable de auditoría y eventos operativos.</p>
        </div>
        
        {/* Botón de Exportar (Típico en bitácoras) */}
        <button 
          className="bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          onClick={() => alert("Funcionalidad de exportación pendiente")}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#1A5729] dark:text-[#7BC636]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Exportar Reporte
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 rounded mb-5 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      
      {/* Contenedor Principal */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Buscador y Filtros Rápidos */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700/80 bg-gray-50/40 dark:bg-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuario, módulo o detalle..." 
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-[#0F172A] focus:ring-1 focus:ring-[#1A5729] focus:border-[#1A5729] dark:focus:ring-cyan-500 dark:focus:border-cyan-500 outline-none transition-all dark:text-slate-200 placeholder:text-gray-400"
            />
          </div>

          {/* Aquí tus compañeros pueden agregar un filtro de fechas futuro */}
          <div className="text-xs text-gray-400 dark:text-slate-500 font-medium">
            Últimos 30 días
          </div>
        </div>

        {/* Tabla Densidad Corporativa */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="animate-spin h-6 w-6 text-cyan-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-semibold tracking-wider uppercase">Cargando registros...</p>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3 opacity-30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <p className="text-sm font-medium">No hay registros en la bitácora aún.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3 w-32">Fecha y Hora</th>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3 w-28">Acción</th>
                  <th className="px-5 py-3">Módulo</th>
                  <th className="px-5 py-3 w-full">Detalle del Evento</th>
                  <th className="px-5 py-3 text-right">Dir. IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80 text-sm">
                {logsFiltrados.map((log) => (
                  <tr key={log.id_bitacora} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    
                    <td className="px-5 py-2.5 text-gray-500 dark:text-slate-400 font-mono text-xs">
                      {log.fecha_hora}
                    </td>
                    
                    <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-slate-200">
                      @{log.user_name?.toLowerCase()}
                    </td>
                    
                    <td className="px-5 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${getActionBadge(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    
                    <td className="px-5 py-2.5 text-gray-600 dark:text-slate-300 text-xs font-bold uppercase">
                      {log.modulo}
                    </td>
                    
                    <td className="px-5 py-2.5 text-gray-500 dark:text-slate-400 truncate max-w-sm" title={log.detalle}>
                      {log.detalle}
                    </td>
                    
                    <td className="px-5 py-2.5 text-right text-gray-400 dark:text-slate-500 font-mono text-[10px]">
                      {log.ip || '127.0.0.1'}
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