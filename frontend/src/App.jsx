import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
// import Register from "./pages/Register";

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true); // Empezamos a desvanecer
      
      const timer = setTimeout(() => {
        setDisplayLocation(location); // Cambiamos la página cuando está invisible
        setIsTransitioning(false);    // Volvemos a mostrar
      }, 300); // 300ms es el "punto dulce" de la elegancia
      
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`transition-opacity duration-300 ease-linear ${
      isTransitioning ? 'opacity-0' : 'opacity-100'
    }`}>
      <Routes location={displayLocation}>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/registro" element={<Register />} /> */}
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* El fondo fijo evita parpadeos blancos */}
      <div className="bg-[#D9F0FB] min-h-screen">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}