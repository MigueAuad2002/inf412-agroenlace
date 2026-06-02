from flask import Blueprint, request, jsonify
from ..services import mant_maquinaria_service

mant_maquinaria_routes = Blueprint('mant_maquinaria_routes', __name__)

@mant_maquinaria_routes.route('/api/mantenimiento', methods=['GET'])
def get_all_historial():
    auth_header = request.headers.get('Authorization')
    response, status = mant_maquinaria_service.fetch_all_historial(auth_header)
    return jsonify(response), status

@mant_maquinaria_routes.route('/api/maquinaria/<int:nro_maquina>/mantenimiento', methods=['GET'])
def get_historial_by_maquina(nro_maquina):
    auth_header = request.headers.get('Authorization')
    response, status = mant_maquinaria_service.fetch_historial_by_maquina(auth_header, nro_maquina)
    return jsonify(response), status

@mant_maquinaria_routes.route('/api/mantenimiento', methods=['POST'])
def add_mantenimiento():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    response, status = mant_maquinaria_service.register_mantenimiento(auth_header, data)
    return jsonify(response), status

@mant_maquinaria_routes.route('/api/mantenimiento/<int:nro_orden>', methods=['PUT'])
def update_mantenimiento(nro_orden):
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    response, status = mant_maquinaria_service.modify_mantenimiento(auth_header, nro_orden, data)
    return jsonify(response), status

@mant_maquinaria_routes.route('/api/mantenimiento/<int:nro_orden>', methods=['DELETE'])
def delete_mantenimiento(nro_orden):
    auth_header = request.headers.get('Authorization')
    response, status = mant_maquinaria_service.remove_mantenimiento(auth_header, nro_orden)
    return jsonify(response), status
