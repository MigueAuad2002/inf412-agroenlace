import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // 1. Controladores (El puente entre lo que escribes y las variables)
  final TextEditingController _userController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;

  // Buena práctica: Limpiar la memoria de los controladores al salir
  @override
  void dispose() {
    _userController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    // 2. Validación local con tu mensaje personalizado
    if (_userController.text.trim().isEmpty || _passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe ingresar su Correo y Contraseña.'),
          backgroundColor: Colors.red, // Rojo como en tu captura
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // 3. Obtener URL del .env (Recuerda usar http://10.0.2.2:5000/api para local)
      final String apiUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:5000/api';
      
      // 4. Petición POST al Backend de Flask
      final response = await http.post(
        Uri.parse('$apiUrl/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          // OJO AQUÍ: Asegúrate de que 'username' es la palabra que espera tu backend de Python
          'user_input': _userController.text.trim(),
          'password': _passwordController.text.trim(),
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        // ¡LOGIN EXITOSO!
        final token = data['token'];
        print("¡Token JWT recibido en la terminal!: $token");
        
        if (!mounted) return; 

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Bienvenido a AgroEnlace!'),
            backgroundColor: Color(0xFF1A5729), // Verde corporativo
          ),
        );
        
        // TODO: Guardar el token y redirigir
        
      } else {
        // Credenciales incorrectas rechazadas por el backend
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Usuario o contraseña incorrectos'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Error si Flask está apagado o no hay internet
      print("Error crítico de conexión: $e");
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error de conexión con el servidor. Verifica que Flask esté corriendo.'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo 
                const Icon(
                  Icons.eco_rounded, 
                  size: 80, 
                  color: Color(0xFF1A5729)
                ),
                const SizedBox(height: 16),
                const Text(
                  'AgroEnlace',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1A5729),
                    letterSpacing: -0.5,
                  ),
                ),
                const Text(
                  'Workspace Móvil',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 48),

                // ==========================================
                // INPUT DE USUARIO (Con su controller asignado)
                // ==========================================
                TextField(
                  controller: _userController, // ESTA LÍNEA ES LA QUE FALTABA
                  decoration: InputDecoration(
                    labelText: 'Usuario',
                    prefixIcon: const Icon(Icons.person_outline, color: Colors.grey),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black12),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF1A5729), width: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // ==========================================
                // INPUT DE CONTRASEÑA (Con su controller asignado)
                // ==========================================
                TextField(
                  controller: _passwordController, // ESTA LÍNEA ES LA QUE FALTABA
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Contraseña',
                    prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black12),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF1A5729), width: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Botón de Ingresar
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A5729),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'INGRESAR',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}