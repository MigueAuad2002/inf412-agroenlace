import 'package:flutter/material.dart';

import '../services/pedido_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_widgets.dart';

class ProductosScreen extends StatefulWidget {
  const ProductosScreen({super.key});

  @override
  State<ProductosScreen> createState() => _ProductosScreenState();
}

class _ProductosScreenState extends State<ProductosScreen> {
  bool loading = true;
  bool saving = false;

  String message = '';
  bool messageSuccess = false;
  String selectedCategory = 'TODOS';

  final searchController = TextEditingController();

  List<Insumo> productos = [];
  final Map<int, CarritoItem> carrito = {};

  double get total {
    return carrito.values.fold(0.0, (sum, item) => sum + item.subtotal);
  }

  int get cantidadItems {
    return carrito.values.fold(0, (sum, item) => sum + item.cantidad.toInt());
  }

  List<Insumo> get productosFiltrados {
    final search = searchController.text.trim().toUpperCase();

    return productos.where((producto) {
      final matchesCategory = selectedCategory == 'TODOS' ||
          producto.categoria.toUpperCase() == selectedCategory;

      final matchesSearch = search.isEmpty ||
          producto.nombreProducto.toUpperCase().contains(search) ||
          producto.categoria.toUpperCase().contains(search);

      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    cargarCatalogo();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> cargarCatalogo() async {
    setState(() {
      loading = true;
      message = '';
    });

    final result = await PedidoService.obtenerCatalogo();

    if (!mounted) return;

    setState(() {
      loading = false;
      productos = result.catalogo;
      message = result.success ? '' : result.message;
      messageSuccess = false;
    });
  }

  void agregarProducto(Insumo producto) {
    setState(() {
      final item = carrito[producto.idProducto];

      if (item == null) {
        carrito[producto.idProducto] = CarritoItem(
          insumo: producto,
          cantidad: 1,
        );
        return;
      }

      if (item.cantidad < producto.stockActual) {
        item.cantidad += 1;
      }
    });
  }

  void quitarProducto(Insumo producto) {
    setState(() {
      final item = carrito[producto.idProducto];

      if (item == null) return;

      if (item.cantidad <= 1) {
        carrito.remove(producto.idProducto);
      } else {
        item.cantidad -= 1;
      }
    });
  }

  Future<void> confirmarPedido() async {
    if (carrito.isEmpty) {
      setState(() {
        message = 'Agrega productos al carrito';
        messageSuccess = false;
      });
      return;
    }

    setState(() {
      saving = true;
      message = '';
    });

    final result = await PedidoService.crearPedido(carrito.values.toList());

    if (!mounted) return;

    setState(() {
      saving = false;
      message = result.success
          ? 'Pedido registrado. Nro: ${result.nroTransaccion}. Total: Bs ${result.montoTotal.toStringAsFixed(2)}'
          : result.message;
      messageSuccess = result.success;

      if (result.success) {
        carrito.clear();
      }
    });

    if (result.success) {
      Navigator.pop(context);
      await cargarCatalogo();
    }
  }

  void abrirCarrito() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.backgroundBlue,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            void updateModal(VoidCallback action) {
              setState(action);
              setModalState(() {});
            }

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
                    _buildCartHeader(),
                    const SizedBox(height: 12),
                    Flexible(
                      child: ListView(
                        shrinkWrap: true,
                        children: carrito.values.map((item) {
                          return _buildCartItem(
                            item,
                            onRemove: () {
                              updateModal(() {
                                quitarProducto(item.insumo);
                              });
                            },
                            onAdd: () {
                              updateModal(() {
                                agregarProducto(item.insumo);
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildCartTotal(),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = productosFiltrados;

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
                  : Stack(
                      children: [
                        RefreshIndicator(
                          onRefresh: cargarCatalogo,
                          color: AppTheme.primaryGreen,
                          child: ListView(
                            padding: EdgeInsets.fromLTRB(
                              18,
                              12,
                              18,
                              carrito.isEmpty ? 18 : 100,
                            ),
                            children: [
                              _buildCatalogHeader(),
                              const SizedBox(height: 12),
                              _buildSearchBox(),
                              const SizedBox(height: 12),
                              _buildCategoryFilters(),
                              if (message.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                AgroErrorBox(
                                  message: message,
                                  success: messageSuccess,
                                ),
                              ],
                              const SizedBox(height: 16),
                              if (filtered.isEmpty)
                                _buildEmptyState()
                              else
                                ...filtered.map(_buildProductCard),
                            ],
                          ),
                        ),
                        if (carrito.isNotEmpty) _buildFloatingCartBar(),
                      ],
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
                  'PRODUCTOS AGRÍCOLAS',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Semillas y fertilizantes',
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
            onPressed: cargarCatalogo,
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

  Widget _buildCatalogHeader() {
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
              Icons.shopping_bag,
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
                  'CATÁLOGO DISPONIBLE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.mutedText,
                    letterSpacing: 1.3,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Elige productos y genera tu pedido.',
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

  Widget _buildSearchBox() {
    return TextField(
      controller: searchController,
      onChanged: (_) {
        setState(() {});
      },
      decoration: InputDecoration(
        hintText: 'Buscar producto',
        prefixIcon: const Icon(Icons.search),
        suffixIcon: searchController.text.isEmpty
            ? null
            : IconButton(
                onPressed: () {
                  setState(() {
                    searchController.clear();
                  });
                },
                icon: const Icon(Icons.close),
              ),
      ),
    );
  }

  Widget _buildCategoryFilters() {
    return Row(
      children: [
        _buildFilterChip('TODOS'),
        const SizedBox(width: 8),
        _buildFilterChip('SEMILLA'),
        const SizedBox(width: 8),
        _buildFilterChip('FERTILIZANTE'),
      ],
    );
  }

  Widget _buildFilterChip(String value) {
    final selected = selectedCategory == value;

    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            selectedCategory = value;
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

  Widget _buildProductCard(Insumo producto) {
    final item = carrito[producto.idProducto];
    final cantidad = item?.cantidad ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _buildProductIcon(producto.categoria),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      producto.nombreProducto.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.slateText,
                      ),
                    ),
                    const SizedBox(height: 5),
                    _buildCategoryBadge(producto.categoria),
                  ],
                ),
              ),
              Text(
                'Bs ${producto.precioUnitario.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.primaryGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _buildMiniInfo(
                  'UNIDAD',
                  producto.unidadMedida,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMiniInfo(
                  'STOCK',
                  producto.stockActual.toStringAsFixed(0),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (cantidad == 0)
            SizedBox(
              width: double.infinity,
              height: 42,
              child: ElevatedButton.icon(
                onPressed: () => agregarProducto(producto),
                icon: const Icon(Icons.add_shopping_cart, size: 18),
                label: const Text(
                  'AGREGAR AL CARRITO',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            )
          else
            _buildQuantitySelector(producto, cantidad),
        ],
      ),
    );
  }

  Widget _buildProductIcon(String category) {
    final isSeed = category.toUpperCase() == 'SEMILLA';

    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen.withOpacity(0.10),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Icon(
        isSeed ? Icons.grass : Icons.science,
        color: AppTheme.primaryGreen,
        size: 27,
      ),
    );
  }

  Widget _buildCategoryBadge(String category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen.withOpacity(0.08),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        category.toUpperCase(),
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: AppTheme.primaryGreen,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildMiniInfo(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: AppTheme.mutedText,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: AppTheme.slateText,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantitySelector(Insumo producto, double cantidad) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          _buildQtyButton(
            icon: Icons.remove,
            onTap: () => quitarProducto(producto),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  cantidad.toStringAsFixed(0),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.slateText,
                  ),
                ),
                const Text(
                  'EN CARRITO',
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.mutedText,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          _buildQtyButton(
            icon: Icons.add,
            onTap: () => agregarProducto(producto),
          ),
        ],
      ),
    );
  }

  Widget _buildQtyButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 42,
        height: 38,
        decoration: BoxDecoration(
          color: AppTheme.primaryGreen,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: 18,
        ),
      ),
    );
  }

  Widget _buildFloatingCartBar() {
    return Positioned(
      left: 18,
      right: 18,
      bottom: 18,
      child: InkWell(
        onTap: abrirCarrito,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: AppTheme.primaryGreen,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryGreen.withOpacity(0.28),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.16),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.shopping_cart,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$cantidadItems productos\nBs ${total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1.3,
                  ),
                ),
              ),
              const Text(
                'VER',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(width: 6),
              const Icon(
                Icons.arrow_forward_ios,
                color: Colors.white,
                size: 14,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCartHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        children: [
          Icon(
            Icons.shopping_cart,
            color: Colors.white,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'CARRITO DE COMPRA',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(
    CarritoItem item, {
    required VoidCallback onRemove,
    required VoidCallback onAdd,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              item.insumo.nombreProducto.toUpperCase(),
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w900,
                color: AppTheme.slateText,
              ),
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(Icons.remove_circle_outline),
            color: AppTheme.primaryGreen,
          ),
          Text(
            item.cantidad.toStringAsFixed(0),
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              color: AppTheme.slateText,
            ),
          ),
          IconButton(
            onPressed: onAdd,
            icon: const Icon(Icons.add_circle_outline),
            color: AppTheme.primaryGreen,
          ),
          Text(
            'Bs ${item.subtotal.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: AppTheme.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartTotal() {
    return Column(
      children: [
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
        const SizedBox(height: 12),
        AgroButton(
          text: 'Confirmar pedido',
          loading: saving,
          onPressed: confirmarPedido,
        ),
      ],
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
            Icons.inventory_2_outlined,
            size: 46,
            color: AppTheme.mutedText,
          ),
          SizedBox(height: 12),
          Text(
            'No hay productos disponibles',
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