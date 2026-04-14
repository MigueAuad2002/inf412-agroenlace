import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class TerrenosTab extends StatefulWidget {
  const TerrenosTab({super.key});

  @override
  State<TerrenosTab> createState() => _TerrenosTabState();
}

class _TerrenosTabState extends State<TerrenosTab> {
  List<dynamic> _terrenos = [];
  bool _isLoading = true;
  final String _apiUrl = dotenv.env['API_URL'] ?? 'https://inf412-agro-enlace.onrender.com/api';

  @override
  void initState() {
    super.initState();
    _fetchTerrenos();
  }

  // GET: Obtener terrenos
  Future<void> _fetchTerrenos() async {
    setState(() => _isLoading = true);
    final token = Provider.of<AuthProvider>(context, listen: false).token;

    try {
      final response = await http.get(
        Uri.parse('$_apiUrl/get-terrenos'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);
      if (data['success']) {
        setState(() {
          _terrenos = data['list_terrenos'];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error al cargar terrenos: $e");
      setState(() => _isLoading = false);
    }
  }

  // DELETE: Eliminar terreno
  Future<void> _deleteTerreno(int nroLote) async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    try {
      final response = await http.post(
        Uri.parse('$_apiUrl/delete-terreno'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'nro_lote': nroLote}),
      );
      final data = jsonDecode(response.body);
      if (data['success']) {
        _fetchTerrenos();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Terreno eliminado")));
      }
    } catch (e) {
      debugPrint("Error al eliminar: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A5729)))
          : RefreshIndicator(
              onRefresh: _fetchTerrenos,
              child: _terrenos.isEmpty
                  ? const Center(child: Text("No tienes terrenos registrados"))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _terrenos.length,
                      itemBuilder: (context, index) {
                        final lote = _terrenos[index];
                        return _buildTerrenoCard(lote);
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF1A5729),
        onPressed: () => _showTerrenoForm(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildTerrenoCard(dynamic lote) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF1A5729).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.landscape, color: Color(0xFF1A5729)),
        ),
        title: Text(
          lote['nombre_sector'] ?? 'Sector sin nombre',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("${lote['tamano_hectareas']} Hectáreas"),
            Text("Estado: ${lote['estado']}", style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(value: 'edit', child: Text("Editar")),
            const PopupMenuItem(value: 'delete', child: Text("Eliminar", style: TextStyle(color: Colors.red))),
          ],
          onSelected: (val) {
            if (val == 'edit') _showTerrenoForm(lote: lote);
            if (val == 'delete') _deleteTerreno(lote['nro_lote']);
          },
        ),
      ),
    );
  }

  // MODAL PARA AGREGAR / EDITAR
  void _showTerrenoForm({dynamic lote}) {
    final bool isEditing = lote != null;
    final TextEditingController sectorCtrl = TextEditingController(text: isEditing ? lote['nombre_sector'] : '');
    final TextEditingController tamanoCtrl = TextEditingController(text: isEditing ? lote['tamano_hectareas'].toString() : '');
    final TextEditingController latCtrl = TextEditingController(text: isEditing ? lote['latitud'].toString() : '');
    final TextEditingController lonCtrl = TextEditingController(text: isEditing ? lote['longitud'].toString() : '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20, right: 20, top: 20
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                isEditing ? "Editar Terreno" : "Nuevo Terreno",
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              TextField(controller: sectorCtrl, decoration: const InputDecoration(labelText: "Nombre del Sector")),
              TextField(controller: tamanoCtrl, decoration: const InputDecoration(labelText: "Hectáreas"), keyboardType: TextInputType.number),
              TextField(controller: latCtrl, decoration: const InputDecoration(labelText: "Latitud"), keyboardType: TextInputType.number),
              TextField(controller: lonCtrl, decoration: const InputDecoration(labelText: "Longitud"), keyboardType: TextInputType.number),
              const SizedBox(height: 30),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A5729), foregroundColor: Colors.white),
                onPressed: () async {
                  final token = Provider.of<AuthProvider>(context, listen: false).token;
                  final endpoint = isEditing ? '/update-terreno' : '/add-terreno';
                  
                  final payload = {
                    'nombre_sector': sectorCtrl.text,
                    'tamano_hectareas': double.tryParse(tamanoCtrl.text),
                    'latitud': double.tryParse(latCtrl.text),
                    'longitud': double.tryParse(lonCtrl.text),
                  };

                  if (isEditing) {
                    payload['nro_lote'] = lote['nro_lote'];
                    payload['estado'] = lote['estado'];
                  }

                  final res = await http.post(
                    Uri.parse('$_apiUrl$endpoint'),
                    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
                    body: jsonEncode(payload),
                  );

                  if (jsonDecode(res.body)['success']) {
                    Navigator.pop(context);
                    _fetchTerrenos();
                  }
                },
                child: Text(isEditing ? "Guardar Cambios" : "Registrar"),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}