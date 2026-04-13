import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider with ChangeNotifier {
  // Inicializamos el almacenamiento seguro (la "bóveda" del celular)
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _token;
  bool _isLoading = true; // Empieza en true mientras busca el token guardado

  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;

  // 1. Al arrancar la app, buscamos si el usuario ya se había logueado antes
  Future<void> checkStoredToken() async {
    _token = await _storage.read(key: 'jwt_token');
    _isLoading = false;
    notifyListeners(); // ¡Avisa a toda la app que cambie la pantalla!
  }

  // 2. Función que llamaremos cuando el Login sea exitoso (desde login_screen.dart)
  Future<void> login(String newToken) async {
    _token = newToken;
    await _storage.write(key: 'jwt_token', value: newToken);
    notifyListeners(); // ¡Avisa a la app que oculte el Login y muestre el Dashboard!
  }

  // 3. Función para cerrar sesión
  Future<void> logout() async {
    _token = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners(); // ¡Avisa a la app que lo devuelva al Login!
  }
}