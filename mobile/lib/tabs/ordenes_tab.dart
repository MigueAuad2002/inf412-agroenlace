import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../providers/auth_provider.dart';

class OrdenesTab extends StatefulWidget {
  const OrdenesTab({super.key});

  @override
  State<OrdenesTab> createState() => _OrdenesTabState();
}

class _OrdenesTabState extends State<OrdenesTab> {
  List<dynamic> _ordenes = [];
  bool _isLoading = true;
  final String _apiUrl = dotenv.env['API_URL'] ?? 'http://192.168.1.15:5000/api';

  @override
  void initState() {
    super.initState();
    _fetchOrdenes();
  }

  Future<void> _fetchOrdenes() async {
    setState(() => _isLoading = true);
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    try {
      final response = await http.get(
        Uri.parse('$_apiUrl/get-ordenes'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      final data = jsonDecode(response.body);
      if (data['success']) {
        setState(() {
          _ordenes = data['list_ordenes'];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  // FUNCIÓN DE ALERTA (Ahora al nivel de la clase)
  void _mostrarAlerta(String titulo, String mensaje, {bool esExito = false}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(titulo, style: TextStyle(fontWeight: FontWeight.bold, color: esExito ? const Color(0xFF1A5729) : Colors.red)),
        content: Text(mensaje),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("ENTENDIDO", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Mis Tareas Asignadas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1A5729),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A5729)))
          : RefreshIndicator(
              onRefresh: _fetchOrdenes,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _ordenes.length,
                itemBuilder: (context, index) => _buildOrdenCard(_ordenes[index]),
              ),
            ),
    );
  }

  Widget _buildOrdenCard(dynamic orden) {
    final estado = orden['estado']?.toString().toUpperCase() ?? 'PENDIENTE';
    Color estadoColor = (estado == 'FINALIZADA') ? Colors.green : (estado == 'EN PROCESO') ? Colors.blue : Colors.orange;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: estadoColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(estado, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: estadoColor)),
                ),
                Text("ORD-${orden['nro_orden']}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 12),
            Text(orden['tipo_trabajo'] ?? 'Actividad', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: () => _showUpdateModal(orden),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A5729), foregroundColor: Colors.white),
                icon: const Icon(Icons.edit_document, size: 16),
                label: const Text("Actualizar Reporte"),
              ),
            )
          ],
        ),
      ),
    );
  }

  void _showUpdateModal(dynamic orden) {
    String estadoDB = orden['estado']?.toString().toUpperCase() ?? 'PENDIENTE';
    List<String> estadosSoportados = ["PENDIENTE", "EN PROCESO", "FINALIZADA"];
    String selectedEstado = estadosSoportados.contains(estadoDB) ? estadoDB : "FINALIZADA";
    
    final TextEditingController reporteCtrl = TextEditingController();
    String? imageBase64;
    bool _isListening = false;
    final stt.SpeechToText _speech = stt.SpeechToText();
    final ImagePicker _picker = ImagePicker();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(25))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          
          Future<void> _takePicture() async {
            try {
              final XFile? photo = await _picker.pickImage(
                source: ImageSource.camera,
                imageQuality: 20,
                maxWidth: 700,
                maxHeight: 700,
              );
              if (photo != null) {
                final bytes = await photo.readAsBytes();
                setModalState(() => imageBase64 = base64Encode(bytes));
              }
            } catch (e) {
              _mostrarAlerta("Error de Cámara", "No se pudo acceder a la cámara.");
            }
          }

          void _listen() async {
            if (!_isListening) {
              bool available = await _speech.initialize();
              if (available) {
                setModalState(() => _isListening = true);
                _speech.listen(onResult: (val) => setModalState(() => reporteCtrl.text = val.recognizedWords));
              }
            } else {
              setModalState(() => _isListening = false);
              _speech.stop();
            }
          }

          Future<void> _submitUpdate() async {
            showDialog(context: context, barrierDismissible: false, builder: (context) => const Center(child: CircularProgressIndicator()));
            
            final token = Provider.of<AuthProvider>(context, listen: false).token;
            try {
              final res = await http.post(
                Uri.parse('$_apiUrl/update-mi-orden'),
                headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
                body: jsonEncode({
                  "nro_orden": orden['nro_orden'],
                  "estado": selectedEstado,
                  "reporte_texto": reporteCtrl.text.isEmpty ? null : reporteCtrl.text,
                  "url_imagen": imageBase64,
                  "url_audio": null 
                }),
              );
              Navigator.pop(context); // Cerrar loading

              if (res.headers['content-type']?.contains('text/html') ?? false) {
                 _mostrarAlerta("Error de Servidor", "Imagen muy pesada para Render.");
                 return;
              }

              final data = jsonDecode(res.body);
              if (data['success']) {
                Navigator.pop(context); // Cerrar modal
                _fetchOrdenes();
                _mostrarAlerta("Éxito", "Reporte guardado.", esExito: true);
              } else {
                _mostrarAlerta("Atención", data['message']);
              }
            } catch (e) {
              Navigator.pop(context);
              _mostrarAlerta("Error", "No hay conexión con el servidor.");
            }
          }

          return Container(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 20, left: 20, right: 20, top: 25),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text("Reportar Tarea ORD-${orden['nro_orden']}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  value: selectedEstado,
                  items: estadosSoportados.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (val) => setModalState(() => selectedEstado = val!),
                  decoration: const InputDecoration(labelText: "Estado"),
                ),
                const SizedBox(height: 15),
                TextField(controller: reporteCtrl, maxLines: 3, decoration: const InputDecoration(hintText: "Reporte...")),
                const SizedBox(height: 15),
                Row(
                  children: [
                    Expanded(child: OutlinedButton.icon(onPressed: _listen, icon: Icon(_isListening ? Icons.mic : Icons.mic_none), label: Text(_isListening ? "Parar" : "Dictar"))),
                    const SizedBox(width: 10),
                    Expanded(child: OutlinedButton.icon(onPressed: _takePicture, icon: Icon(imageBase64 != null ? Icons.check : Icons.camera_alt), label: Text("Foto"))),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _submitUpdate, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A5729), foregroundColor: Colors.white), child: const Text("GUARDAR REPORTE"))),
              ],
            ),
          );
        },
      ),
    );
  }
}