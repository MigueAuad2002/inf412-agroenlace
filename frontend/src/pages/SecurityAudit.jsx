import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';
import * as XLSX from 'xlsx'; // <-- NUEVA IMPORTACIÓN MAGICA

// Función infalible para leer llaves de la BD ignorando mayúsculas/minúsculas
const getVal = (obj, keyName) => {
  if (!obj) return '';
  const exactKey = Object.keys(obj).find(k => k.toLowerCase() === keyName.toLowerCase());
  return exactKey ? obj[exactKey] : '';
};

// Helper para poner la fecha más legible (YYYY-MM-DD HH:MM)
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; 
    
    return d.toLocaleString('es-BO', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false 
    });
  } catch (e) {
    return dateString;
  }
};

export default function SecurityAudit() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const cargarBitacora = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/get-bitacora`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        if (response.status === 401) logout();
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error('Error de conexión con el servidor');

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Error al obtener la bitácora');
      
      setLogs(data.bitacora || []);
      
    } catch (err) {
      console.warn('Error al cargar la bitácora:', err.message);
      setError(err.message || 'No se pudo cargar la bitácora');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  const logsFiltrados = logs.filter((log) => {
    const termino = searchTerm.toLowerCase();
    const nro = String(getVal(log, 'nro')).toLowerCase();
    const usuario = String(getVal(log, 'user_name')).toLowerCase();
    const accion = String(getVal(log, 'accion')).toLowerCase();
    const fecha = String(getVal(log, 'fecha_hora')).toLowerCase();

    return (
      nro.includes(termino) ||
      usuario.includes(termino) ||
      accion.includes(termino) ||
      fecha.includes(termino)
    );
  });

  // ====================================================================
  // NUEVA FUNCION: EXPORTAR A EXCEL
  // ====================================================================
  const handleExportarExcel = () => {
    if (logsFiltrados.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    // 1. Damos formato a los datos para que se vean bonitos en Excel
    const datosExcel = logsFiltrados.map((log) => ({
      'Nro.': getVal(log, 'nro'),
      'Fecha y Hora': formatDateTime(getVal(log, 'fecha_hora')),
      'Acción Registrada': getVal(log, 'accion'),
      'Usuario Responsable': getVal(log, 'user_name') ? `@${String(getVal(log, 'user_name')).toLowerCase()}` : 'SISTEMA'
    }));

    // 2. Creamos la hoja de cálculo
    const hoja = XLSX.utils.json_to_sheet(datosExcel);

    // Ajustamos el ancho de las columnas
    hoja['!cols'] = [
      { wch: 8 },  // Nro
      { wch: 20 }, // Fecha
      { wch: 45 }, // Acción
      { wch: 20 }  // Usuario
    ];

    // 3. Creamos el libro (workbook) y le pegamos la hoja
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Bitácora_Auditoría");

    // 4. Disparamos la descarga
    XLSX.writeFile(libro, "Reporte_AgroEnlace_Bitacora.xlsx");
  };

  return (
    <div className="animate-fade-in relative max-w-full">
      {/* Cabecera Responsiva */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-4">
        <div className="w-full sm:w-auto">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Bitácora del Sistema</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Matriz de auditoría de los últimos 30 días.</p>
        </div>

        {/* BOTON DE EXPORTAR CONECTADO */}
        <button 
          onClick={handleExportarExcel}
          className="w-full sm:w-auto justify-center bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 text-sm sm:text-xs font-semibold px-4 py-2.5 sm:py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#1A5729] dark:text-cyan-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
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
        
        {/* Buscador Premium */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-slate-700/80 bg-gray-50/40 dark:bg-slate-800/40 flex items-center">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, acción o fecha..." 
              className="w-full pl-9 pr-4 py-2 sm:py-1.5 text-base sm:text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-[#0F172A] focus:ring-1 focus:ring-[#1A5729] outline-none transition-all dark:text-slate-200 placeholder:text-gray-400"
            />
          </div>
          
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1A5729] animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {logsFiltrados.length} registro{logsFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Tabla Densidad Corporativa */}
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="animate-spin h-6 w-6 text-[#1A5729] dark:text-cyan-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-semibold tracking-wider uppercase">Extrayendo auditoría...</p>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-medium">No se encontraron registros en la bitácora.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 w-16 text-center">Nro</th>
                  <th className="px-4 sm:px-5 py-3">Fecha / Hora</th>
                  <th className="px-4 sm:px-5 py-3">Acción Registrada</th>
                  <th className="px-4 sm:px-5 py-3">Usuario Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80 text-sm">
                {logsFiltrados.map((log, index) => {
                  const nro = getVal(log, 'nro');
                  const fecha = formatDateTime(getVal(log, 'fecha_hora'));
                  const accion = getVal(log, 'accion');
                  const usuario = getVal(log, 'user_name');
                  
                  return (
                  <tr key={nro || index} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 text-center text-gray-400 dark:text-slate-500 font-mono text-xs">
                      #{nro}
                    </td>
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 font-mono text-xs text-gray-600 dark:text-slate-400">
                      {fecha}
                    </td>
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5 font-semibold text-gray-800 dark:text-slate-200">
                      {accion}
                    </td>
                    <td className="px-4 sm:px-5 py-3 sm:py-2.5">
                      <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide">
                          @{usuario ? String(usuario).toLowerCase() : 'sistema'}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}