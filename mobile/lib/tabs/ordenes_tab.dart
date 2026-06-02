import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';

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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1A5729)))
          : RefreshIndicator(
              onRefresh: _fetchOrdenes,
              child: _ordenes.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.assignment_outlined, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text("No hay órdenes asignadas", style: TextStyle(fontSize: 16, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _ordenes.length,
                      itemBuilder: (context, index) => _buildOrdenCard(_ordenes[index]),
                    ),
            ),
    );
  }

  Widget _buildOrdenCard(dynamic orden) {
    final estado = orden['estado']?.toString().toUpperCase() ?? 'PENDIENTE';
    Color estadoColor;
    IconData estadoIcon;

    if (estado == 'FINALIZADA') {
      estadoColor = Colors.green;
      estadoIcon = Icons.check_circle;
    } else if (estado == 'EN PROCESO') {
      estadoColor = Colors.blue;
      estadoIcon = Icons.pending_actions;
    } else {
      estadoColor = Colors.orange;
      estadoIcon = Icons.schedule;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: InkWell(
        onTap: () => _showUpdateModal(orden),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(estadoIcon, color: estadoColor, size: 20),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: estadoColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                        child: Text(estado, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: estadoColor)),
                      ),
                    ],
                  ),
                  Text("ORD-${orden['nro_orden']}", style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 12),
              Text(orden['tipo_trabajo'] ?? 'Actividad', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
              const SizedBox(height: 8),
              if (orden['descripcion'] != null)
                Text(
                  orden['descripcion'],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton.icon(
                  onPressed: () => _showUpdateModal(orden),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A5729),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  icon: const Icon(Icons.edit_note_rounded, size: 18),
                  label: const Text("Reportar", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              )
            ],
          ),
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
    String? audioPath;
    bool _isRecording = false;
    final _record = AudioRecorder();
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
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("✓ Foto capturada"), duration: Duration(seconds: 2)),
                );
              }
            } catch (e) {
              _mostrarAlerta("Error de Cámara", "No se pudo acceder a la cámara.");
            }
          }

          Future<void> _toggleRecording() async {
            try {
              if (!_isRecording) {
                // Iniciar grabación
                if (await _record.hasPermission()) {
                  final dir = await getApplicationDocumentsDirectory();
                  final path = '${dir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';
                  
                  await _record.start(
                    RecordConfig(encoder: AudioEncoder.aacLc),
                    path: path,
                  );
                  
                  setModalState(() => _isRecording = true);
                }
              } else {
                // Detener grabación
                final path = await _record.stop();
                setModalState(() {
                  _isRecording = false;
                  audioPath = path;
                });
                
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("✓ Audio grabado"), duration: Duration(seconds: 2)),
                );
              }
            } catch (e) {
              _mostrarAlerta("Error de Audio", "No se pudo grabar el audio.");
            }
          }

          Future<void> _submitUpdate() async {
            showDialog(context: context, barrierDismissible: false, builder: (context) => const Center(child: CircularProgressIndicator()));
            
            final token = Provider.of<AuthProvider>(context, listen: false).token;
            try {
              final Map<String, dynamic> body = {
                "nro_orden": orden['nro_orden'],
                "estado": selectedEstado,
              };

              if (reporteCtrl.text.isNotEmpty) body["reporte_texto"] = reporteCtrl.text;
              if (imageBase64 != null) body["url_imagen"] = imageBase64;
              if (audioPath != null) {
                final audioFile = File(audioPath!);
                final audioBytes = await audioFile.readAsBytes();
                body["url_audio"] = base64Encode(audioBytes);
              }

              final res = await http.post(
                Uri.parse('$_apiUrl/update-mi-orden'),
                headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
                body: jsonEncode(body),
              );
              Navigator.pop(context);

              if (res.headers['content-type']?.contains('text/html') ?? false) {
                _mostrarAlerta("Error de Servidor", "Datos muy pesados. Intenta con archivos más pequeños.");
                return;
              }

              final data = jsonDecode(res.body);
              if (data['success']) {
                Navigator.pop(context);
                _fetchOrdenes();
                _mostrarAlerta("Éxito", "Reporte guardado correctamente.", esExito: true);
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
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFF1A5729).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.edit_document, color: Color(0xFF1A5729), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Reportar Tarea", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            Text("ORD-${orden['nro_orden']}", style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                          ],
                        ),
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context))
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ESTADO
                  const Text("Estado de la Tarea", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1A5729))),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: selectedEstado,
                    items: estadosSoportados.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                    onChanged: (val) => setModalState(() => selectedEstado = val!),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // TEXTO
                  const Text("Reporte de Texto (Opcional)", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1A5729))),
                  const SizedBox(height: 8),
                  TextField(
                    controller: reporteCtrl,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: "Describe lo que realizaste...",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // MEDIOS
                  const Text("Capturar Evidencia", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1A5729))),
                  const SizedBox(height: 12),

                  // Botones de Captura
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _takePicture,
                          icon: Icon(imageBase64 != null ? Icons.check_circle : Icons.camera_alt, color: imageBase64 != null ? Colors.green : Colors.grey),
                          label: Text(imageBase64 != null ? "Foto ✓" : "Capturar Foto", style: const TextStyle(fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _toggleRecording,
                          icon: Icon(
                            _isRecording ? Icons.stop_circle : (audioPath != null ? Icons.check_circle : Icons.mic),
                            color: _isRecording ? Colors.red : (audioPath != null ? Colors.green : Colors.grey),
                          ),
                          label: Text(
                            _isRecording ? "Grabando..." : (audioPath != null ? "Audio ✓" : "Grabar Audio"),
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Botón Submit
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _submitUpdate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A5729),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.save_alt_rounded),
                      label: const Text("GUARDAR REPORTE", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}