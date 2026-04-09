import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { despertarBackend } from "./services/api";

// Componentes de Seguridad y Layout
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute"; 
import DashboardLayout from "./components/DashboardLayout"; 

// Páginas
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SecurityUsers from "./pages/SecurityUsers"; 

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
        </Route>

        {/* PRIVADAS SOLO ADMINISTRADORES (Requiere id_rol === 1) */}
        <Route element={<AdminRoute />}>
          {/*LAYOUT - PLANTILLA QUE CONTIENE EL SIDEBAR*/}
          <Route element={<DashboardLayout />}>
            <Route path="/security/users" element={<SecurityUsers />} />
            
            {/* Rutas en construcción*/}
            <Route path="/security/roles" element={<div className="p-8 font-bold text-gray-500">Configuración de Roles (Próximamente)</div>} />
            <Route path="/security/audit" element={<div className="p-8 font-bold text-gray-500">Bitácora del Sistema (Próximamente)</div>} />
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