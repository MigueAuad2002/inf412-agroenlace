import { create } from 'zustand';

//FUNCION AUXILIAR PARA LEER EL TOKEN Y VALIDAR SI ESTA ACTIVO
const checkTokenValidity = (token) => {
  if (!token) return false;
  
  try 
  {
    //ASEGURARSE DE QUE EL TOKEN ESTA DIVIDIDO EN 3 PARTES
    const parts = token.split('.');

    //SI NO TIENE 3 PARTES NO ES VALIDO Y RETORNA FALSO
    if (parts.length !== 3) return false; 

    //DECODIFICAR EL PAYLOAD (PARTE DEL MEDIO) DE BASE 64 A JSON
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    
    //VERIFICAR SI EXPIRO
    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) 
    {
      console.warn("El token ha expirado.");
      return false; 
    }
    
    //DEVOLVER TRUE EN CASO DE QUE SEA UN TOKEN VALIDO Y NO HAYA EXPIRADO
    return true; 
  } 
  catch (error) 
  {
    //RETORNAR FALSO EN CASO DE QUE EL PARSEO A JSON FALLE OSEA QUE NO ERA UN TOKEN VALIDO
    return false; 
  }
};

//LEER ALMACENAMIENTO
const storedToken = localStorage.getItem('token');
const storedUser = JSON.parse(localStorage.getItem('user'));

//APLICAR VALIDACION
const isValid = checkTokenValidity(storedToken);

export const useAuthStore = create((set) => ({
  //GUARDAMOS EN LOCALSTORAGE SOLO SI EL TOKEN ES VALIDO
  token: isValid ? storedToken : null,
  user: isValid ? storedUser : null,

  //ACCION PARA INICIAR SESION
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  //ACCION PARA CERRAR SESION
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  }
}));