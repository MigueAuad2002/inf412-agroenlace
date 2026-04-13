import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _userController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _userController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_userController.text.trim().isEmpty || _passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debe ingresar su Correo y Contraseña.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final String apiUrl = dotenv.env['API_URL'] ?? 'http://10.0.2.2:5000/api';
      
      final response = await http.post(
        Uri.parse('$apiUrl/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'user_input': _userController.text.trim(),
          'password': _passwordController.text.trim(),
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        
        final token = data['access_token']; 
        if (!mounted) return; 

        Provider.of<AuthProvider>(context, listen: false).login(token);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Bienvenido a AgroEnlace!'),
            backgroundColor: Color(0xFF1A5729),
          ),
        );
      } 
      else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Usuario o contraseña incorrectos'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
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
    // Definimos los colores exactos de tu web
    const Color primaryGreen = Color(0xFF1A5729);
    const Color lightGreen = Color(0xFF7CB342); // Verde claro para los links
    const Color backgroundBlue = Color(0xFFE1F0F5); // Fondo celeste de la web

    return Scaffold(
      backgroundColor: backgroundBlue,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Container(
              // Este container simula la "tarjeta" blanca del centro
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 15,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Borde verde superior (Simulado con un Container)
                  Container(
                    height: 6,
                    decoration: const BoxDecoration(
                      color: primaryGreen,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                    ),
                  ),
                  
                  Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Logo (Cuadro celeste claro con icono)
                        Center(
                          child: Container(
                            height: 80,
                            width: 80,
                            decoration: BoxDecoration(
                              color: const Color(0xFFD4EBF2),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Image.asset(
                                'assets/LOGO.png', 
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) {
                                  // Fallback por si la imagen aún no carga
                                  return const Icon(Icons.eco, size: 50, color: primaryGreen);
                                },
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Títulos
                        const Text(
                          'Bienvenido',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: primaryGreen,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'ACCESO INSTITUCIONAL',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Input de Usuario
                        const Text(
                          'USUARIO O CORREO',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: primaryGreen,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _userController,
                          decoration: InputDecoration(
                            hintText: 'nombre@empresa.com o jperez',
                            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: primaryGreen, width: 2),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Input de Contraseña con enlace de recuperar clave
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'CONTRASEÑA',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: primaryGreen,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              '¿OLVIDASTE TU CLAVE?',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: lightGreen,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            hintText: '••••••••',
                            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: primaryGreen, width: 2),
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                color: Colors.grey.shade400,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Botón de Ingresar
                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8), // Bordes menos curvos como en la web
                            ),
                            elevation: 2,
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
                                  'INGRESAR AL SISTEMA',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                        ),
                        
                        const SizedBox(height: 32),
                        const Divider(color: Colors.black12),
                        const SizedBox(height: 16),

                        // Footer
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '¿Aún no tienes acceso? ',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                            Text(
                              'SOLICITAR CUENTA',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: lightGreen,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}