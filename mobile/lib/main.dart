import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart'; // Importante

import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart'; 

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized(); 
  await dotenv.load(fileName: ".env");
  
  // Envolvemos la app para que el AuthProvider esté disponible en todas partes
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
    // Apenas arranca la app, le decimos al Provider que busque el token
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).checkStoredToken();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Escuchamos el estado del Provider (como hacer const { token } = useAuthStore() en React)
    final authProvider = Provider.of<AuthProvider>(context);

    return MaterialApp(
      title: 'AgroEnlace',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1A5729)),
      ),
      // MAGIA DE ENRUTAMIENTO: Si está cargando, muestra circulito. 
      // Si hay token, muestra Dashboard. Si no, muestra Login.
      home: authProvider.isLoading 
          ? const Scaffold(body: Center(child: CircularProgressIndicator())) 
          : authProvider.isAuthenticated 
              ? const DashboardScreen() 
              : const LoginScreen(),    
    );
  }
}