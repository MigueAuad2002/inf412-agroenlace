import 'package:flutter/material.dart';

import '../services/pedido_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_widgets.dart';

class PedidosScreen extends StatefulWidget {
  const PedidosScreen({super.key});

  @override
  State<PedidosScreen> createState() => _PedidosScreenState();
}

class _PedidosScreenState extends State<PedidosScreen> {
  bool loading = true;
  String message = '';
  String selectedFilter = 'TODOS';

  List<PedidoResumen> pedidos = [];

  List<PedidoResumen> get pedidosFiltrados {
    if (selectedFilter == 'TODOS') return pedidos;

    return pedidos.where((pedido) {
      return pedido.estadoTransaccion.toUpperCase() == selectedFilter;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    cargarHistorial();
  }

  Future<void> cargarHistorial() async {
    setState(() {
      loading = true;
      message = '';
    });

    final result = await PedidoService.obtenerHistorial();

    if (!mounted) return;

    setState(() {
      loading = false;
      pedidos = result.historial;
      message = result.success ? '' : result.message;
    });
  }

  Future<void> verDetalle(PedidoResumen pedido) async {
    final result = await PedidoService.obtenerDetalle(pedido.nroTransaccion);

    if (!mounted) return;

    if (!result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message)),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.backgroundBlue,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) {
        return _buildDetalleSheet(pedido, result.detalles);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = pedidosFiltrados;

    return Scaffold(
      backgroundColor: AppTheme.backgroundBlue,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(),
            Expanded(
              child: loading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.primaryGreen,
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: cargarHistorial,
                      color: AppTheme.primaryGreen,
                      child: ListView(
                        padding: const EdgeInsets.all(18),
                        children: [
                          _buildHeader(),
                          const SizedBox(height: 12),
                          _buildStatsRow(),
                          const SizedBox(height: 12),
                          _buildFilters(),
                          if (message.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            AgroErrorBox(message: message),
                          ],
                          const SizedBox(height: 16),
                          if (filtered.isEmpty)
                            _buildEmptyState()
                          else
                            ...filtered.map(_buildPedidoCard),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
      decoration: const BoxDecoration(
        color: AppTheme.primaryGreen,
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.14),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.arrow_back),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MIS PEDIDOS',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Historial de compras',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: cargarHistorial,
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.14),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.10),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.receipt_long,
              color: AppTheme.primaryGreen,
              size: 28,
            ),
          ),
          const SizedBox(width: 13),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'HISTORIAL DE PEDIDOS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.mutedText,
                    letterSpacing: 1.3,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Consulta tus pedidos registrados y sus detalles.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.slateText,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final totalPedidos = pedidos.length;
    final totalMonto = pedidos.fold(0.0, (sum, pedido) => sum + pedido.montoTotal);

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            label: 'PEDIDOS',
            value: totalPedidos.toString(),
            icon: Icons.shopping_bag,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard(
            label: 'TOTAL',
            value: 'Bs ${totalMonto.toStringAsFixed(2)}',
            icon: Icons.payments,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: AppTheme.primaryGreen,
            size: 22,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.mutedText,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.slateText,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Row(
      children: [
        _buildFilterChip('TODOS'),
        const SizedBox(width: 8),
        _buildFilterChip('PENDIENTE'),
        const SizedBox(width: 8),
        _buildFilterChip('COMPLETADO'),
      ],
    );
  }

  Widget _buildFilterChip(String value) {
    final selected = selectedFilter == value;

    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            selectedFilter = value;
          });
        },
        borderRadius: BorderRadius.circular(30),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primaryGreen : Colors.white,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: selected ? AppTheme.primaryGreen : AppTheme.borderColor,
            ),
          ),
          child: Text(
            value,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: selected ? Colors.white : AppTheme.mutedText,
              letterSpacing: 0.8,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPedidoCard(PedidoResumen pedido) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: () => verDetalle(pedido),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Icon(
                    Icons.receipt,
                    color: AppTheme.primaryGreen,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PEDIDO NRO. ${pedido.nroTransaccion}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.slateText,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        pedido.fechaHora,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.mutedText,
                        ),
                      ),
                      const SizedBox(height: 9),
                      Row(
                        children: [
                          _buildEstadoBadge(pedido.estadoTransaccion),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Bs ${pedido.montoTotal.toStringAsFixed(2)}',
                              textAlign: TextAlign.right,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 15,
                  color: AppTheme.mutedText,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetalleSheet(
    PedidoResumen pedido,
    List<PedidoDetalle> detalles,
  ) {
    final total = detalles.fold(0.0, (sum, item) => sum + item.subtotal);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 46,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PEDIDO NRO. ${pedido.nroTransaccion}',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    pedido.fechaHora,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Colors.white70,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: detalles.map(_buildDetalleItem).toList(),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'TOTAL',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.mutedText,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  Text(
                    'Bs ${total.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.slateText,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetalleItem(PedidoDetalle item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.inventory_2,
              color: AppTheme.primaryGreen,
              size: 22,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.nombreProducto.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.slateText,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${item.cantidad.toStringAsFixed(0)} x Bs ${item.precioVenta.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.mutedText,
                  ),
                ),
              ],
            ),
          ),
          Text(
            'Bs ${item.subtotal.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: AppTheme.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadoBadge(String estado) {
    final value = estado.toUpperCase();

    Color bg = Colors.orange.shade50;
    Color border = Colors.orange.shade200;
    Color text = Colors.orange.shade800;

    if (value == 'COMPLETADO' || value == 'APROBADO') {
      bg = Colors.green.shade50;
      border = Colors.green.shade200;
      text = Colors.green.shade800;
    }

    if (value == 'RECHAZADO' || value == 'CANCELADO') {
      bg = Colors.red.shade50;
      border = Colors.red.shade200;
      text = Colors.red.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Text(
        value,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: text,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 46,
            color: AppTheme.mutedText,
          ),
          SizedBox(height: 12),
          Text(
            'No hay pedidos para mostrar',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: AppTheme.slateText,
            ),
          ),
        ],
      ),
    );
  }
}