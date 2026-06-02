import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth_store';

export default function VentasCatalogo() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useAuthStore((state) => state.token);
  // Asumimos que el usuario logueado tiene estos datos en el store
  const { id_usuario, id_empresa } = useAuthStore((state) => state.user || { id_usuario: 2, id_empresa: 1 });
  
  const [catalogo, setCatalogo] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarCatalogo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCatalogo = async () => {
    try {
      // Usamos el id_empresa del usuario actual
      const res = await fetch(`${API_URL}/insumos/catalogo?id_empresa=${id_empresa}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCatalogo(data.catalogo);
      }
    } catch (error) {
      console.error("Error al cargar el catálogo", error);
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id_producto === producto.id_producto);
      if (existe) {
        // Verifica que no exceda el stock disponible
        if (existe.cantidad >= producto.stock_actual) return prev;
        
        return prev.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id_producto) => {
    setCarrito((prev) => prev.filter((item) => item.id_producto !== id_producto));
  };

  const actualizarCantidad = (id_producto, nuevaCantidad, stock_max) => {
    if (nuevaCantidad < 1 || nuevaCantidad > stock_max) return;
    setCarrito((prev) =>
      prev.map((item) =>
        item.id_producto === id_producto ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const totalCarrito = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

  const confirmarPedido = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío');
    setEnviando(true);

    const payload = {
      id_cliente: id_usuario,
      id_supervisor_admin: 15, // Podría ser asignado automáticamente en el backend o aquí
      id_empresa: id_empresa,
      detalles: carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }))
    };

    try {
      const response = await fetch(`${API_URL}/pedidos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      
      if (res.success) {
        alert(`¡Pedido #${res.nro_transaccion} registrado con éxito! Total: Bs. ${res.monto_total}`);
        setCarrito([]);
        cargarCatalogo(); // Recargamos para ver el stock actualizado
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('Error de red al procesar el pedido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen flex flex-col lg:flex-row gap-6">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-600"></div>
            CATÁLOGO DE INSUMOS
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 ml-5">
            Semillas y Fertilizantes Disponibles
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
            Cargando inventario...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {catalogo.map((prod) => (
              <div key={prod.id_producto} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                    prod.categoria === 'SEMILLA' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {prod.categoria}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    Stock: {prod.stock_actual} {prod.unidad_medida}
                  </span>
                </div>
                
                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{prod.nombre_producto}</h3>
                <p className="text-2xl font-black text-emerald-600 mb-4">
                  <span className="text-sm text-emerald-400 font-bold mr-1">Bs.</span>
                  {Number(prod.precio_unitario).toFixed(2)}
                </p>

                <button 
                  onClick={() => agregarAlCarrito(prod)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Agregar al Pedido
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN DERECHA: CARRITO Y CHECKOUT */}
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-auto lg:h-[calc(100vh-96px)] lg:sticky lg:top-8">
          <div className="p-5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Resumen del Pedido
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Carrito Vacío</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {carrito.map((item) => (
                  <div key={item.id_producto} className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-800 leading-tight">{item.nombre_producto}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Bs. {item.precio_unitario} x {item.unidad_medida}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                        <div className="flex items-center bg-slate-100 rounded">
                          <button onClick={() => actualizarCantidad(item.id_producto, item.cantidad - 1, item.stock_actual)} className="px-2 py-1 text-slate-500 hover:text-slate-800 font-bold">-</button>
                          <span className="text-xs font-black w-6 text-center">{item.cantidad}</span>
                          <button onClick={() => actualizarCantidad(item.id_producto, item.cantidad + 1, item.stock_actual)} className="px-2 py-1 text-slate-500 hover:text-slate-800 font-bold">+</button>
                        </div>
                        <button onClick={() => quitarDelCarrito(item.id_producto)} className="text-[9px] font-bold uppercase text-red-400 hover:text-red-600 tracking-wider">Remover</button>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between min-w-[90px]">
                      <span className="text-sm font-black text-slate-800">
                        Bs. {(item.cantidad * item.precio_unitario).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-2xl font-black text-slate-800">
                <span className="text-sm text-slate-400 mr-1">Bs.</span>
                {totalCarrito.toFixed(2)}
              </span>
            </div>
            <button 
              onClick={confirmarPedido}
              disabled={carrito.length === 0 || enviando}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {enviando ? 'PROCESANDO...' : 'CONFIRMAR COMPRA'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}