import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart'; // Importa provider

import 'providers/auth_provider.dart'; // Importa tu nuevo provider
import 'screens/login_screen.dart';
// IMPORTANTE: Crea un archivo dummy llamado dashboard_screen.dart en screens/ 
// con un texto centrado para que no de error aquí, o usa el código que te daré luego.
import 'screens/dashboard_screen.dart'; 

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized(); 
  await dotenv.load(fileName: ".env");
  
  // Envolvemos la app en el MultiProvider
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const AgroEnlaceApp(),
    ),
  );
}

class AgroEnlaceApp extends StatefulWidget {
  const AgroEnlaceApp({super.key});

  @override
  State<AgroEnlaceApp> createState() => _AgroEnlaceAppState();
}

class _AgroEnlaceAppState extends State<AgroEnlaceApp> {
  
  @override
  void initState() {
    super.initState();
    // Apenas la app arranca, revisamos si ya hay un token guardado
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).checkStoredToken();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Escuchamos el estado de autenticación (Nuestro Zustand)
    final authProvider = Provider.of<AuthProvider>(context);

    return MaterialApp(
      title: 'AgroEnlace',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1A5729),
          brightness: Brightness.light,
        ),
      ),
      // LA MAGIA DEL ENRUTAMIENTO CONDICIONAL (Igual que en React)
      home: authProvider.isLoading 
          ? const Scaffold(body: Center(child: CircularProgressIndicator())) // Pantalla de carga inicial
          : authProvider.isAuthenticated 
              ? const DashboardScreen() 
              : const LoginScreen(),    
    );
  }
}