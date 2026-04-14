import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart'; // Importamos el decodificador

class AuthProvider with ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _token;
  Map<String, dynamic>? _userData; // Aquí guardaremos el nombre, rol, etc.
  bool _isLoading = true;

  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  
  // Este es el GETTER que le faltaba al Dashboard
  Map<String, dynamic>? get user => _userData;

  Future<void> checkStoredToken() async {
    _token = await _storage.read(key: 'jwt_token');
    if (_token != null) {
      // Si el token existe, lo decodificamos para recuperar los datos del usuario
      _userData = JwtDecoder.decode(_token!);
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> login(String newToken) async {
    _token = newToken;
    // Decodificamos el token que viene de Flask
    _userData = JwtDecoder.decode(newToken); 
    
    await _storage.write(key: 'jwt_token', value: newToken);
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _userData = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners();
  }
}