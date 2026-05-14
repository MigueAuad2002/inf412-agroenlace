import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
// Asegúrate de que esta ruta sea correcta según tu estructura de carpetas
import '../tabs/terrenos_tab.dart'; 
import '../tabs/ordenes_tab.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  // Paleta de colores Corporativa AgroEnlace
  final Color primaryGreen = const Color(0xFF1A5729);
  final Color accentGreen = const Color(0xFF7BC636);
  final Color bgColor = const Color(0xFFF8FAFC);
  final Color slate800 = const Color(0xFF1E293B);

  int get idRol {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    return user != null && user['role'] != null ? (user['role'] is int ? user['role'] : int.tryParse(user['role'].toString()) ?? 0) : 0;
  }

  List<NavigationDestination> get _destinations {
    final destinations = <NavigationDestination>[];
    if (idRol == 1 || idRol == 2) {
      // Admin y Supervisor: Módulos, Campañas, Terrenos, Perfil
      destinations.add(NavigationDestination(
        icon: Icon(Icons.grid_view_rounded, color: Colors.grey.shade400),
        selectedIcon: Icon(Icons.grid_view_rounded, color: Color(0xFF1A5729)),
        label: 'Módulos',
      ));
      destinations.add(NavigationDestination(
        icon: Icon(Icons.eco_outlined, color: Colors.grey.shade400),
        selectedIcon: Icon(Icons.eco_rounded, color: Color(0xFF1A5729)),
        label: 'Campañas',
      ));
      destinations.add(NavigationDestination(
        icon: Icon(Icons.landscape_outlined, color: Colors.grey.shade400),
        selectedIcon: Icon(Icons.landscape_rounded, color: Color(0xFF1A5729)),
        label: 'Terrenos',
      ));
    } else if (idRol == 3) {
      // Empleado: Órdenes, Lotes, Perfil
      destinations.add(NavigationDestination(
        icon: Icon(Icons.assignment_outlined, color: Colors.grey.shade400),
        selectedIcon: Icon(Icons.assignment_rounded, color: Color(0xFF1A5729)),
        label: 'Órdenes',
      ));
      destinations.add(NavigationDestination(
        icon: Icon(Icons.landscape_outlined, color: Colors.grey.shade400),
        selectedIcon: Icon(Icons.landscape_rounded, color: Color(0xFF1A5729)),
        label: 'Lotes',
      ));
    } else {
      // Cliente: Terrenos, Perfil
      destinations.add(NavigationDestination(
        icon: Icon(Icons.landscape_outlined, color: Colors.grey.shade400),
        selectedIcon: Icon(Icons.landscape_rounded, color: Color(0xFF1A5729)),
        label: 'Terrenos',
      ));
    }
    // Perfil para todos
    destinations.add(NavigationDestination(
      icon: Icon(Icons.person_outline_rounded, color: Colors.grey.shade400),
      selectedIcon: Icon(Icons.person_rounded, color: Color(0xFF1A5729)),
      label: 'Perfil',
    ));
    return destinations;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              _currentIndex < _destinations.length ? _destinations[_currentIndex].label ?? 'AGROENLACE' : 'AGROENLACE',
              style: const TextStyle(
                fontWeight: FontWeight.w900, 
                fontSize: 18, 
                letterSpacing: 1.2,
                color: Colors.white
              ),
            ),
            if (_currentIndex == 0 && idRol >= 1 && idRol <= 3)
              const Text(
                'WORKSPACE',
                style: TextStyle(fontSize: 9, color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 2.0),
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
              TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryGreen),
            ),
          ),
          child: NavigationBar(
            height: 70,
            backgroundColor: Colors.white,
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) => setState(() => _currentIndex = index),
            destinations: _destinations,
          ),
        ),
      ),
    );
  }

  Widget _getPantalla(int index) {
    int actualIndex = 0;
    if (idRol == 1 || idRol == 2) {
      if (index == actualIndex) return const InicioTab();
      actualIndex++;
      if (index == actualIndex) return const CampaniasTab();
      actualIndex++;
      if (index == actualIndex) return const TerrenosTab();
      actualIndex++;
    } else if (idRol == 3) {
      if (index == actualIndex) return const OrdenesTab(); // Placeholder
      actualIndex++;
      if (index == actualIndex) return const TerrenosTab();
      actualIndex++;
    } else {
      if (index == actualIndex) return const TerrenosTab();
      actualIndex++;
    }
    if (index == actualIndex) return const PerfilTab();
    return const InicioTab();
  }
}

// =====================================================================
// MODELO Y DATOS DE MÓDULOS (Equivalente al Array de React)
// =====================================================================
class ModuloOption {
  final String id;
  final String titulo;
  final IconData icono;
  final Color colorIcono;
  final Color colorFondo;

  ModuloOption({
    required this.id, 
    required this.titulo, 
    required this.icono, 
    required this.colorIcono, 
    required this.colorFondo
  });
}

// =====================================================================
// TAB DE INICIO (Módulos estilo Grid Web)
// =====================================================================
class InicioTab extends StatelessWidget {
  const InicioTab({super.key});

