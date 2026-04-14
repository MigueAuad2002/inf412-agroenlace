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
    if (_userController.text.trim().isEmpty || _passwordController.text.isEmpty) {
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
          'password': _passwordController.text, // Eliminado el .trim() de la contraseña
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
          content: Text('Error de conexión con el servidor.'),
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
    const Color primaryGreen = Color(0xFF1A5729);
    const Color lightGreen = Color(0xFF7CB342);
    const Color backgroundBlue = Color(0xFFE1F0F5);

    return Scaffold(
      backgroundColor: backgroundBlue,
      // Usamos SafeArea pero permitimos que el fondo blanco baje hasta el final
      body: SafeArea(
        bottom: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              // Este ConstrainedBox asegura que el contenido ocupe al menos toda la pantalla,
              // empujando el panel blanco hasta abajo incluso si el teclado no está abierto.
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      // ==========================================
                      // SECCIÓN SUPERIOR: Logo y Bienvenida
                      // ==========================================
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40.0, horizontal: 24.0),
                        child: Column(
                          children: [
                            // Logo (Mantenemos tu diseño exacto que ya validaste)
                            Container(
                              height: 80,
                              width: 80,
                              decoration: BoxDecoration(
                                color: const Color(0xFFD4EBF2),
                                borderRadius: BorderRadius.circular(20), // Un poco más curvo para móvil
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.black12,
                                    blurRadius: 10,
                                    offset: Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Image.asset(
                                  'assets/LOGO.png', 
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(Icons.eco, size: 40, color: primaryGreen);
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            
                            const Text(
                              'AgroEnlace',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: primaryGreen,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Acceso Institucional',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.black54,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // ==========================================
                      // SECCIÓN INFERIOR: Formulario en "Bottom Sheet"
                      // ==========================================
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 10,
                                offset: Offset(0, -2),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Input de Usuario
                              const Text(
                                'Correo electrónico o Usuario',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _userController,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                decoration: InputDecoration(
                                  hintText: 'ej. nombre@empresa.com',
                                  hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                                  prefixIcon: Icon(Icons.person_outline, color: Colors.grey.shade500),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                                  filled: true,
                                  fillColor: Colors.grey.shade50,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: primaryGreen, width: 2),
                                  ),
                                ),
                              ),
                              
                              const SizedBox(height: 24),

                              // Input de Contraseña
                              const Text(
                                'Contraseña',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                onSubmitted: (_) => _handleLogin(), // Permite loguearse presionando "Enter" en el teclado
                                decoration: InputDecoration(
                                  hintText: '••••••••',
                                  hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                                  prefixIcon: Icon(Icons.lock_outline, color: Colors.grey.shade500),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                                  filled: true,
                                  fillColor: Colors.grey.shade50,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
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

                              // Recuperar Clave alineado a la derecha, estilo app
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {
                                    // Acción para recuperar contraseña
                                  },
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 8),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: const Text(
                                    '¿Olvidaste tu contraseña?',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: lightGreen,
                                    ),
                                  ),
                                ),
                              ),
                              
                              const SizedBox(height: 32),

                              // Botón Principal
                              ElevatedButton(
                                onPressed: _isLoading ? null : _handleLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryGreen,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12), // Más curvo, amigable al dedo
                                  ),
                                  elevation: 0, // Las apps modernas suelen usar menos sombras en botones grandes
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
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                              ),

                              // Spacer empuja el footer hacia abajo si la pantalla es muy alta
                              const Spacer(),
                              const SizedBox(height: 24),

                              // Footer
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    '¿No tienes una cuenta? ',
                                    style: TextStyle(
                                      fontSize: 14, 
                                      color: Colors.grey.shade600
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      // Navegar a Registro
                                    },
                                    child: const Text(
                                      'Solicitar acceso',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: primaryGreen,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              // Margen de seguridad para el teclado en iOS/Android
                              SizedBox(height: MediaQuery.of(context).viewInsets.bottom > 0 ? 20 : 0),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}