import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
// Importamos el nuevo archivo que creaste
import '../tabs/terrenos_tab.dart'; 

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  // Colores del ecosistema AgroEnlace
  final Color primaryGreen = const Color(0xFF1A5729);
  final Color accentGreen = const Color(0xFF7BC636);
  final Color bgColor = const Color(0xFFF8FAFC);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              _currentIndex == 0 ? 'AGROENLACE' : 
              _currentIndex == 1 ? 'CAMPAÑAS' : 
              _currentIndex == 2 ? 'MIS TERRENOS' : 'PERFIL',
              style: const TextStyle(
                fontWeight: FontWeight.w900, 
                fontSize: 18, 
                letterSpacing: 1.2,
                color: Colors.white
              ),
            ),
            if (_currentIndex == 0)
              const Text(
                'Panel de Control',
                style: TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold),
              )
          ],
        ),
        backgroundColor: primaryGreen,
        elevation: 0,
        centerTitle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: Colors.white),
            onPressed: () {},
          )
        ],
      ),

      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _getPantalla(_currentIndex),
      ),

      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))
          ],
        ),
        child: NavigationBarTheme(
          data: NavigationBarThemeData(
            indicatorColor: accentGreen.withOpacity(0.2),
            labelTextStyle: WidgetStateProperty.all(
              TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryGreen),
            ),
          ),
          child: NavigationBar(
            height: 70,
            backgroundColor: Colors.white,
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) => setState(() => _currentIndex = index),
            destinations: [
              NavigationDestination(
                icon: Icon(Icons.home_outlined, color: Colors.grey.shade600),
                selectedIcon: Icon(Icons.home_rounded, color: primaryGreen),
                label: 'Inicio',
              ),
              NavigationDestination(
                icon: Icon(Icons.eco_outlined, color: Colors.grey.shade600),
                selectedIcon: Icon(Icons.eco_rounded, color: primaryGreen),
                label: 'Campañas',
              ),
              NavigationDestination(
                icon: Icon(Icons.landscape_outlined, color: Colors.grey.shade600),
                selectedIcon: Icon(Icons.landscape_rounded, color: primaryGreen),
                label: 'Terrenos',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline_rounded, color: Colors.grey.shade600),
                selectedIcon: Icon(Icons.person_rounded, color: primaryGreen),
                label: 'Perfil',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _getPantalla(int index) {
    switch (index) {
      case 0: return const InicioTab();
      case 1: return const CampaniasTab();
      case 2: return const TerrenosTab(); // Clase que reside en lib/tabs/terrenos_tab.dart
      case 3: return const PerfilTab();
      default: return const InicioTab();
    }
  }
}

// =====================================================================
// TAB DE INICIO
// =====================================================================
class InicioTab extends StatelessWidget {
  const InicioTab({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final String nombreUsuario = authProvider.user?['name']?.split(' ')[0] ?? "Usuario";

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          "Hola, $nombreUsuario 👋",
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1A5729),
          ),
        ),
        const Text(
          "Bienvenido al panel de control de AgroEnlace.",
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        const SizedBox(height: 32),
        const Text(
          "ACCESO RÁPIDO",
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.1),
        ),
        const SizedBox(height: 16),
        _buildQuickAction("Registrar Terreno", "Crea un nuevo lote en el mapa", Icons.add_location_alt_rounded, const Color(0xFF1A5729)),
        const SizedBox(height: 12),
        _buildQuickAction("Nueva Campaña", "Inicia el registro de siembra", Icons.auto_graph_rounded, const Color(0xFF7BC636)),
        const SizedBox(height: 12),
        _buildQuickAction("Ver Reportes", "Consulta el rendimiento de tus lotes", Icons.insert_chart_outlined_rounded, Colors.blueGrey),
      ],
    );
  }

  Widget _buildQuickAction(String title, String subtitle, IconData icon, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: CircleAvatar(backgroundColor: color.withOpacity(0.1), child: Icon(icon, color: color)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
        onTap: () {},
      ),
    );
  }
}

// =====================================================================
// TAB DE CAMPAÑAS (Temporal hasta que creemos su archivo)
// =====================================================================
class CampaniasTab extends StatelessWidget {
  const CampaniasTab({super.key});
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text("Gestión de Campañas"));
  }
}

// =====================================================================
// TAB DE PERFIL
// =====================================================================
class PerfilTab extends StatelessWidget {
  const PerfilTab({super.key});
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final String nombreCompleto = authProvider.user?['name'] ?? "Usuario AgroEnlace";
    final String correo = authProvider.user?['mail'] ?? "correo@agroenlace.com";

    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 40),
          const CircleAvatar(
            radius: 50,
            backgroundColor: Color(0xFF1A5729),
            child: Icon(Icons.person, size: 50, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(nombreCompleto, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          Text(correo, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 40),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text("Configuración"),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text("Soporte Técnico"),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          const SizedBox(height: 40),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: ElevatedButton.icon(
              onPressed: () => Provider.of<AuthProvider>(context, listen: false).logout(),
              icon: const Icon(Icons.logout_rounded),
              label: const Text("CERRAR SESIÓN", style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade50,
                foregroundColor: Colors.red,
                minimumSize: const Size(double.infinity, 55),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}