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

  // DATOS MOCK AJUSTADOS A LA BD
  const mockLogs = [
    { nro: 1, fecha_hora: '2026-04-10 08:15:23', accion: 'Inicio de sesión', user_name: 'dmelgar' },
    { nro: 2, fecha_hora: '2026-04-10 08:20:11', accion: 'Registro de nuevo usuario', user_name: 'amendez' },
    { nro: 3, fecha_hora: '2026-04-10 08:45:02', accion: 'Actualización de datos personales', user_name: 'jrojas' },
    { nro: 4, fecha_hora: '2026-04-10 09:10:45', accion: 'Eliminación de cliente', user_name: 'admin' },
    { nro: 5, fecha_hora: '2026-04-09 17:30:12', accion: 'Generación de factura', user_name: 'wlopez' },
    { nro: 6, fecha_hora: '2026-04-09 18:05:33', accion: 'Edición de producto', user_name: 'mcastro' },
    { nro: 7, fecha_hora: '2026-04-08 14:22:10', accion: 'Cancelación de orden', user_name: 'admin' },
    { nro: 8, fecha_hora: '2026-04-08 15:10:55', accion: 'Cierre de sesión', user_name: 'soporte' }
  ];

  const cargarBitacora = async () => {
    setLoading(true);
    setError('');
    try {
      // ===== MODO PRUEBA =====
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLogs(mockLogs);
      return;
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
    const nro = log.nro ? String(log.nro).toLowerCase() : '';
    const usuario = log.user_name ? String(log.user_name).toLowerCase() : '';
    const accion = log.accion ? String(log.accion).toLowerCase() : '';
    const fecha = log.fecha_hora ? String(log.fecha_hora).toLowerCase() : '';

    return (
      nro.includes(termino) ||
      usuario.includes(termino) ||
      accion.includes(termino) ||
      fecha.includes(termino)
    );
  });

  return (
    <div className="animate-fade-in relative max-w-full">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
            Bitácora del Sistema
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Matriz de auditoría de eventos registrados por los usuarios.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nro, usuario, acción o fecha..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-[#0F172A] focus:ring-2 focus:ring-[#76B82A] focus:border-[#76B82A] dark:focus:ring-[#76B82A] dark:focus:border-[#76B82A] outline-none transition-all dark:text-slate-200 placeholder:text-gray-400 shadow-sm"
            />
          </div>

          <button
            className="bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            onClick={() => alert('Funcionalidad de exportación pendiente')}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#76B82A]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Contenedor principal */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Barra superior */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
              Matriz de registros
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Visualización estructurada de actividades del sistema
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#76B82A]"></span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {logsFiltrados.length} registro{logsFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CABECERA DE MATRIZ CON COLORES APLICADOS             */}
        {/* ==================================================== */}
        {!loading && logsFiltrados.length > 0 && (
          <div className="hidden md:grid grid-cols-[120px_220px_minmax(260px,1fr)_220px] gap-4 px-6 py-4 bg-[#C5E5F9]/30 dark:bg-[#1D512E]/20 border-b-2 border-[#76B82A] dark:border-[#76B82A]/50 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1D512E] dark:text-[#76B82A]">
              Nro
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1D512E] dark:text-[#76B82A]">
              Fecha / Hora
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1D512E] dark:text-[#76B82A]">
              Acción registrada
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1D512E] dark:text-[#76B82A]">
              Usuario
            </div>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <svg className="animate-spin h-7 w-7 text-[#76B82A] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm font-semibold tracking-wide">Cargando matriz de auditoría...</p>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-slate-400">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7.5 4.5h9A2.25 2.25 0 0118.75 6.75v10.5A2.25 2.25 0 0116.5 19.5h-9a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 017.5 4.5z" />
              </svg>
              <p className="text-sm font-medium">No existen registros para mostrar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logsFiltrados.map((log, index) => (
                <div
                  key={log.nro ?? index}
                  className="grid grid-cols-1 md:grid-cols-[120px_220px_minmax(260px,1fr)_220px] gap-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/30 p-4 shadow-sm hover:shadow-md hover:border-[#C5E5F9] dark:hover:border-[#1D512E] transition-all"
                >
                  {/* NRO */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#1D512E]/70 dark:text-[#76B82A] mb-2">
                      Nro
                    </p>
                    <div className="inline-flex items-center justify-center min-w-[48px] h-10 px-4 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 text-sm font-bold">
                      {log.nro ?? '—'}
                    </div>
                  </div>

                  {/* FECHA */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#1D512E]/70 dark:text-[#76B82A] mb-2">
                      Fecha / Hora
                    </p>
                    <div className="text-sm font-mono text-slate-600 dark:text-slate-300">
                      {log.fecha_hora || 'Sin fecha'}
                    </div>
                  </div>

                  {/* ACCION */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#1D512E]/70 dark:text-[#76B82A] mb-2">
                      Acción registrada
                    </p>
                    <div className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                      {log.accion || 'Sin acción'}
                    </div>
                  </div>

                  {/* USUARIO */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#1D512E]/70 dark:text-[#76B82A] mb-2">
                      Usuario
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                      @{log.user_name ? log.user_name.toLowerCase() : 'desconocido'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Usuario del sistema
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}