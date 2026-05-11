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
  String _errorMessage = ''; // Agregado para simular el banner de error de React

  @override
  void dispose() {
    _userController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_userController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Debe ingresar su correo y contraseña.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final String apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.1.15:5000/api';
      
      final response = await http.post(
        Uri.parse('$apiUrl/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'user_input': _userController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['access_token']; 
        if (!mounted) return; 

        Provider.of<AuthProvider>(context, listen: false).login(token);
        // Redirección manejada usualmente por el AuthProvider/Main
      } 
      else {
        if (!mounted) return;
        setState(() {
          _errorMessage = data['message'] ?? 'Credenciales incorrectas';
        });
      }
    } catch (e) {
      print("Error crítico de conexión: $e");
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Error de comunicación con el servidor.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // Método auxiliar para el botón DEMO
  void _cargarDemo() {
    setState(() {
      _userController.text = 'emple@agroenlace.com';
      _passwordController.text = '12345678';
      _errorMessage = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    // Paleta de colores exacta extraída del JSX (Tailwind)
    const Color bgCeleste = Color(0xFFEBF5FF);
    const Color darkGreen = Color(0xFF1A5729);
    const Color slate50 = Color(0xFFF8FAFC);
    const Color slate100 = Color(0xFFF1F5F9);
    const Color slate200 = Color(0xFFE2E8F0);
    const Color slate500 = Color(0xFF64748B);
    const Color slate800 = Color(0xFF1E293B);
    
    return Scaffold(
      backgroundColor: bgCeleste,
      body: Stack(
        children: [
          // Línea decorativa superior (Fija)
          Positioned(
            top: 0, left: 0, right: 0,
            child: Container(height: 6, color: darkGreen),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    
                    // ==========================================
                    // TARJETA DE LOGIN CORPORATIVA
                    // ==========================================
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 400),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8), // rounded-lg
                        border: Border.all(color: slate200),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 15,
                            offset: Offset(0, 5),
                          )
                        ],
                      ),
                      child: Column(
                        children: [
                          // Header Compacto
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                            decoration: const BoxDecoration(
                              color: slate50,
                              borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
                              border: Border(bottom: BorderSide(color: slate100)),
                            ),
                            child: Column(
                              children: [
                                Image.asset(
                                  'assets/LOGO.png',
                                  height: 64,
                                  width: 64,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) => 
                                    const Icon(Icons.eco, size: 64, color: darkGreen),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'ACCESO AL SISTEMA',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: slate800,
                                    letterSpacing: 2.0, // tracking-widest
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Formulario
                          Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                
                                // MENSAJE DE ERROR (Estilo Web)
                                if (_errorMessage.isNotEmpty)
                                  Container(
                                    margin: const EdgeInsets.only(bottom: 20),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF2F2), // red-50
                                      border: const Border(left: BorderSide(color: Colors.red, width: 4)),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      _errorMessage.toUpperCase(),
                                      style: const TextStyle(
                                        color: Color(0xFFB91C1C), // red-700
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),

                                // Input Usuario
                                const Text(
                                  'USUARIO',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: slate500,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: _userController,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  style: const TextStyle(fontSize: 14),
                                  decoration: InputDecoration(
                                    hintText: 'emple@agroenlace.com',
                                    hintStyle: TextStyle(color: Colors.grey.shade400),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    filled: true,
                                    fillColor: slate50,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(4), // rounded
                                      borderSide: const BorderSide(color: slate200),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(4),
                                      borderSide: const BorderSide(color: slate200),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(4),
                                      borderSide: const BorderSide(color: darkGreen, width: 2),
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(height: 16),

                                // Input Contraseña
                                const Text(
                                  'CONTRASEÑA',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: slate500,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  textInputAction: TextInputAction.done,
                                  onSubmitted: (_) => _handleLogin(),
                                  style: const TextStyle(fontSize: 14),
                                  decoration: InputDecoration(
                                    hintText: '••••••••',
                                    hintStyle: TextStyle(color: Colors.grey.shade400),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    filled: true,
                                    fillColor: slate50,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(4),
                                      borderSide: const BorderSide(color: slate200),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(4),
                                      borderSide: const BorderSide(color: slate200),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(4),
                                      borderSide: const BorderSide(color: darkGreen, width: 2),
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                        color: Colors.grey.shade400,
                                        size: 20,
                                      ),
                                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 24),

                                // Botón Principal
                                ElevatedButton(
                                  onPressed: _isLoading ? null : _handleLogin,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: darkGreen,
                                    disabledBackgroundColor: slate500,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(4), // rounded
                                    ),
                                    elevation: 0,
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 16, width: 16,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                        )
                                      : const Text(
                                          'INGRESAR',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 2.0, // tracking-[0.2em]
                                            color: Colors.white,
                                          ),
                                        ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ==========================================
                    // BANNER DE PRUEBA COMPACTO
                    // ==========================================
                    Container(
                      margin: const EdgeInsets.only(top: 16),
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 400),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withOpacity(0.05), // bg-blue-600/10
                        border: Border.all(color: const Color(0xFFBFDBFE)), // border-blue-200
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Icon(Icons.key, color: Colors.white, size: 16),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'USUARIO DEMO',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF1D4ED8), // blue-700
                                  ),
                                ),
                                Text(
                                  'emple@agroenlace.com / 12345678',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey.shade700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            onPressed: _cargarDemo,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB), // blue-600
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                              minimumSize: const Size(0, 32),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'CARGAR',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ==========================================
                    // FOOTER
                    // ==========================================
                    const SizedBox(height: 24),
                    const Text(
                      'UAGRM • 2026',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: slate500,
                        letterSpacing: 2.0,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}