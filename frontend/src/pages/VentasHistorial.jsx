import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function HistorialPedidos() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  const { id_usuario } = useAuthStore((state) => state.user);
  
  const [pedidos, setPedidos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detalleLoading, setDetalleLoading] = useState(false);
  
  // Caché de detalles para evitar re-fetches
  const detallesCache = useRef({});

  useEffect(() => {
    if (!id_usuario || !token) return;
    
    setLoading(true);
    fetch(`${API_URL}/pedidos/historial?id_usuario=${id_usuario}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setPedidos(data.listado || []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id_usuario, token, API_URL]);

  const verDetalle = useCallback(async (nro) => {
    // Si ya está en caché, no hacer fetch
    if (detallesCache.current[nro]) {
      setDetalle(detallesCache.current[nro]);
      setPedidoSeleccionado(nro);
      return;
    }

    setDetalleLoading(true);
    try {
      const res = await fetch(`${API_URL}/pedidos/detalle?nro_transaccion=${nro}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Guardar en caché
      detallesCache.current[nro] = data.detalles;
      
      setDetalle(data.detalles);
      setPedidoSeleccionado(nro);
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    } finally {
      setDetalleLoading(false);
    }
  }, [API_URL, token]);

  // Memoizar el cálculo del total
  const montoTotal = useMemo(() => {
    return detalle?.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0) || 0;
  }, [detalle]);

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen">
      {/* CABECERA */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <div className="w-2 h-6 md:h-8 bg-[#1A5729]"></div>
          HISTORIAL DE PEDIDOS
        </h1>
        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 ml-5">
          Tus compras y transacciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE PEDIDOS */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-100">
              <h2 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#1A5729]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                Mis Pedidos
              </h2>
            </div>

            <div className="divide-y divide-slate-100 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A5729] mx-auto"></div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 tracking-widest">Cargando...</p>
                </div>
              ) : pedidos.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <p className="text-[9px] font-bold uppercase tracking-widest">Sin pedidos registrados</p>
                </div>
              ) : (
                pedidos.map(p => (
                  <div 
                    key={p.nro_transaccion} 
                    onClick={() => verDetalle(p.nro_transaccion)}
                    className={`p-4 md:p-5 cursor-pointer transition-all duration-300 ${
                      pedidoSeleccionado === p.nro_transaccion 
                        ? 'bg-emerald-50 border-l-4 border-l-[#1A5729]' 
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-black text-xs md:text-sm text-slate-800">
                          Pedido #{p.nro_transaccion}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                          {new Date(p.fecha_hora).toLocaleDateString('es-BO', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                          p.estado?.toUpperCase() === 'CONFIRMADO' ? 'bg-emerald-100 text-emerald-800' :
                          p.estado?.toUpperCase() === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {p.estado || 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-black text-[#1A5729]">
                      Bs. {Number(p.monto_total).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* DETALLE / FACTURA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {pedidoSeleccionado ? (
              <>
                <div className="p-4 md:p-6 bg-[#1A5729] text-white border-b border-[#0d3118]">
                  <h3 className="text-sm md:text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Factura / Recibo
                  </h3>
                  <p className="text-sm font-bold text-emerald-100 mt-1">Transacción #{pedidoSeleccionado}</p>
                </div>

                {detalleLoading ? (
                  <div className="p-8 md:p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A5729] mx-auto"></div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 tracking-widest">Cargando detalles...</p>
                  </div>
                ) : (
                  <>
                <div className="p-4 md:p-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">
                        <th className="pb-3">Producto</th>
                        <th className="pb-3 text-center">Cantidad</th>
                        <th className="pb-3 text-right">Precio Unit.</th>
                        <th className="pb-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detalle && detalle.length > 0 ? (
                        detalle.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 font-bold text-slate-800">{item.nombre_producto}</td>
                            <td className="py-3 text-center text-slate-700">{item.cantidad}</td>
                            <td className="py-3 text-right text-slate-700">Bs. {Number(item.precio_venta).toFixed(2)}</td>
                            <td className="py-3 text-right font-black text-[#1A5729]">
                              Bs. {(item.cantidad * item.precio_venta).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-400 text-xs">Sin detalles disponibles</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="mt-6 pt-6 border-t-2 border-slate-200">
                    <div className="flex justify-end mb-4">
                      <div className="w-full sm:w-80">
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-slate-600 font-bold">Subtotal:</span>
                          <span className="font-bold text-slate-800">Bs. {montoTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-4 text-sm">
                          <span className="text-slate-600 font-bold">Impuesto (IVA):</span>
                          <span className="font-bold text-slate-800">Bs. 0.00</span>
                        </div>
                        <div className="flex justify-between bg-[#1A5729] text-white px-4 py-3 rounded-lg">
                          <span className="font-black uppercase tracking-wider">Total a Pagar:</span>
                          <span className="text-xl font-black">Bs. {montoTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Gracias por su compra • AGROENLACE
                  </p>
                </div>
                  </>
                )}
              </>
            ) : (
              <div className="p-12 md:p-20 text-center">
                <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  Selecciona un pedido para ver el detalle
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}