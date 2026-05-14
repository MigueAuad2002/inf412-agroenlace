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
  String _searchTerm = '';
  final String _apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.1.15:5000/api';

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
    final filteredTerrenos = _terrenos.where((lote) {
      final term = _searchTerm.toLowerCase();
      final nro = lote['nro_lote']?.toString().toLowerCase() ?? '';
      final nombre = lote['nombre_sector']?.toString().toLowerCase() ?? '';
      final propietario = lote['propietario']?.toString().toLowerCase() ?? '';
      return nombre.contains(term) || propietario.contains(term) || nro.contains(term);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Gestión de Terrenos'),
        backgroundColor: const Color(0xFF1A5729),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A5729)))
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    onChanged: (value) => setState(() => _searchTerm = value),
                    decoration: const InputDecoration(
                      hintText: 'Buscar por lote, sector o propietario...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                Expanded(
                  child: filteredTerrenos.isEmpty
                      ? const Center(child: Text("No tienes terrenos registrados"))
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            columns: const [
                              DataColumn(label: Text('Lote')),
                              DataColumn(label: Text('Sector')),
                              DataColumn(label: Text('Superficie')),
                              DataColumn(label: Text('Coordenadas')),
                              DataColumn(label: Text('Estado')),
                              DataColumn(label: Text('Propietario')),
                              DataColumn(label: Text('Acciones')),
                            ],
                            rows: filteredTerrenos.map((lote) {
                              final estado = lote['estado'] ?? 'EN_DESCANSO';
                              return DataRow(cells: [
                                DataCell(Text('#${lote['nro_lote']}')),
                                DataCell(Text(lote['nombre_sector'] ?? '')),
                                DataCell(Text('${lote['tamano_hectareas']} Ha')),
                                DataCell(Text('${lote['latitud']}, ${lote['longitud']}')),
                                DataCell(
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: estado == 'ACTIVO' ? Colors.green.shade100 : Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(estado, style: const TextStyle(fontSize: 10)),
                                  ),
                                ),
                                DataCell(Text('@${lote['propietario'] ?? 'sin propietario'}')),
                                DataCell(
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.edit),
                                        onPressed: () => _showTerrenoForm(lote: lote),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete),
                                        onPressed: () => _deleteTerreno(lote['nro_lote']),
                                      ),
                                    ],
                                  ),
                                ),
                              ]);
                            }).toList(),
                          ),
                        ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF1A5729),
        onPressed: () => _showTerrenoForm(),
        child: const Icon(Icons.add, color: Colors.white),
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

                  try {
                    final res = await http.post(
                      Uri.parse('$_apiUrl$endpoint'),
                      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
                      body: jsonEncode(payload),
                    );

                    final data = jsonDecode(res.body);
                    if (data['success']) {
                      Navigator.pop(context);
                      _fetchTerrenos();
                    }
                  } catch (e) {
                    debugPrint("Error al guardar: $e");
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
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