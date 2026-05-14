import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { despertarBackend } from "./services/api";

//COMPONENTES SEGURIDAD Y LAYOUT
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute"; 
import DashboardLayout from "./components/DashboardLayout"; 

//PANTALLAS
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SecurityUsers from "./pages/SecurityUsers"; 
import SecurityAudit from "./pages/SecurityAudit";
import SecurityRole from "./pages/SecurityRole";
import AgroLotes from "./pages/AgroLotes";
import AgroCampanias from "./pages/AgroCampanias";
import AgroMaquinarias from "./pages/AgroMaquinarias";
import AgroBodega from "./pages/AgroBodega";
import Downloads from "./pages/Downloads";
import Profile from "./pages/Profile";


function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`transition-opacity duration-300 ease-linear ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <Routes location={displayLocation}>
        
        {/* PÚBLICAS */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        

        {/* PRIVADAS GENERALES (Cualquier usuario logueado) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path='/profile' element={<Profile/>}/>
        </Route>

        {/* PRIVADAS SOLO ADMINISTRADORES */}
        <Route element={<AdminRoute />}>
          {/*LAYOUT - PLANTILLA QUE CONTIENE EL SIDEBAR*/}
          <Route element={<DashboardLayout />}>
            <Route path="/security/users" element={<SecurityUsers />} />
            <Route path="/security/roles" element={<SecurityRole/>} />
            <Route path="/security/audit" element={<SecurityAudit/>} />
            <Route path="/agro/lote" element={<AgroLotes />} />
            <Route path="/agro/campana" element={<AgroCampanias/>} />
            <Route path="/agro/maquinaria" element={<AgroMaquinarias/>} />
            <Route path="/agro/cultivo" element={<AgroBodega />} />

            {/* Rutas en construcción*/}
            
            <Route path="/agro/ordenes" element={<div className="p-8 font-bold text-gray-500">Configuración de Ordenes Trabajo (Próximamente)</div>} />

          </Route>
        </Route>

      </Routes>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    despertarBackend();
  }, []);
  
  return (
    <BrowserRouter>
      {/* El fondo base se mantiene para las pantallas de Login/Welcome */}
      <div className="bg-[#D9F0FB] min-h-screen">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );

}