  String _obtenerSaludo() {
    final hora = DateTime.now().hour;
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    // Extracción de datos del token decodificado
    final String nombreCompleto = user?['name'] ?? "Administrador";
    final String primerNombre = nombreCompleto.split(' ')[0];
    
    // Debug: Imprimir el contenido de user
    print('User data: $user');
    
    // El role define qué módulos se muestran (usando 'role' en lugar de 'id_rol')
    int idRol = 0;
    if (user != null && user['role'] != null) {
      idRol = user['role'] is int ? user['role'] : int.tryParse(user['role'].toString()) ?? 0;
    }

    final List<ModuloOption> modulos = [
      ModuloOption(id: 'produccion', titulo: 'Producción Agrícola', icono: Icons.agriculture_rounded, colorIcono: const Color(0xFF059669), colorFondo: const Color(0xFFECFDF5)),
      ModuloOption(id: 'comercial', titulo: 'Ventas y Comercial', icono: Icons.storefront_rounded, colorIcono: const Color(0xFF2563EB), colorFondo: const Color(0xFFEFF6FF)),
      ModuloOption(id: 'crm', titulo: 'Gestión CRM', icono: Icons.people_alt_rounded, colorIcono: const Color(0xFF9333EA), colorFondo: const Color(0xFFFAF5FF)),
      ModuloOption(id: 'admin', titulo: 'Admin. y Finanzas', icono: Icons.account_balance_wallet_rounded, colorIcono: const Color(0xFFEA580C), colorFondo: const Color(0xFFFFF7ED)),
      ModuloOption(id: 'reportes', titulo: 'Reportes e Intel.', icono: Icons.bar_chart_rounded, colorIcono: const Color(0xFFE11D48), colorFondo: const Color(0xFFFFF1F2)),
      ModuloOption(id: 'security', titulo: 'Seguridad y Accesos', icono: Icons.security_rounded, colorIcono: const Color(0xFF0891B2), colorFondo: const Color(0xFFECFEFF)),
      ModuloOption(id: 'downloads', titulo: 'Descargas', icono: Icons.download_rounded, colorIcono: const Color(0xFF475569), colorFondo: const Color(0xFFF1F5F9)),
    ];

    // Filtrado por roles idéntico al Home.jsx
    final modulosPermitidos = modulos.where((mod) {
      if (mod.id == 'security') return idRol == 1;
      if (mod.id == 'produccion') return [1, 2, 3].contains(idRol);
      return true;
    }).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 30),
          Text(
            "${_obtenerSaludo()},\n$primerNombre",
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), height: 1.1),
          ),
          const SizedBox(height: 8),
          Text("Selecciona un módulo operativo:", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.grey.shade500)),
          const SizedBox(height: 24),
          Expanded(
            child: GridView.builder(
              itemCount: modulosPermitidos.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.0,
              ),
              itemBuilder: (context, index) {
                final mod = modulosPermitidos[index];
                return _buildModuloCard(mod, context);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModuloCard(ModuloOption modulo, BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: InkWell(
        onTap: () {},
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: modulo.colorFondo, borderRadius: BorderRadius.circular(12)),
                child: Icon(modulo.icono, color: modulo.colorIcono, size: 30),
              ),
              const SizedBox(height: 12),
              Text(
                modulo.titulo,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =====================================================================
// TABS TEMPORALES
// =====================================================================
class CampaniasTab extends StatelessWidget {
  const CampaniasTab({super.key});
  @override
  Widget build(BuildContext context) {
    return const Center(child: Text("Módulo de Campañas"));
  }
}



// =====================================================================
// TAB DE PERFIL (Corporativo)
// =====================================================================
class PerfilTab extends StatelessWidget {
  const PerfilTab({super.key});
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    
    final String nombreCompleto = user?['name'] ?? "Usuario AgroEnlace";
    final String correo = user?['username'] ?? "admin@agroenlace.com";

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 20),
        const Center(
          child: CircleAvatar(
            radius: 50,
            backgroundColor: Color(0xFF1A5729),
            child: Icon(Icons.person, size: 55, color: Colors.white),
          ),
        ),
        const SizedBox(height: 16),
        Center(child: Text(nombreCompleto, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900))),
        Center(child: Text(correo, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold))),
        const SizedBox(height: 40),
        _itemPerfil(Icons.settings_outlined, "Configuración del Sistema"),
        _itemPerfil(Icons.help_outline, "Centro de Soporte"),
        const SizedBox(height: 40),
        ElevatedButton(
          onPressed: () => authProvider.logout(),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFEF2F2),
            foregroundColor: const Color(0xFFB91C1C),
            padding: const EdgeInsets.symmetric(vertical: 18),
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text("CERRAR SESIÓN CORPORATIVA", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
        ),
      ],
    );
  }

  Widget _itemPerfil(IconData icon, String label) {
    return Column(
      children: [
        ListTile(
          // CORRECCIÓN: Usamos Color(0xFF475569) en lugar de Colors.slate
          leading: Icon(icon, color: const Color(0xFF475569)),
          title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          trailing: const Icon(Icons.chevron_right, size: 18),
          onTap: () {},
        ),
        const Divider(height: 1),
      ],
    );
  }
}