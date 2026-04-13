import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider with ChangeNotifier {
  // Inicializamos el almacenamiento seguro del celular
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _token;
  bool _isLoading = true; // Para saber si estamos leyendo el token guardado

  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;

  // 1. Al arrancar la app, buscamos si ya había un token guardado
  Future<void> checkStoredToken() async {
    _token = await _storage.read(key: 'jwt_token');
    _isLoading = false;
    notifyListeners(); // Avisa a la app que ya terminó de revisar
  }

  // 2. Función que llamaremos cuando el Login sea exitoso
  Future<void> login(String newToken) async {
    _token = newToken;
    await _storage.write(key: 'jwt_token', value: newToken);
    notifyListeners(); 

  // 3. Función para cerrar sesión
  Future<void> logout() async {
    _token = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners(); 
  }
}