import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // Variable para saber qué pestaña está activa
  int _currentIndex = 0;

  // Lista de las 4 pantallas que se van a intercambiar
  final List<Widget> _pantallas = [
    const InicioTab(),
    const CampaniasTab(),
    const TerrenosTab(),
    const PerfilTab(),
  ];

  @override
  Widget build(BuildContext context) {
    const Color primaryGreen = Color(0xFF1A5729);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      
      // El AppBar superior cambia de título dinámicamente
      appBar: AppBar(
        title: Text(
          _currentIndex == 0 ? 'AgroEnlace' : 
          _currentIndex == 1 ? 'Campañas' : 
          _currentIndex == 2 ? 'Terrenos' : 'Mi Perfil',
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: primaryGreen,
        elevation: 0,
        centerTitle: true,
      ),

      // Aquí se inyecta la pantalla seleccionada
      body: _pantallas[_currentIndex],

      // La barra de navegación inferior
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index; // Actualiza el estado y redibuja la pantalla
          });
        },
        type: BottomNavigationBarType.fixed, // Mantiene los colores fijos
        backgroundColor: Colors.white,
        selectedItemColor: primaryGreen,
        unselectedItemColor: Colors.grey.shade400,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.eco_outlined),
            activeIcon: Icon(Icons.eco),
            label: 'Campañas',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.landscape_outlined),
            activeIcon: Icon(Icons.landscape),
            label: 'Terrenos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

// =====================================================================
// PANTALLAS TEMPORALES (Luego las moveremos a sus propios archivos)
// =====================================================================

class InicioTab extends StatelessWidget {
  const InicioTab({super.key});
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Resumen General (KPIs) irá aquí', style: TextStyle(fontSize: 16, color: Colors.grey)),
    );
  }
}

class CampaniasTab extends StatelessWidget {
  const CampaniasTab({super.key});
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Lista de Campañas irá aquí', style: TextStyle(fontSize: 16, color: Colors.grey)),
    );
  }
}

class TerrenosTab extends StatelessWidget {
  const TerrenosTab({super.key});
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Lista de Lotes/Terrenos irá aquí', style: TextStyle(fontSize: 16, color: Colors.grey)),
    );
  }
}

class PerfilTab extends StatelessWidget {
  const PerfilTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.person, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('Sesión Activa', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 32),
          // El botón de logout ahora vive aquí
          ElevatedButton.icon(
            onPressed: () {
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
            icon: const Icon(Icons.logout),
            label: const Text('Cerrar Sesión'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade50,
              foregroundColor: Colors.red,
              elevation: 0,
            ),
          )
        ],
      ),
    );
  }
}