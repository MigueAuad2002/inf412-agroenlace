from flask import Blueprint, request, jsonify
from ..services import pedidos_service


from .empresas_routes import admin_required

pedidos_routes = Blueprint('pedidos_routes', __name__)

@pedidos_routes.route('/api/insumos/catalogo', methods=['GET'])
@admin_required # <- Protegemos el endpoint para que lea el token del JSX
def get_catalogo():
    id_empresa = request.args.get('id_empresa')
    res, status = pedidos_service.obtener_catalogo(id_empresa)
    return jsonify(res), status

@pedidos_routes.route('/api/pedidos/crear', methods=['POST'])
@admin_required # <- Protegemos la creación del pedido
def crear_pedido():
    res, status = pedidos_service.registrar_pedido(request.get_json())
    return jsonify(res), status

@pedidos_routes.route('/api/pedidos/historial', methods=['GET'])
def get_historial():
    id_usuario = request.args.get('id_usuario')
    res, status = pedidos_service.obtener_historial(id_usuario)
    return jsonify(res), status

@pedidos_routes.route('/api/pedidos/detalle', methods=['GET'])
def get_detalle():
    nro_transaccion = request.args.get('nro_transaccion')
    res, status = pedidos_service.obtener_detalle(nro_transaccion)
    return jsonify(res), status