from flask import Blueprint, request, jsonify
from ..services import maquinaria_service

maquinaria_routes = Blueprint('maquinaria_routes', __name__)

@maquinaria_routes.route('/api/maquinaria', methods=['GET'])
def get_maquinaria():
    auth_header = request.headers.get('Authorization')
    response, status = maquinaria_service.fetch_maquinaria(auth_header)
    return jsonify(response), status

@maquinaria_routes.route('/api/maquinaria', methods=['POST'])
def add_maquinaria():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    response, status = maquinaria_service.register_maquinaria(auth_header, data)
    return jsonify(response), status

@maquinaria_routes.route('/api/maquinaria/<int:nro_maquina>', methods=['PUT'])
def update_maquinaria(nro_maquina):
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    response, status = maquinaria_service.modify_maquinaria(auth_header, nro_maquina, data)
    return jsonify(response), status

@maquinaria_routes.route('/api/maquinaria/<int:nro_maquina>', methods=['DELETE'])
def delete_maquinaria(nro_maquina):
    auth_header = request.headers.get('Authorization')
    response, status = maquinaria_service.remove_maquinaria(auth_header, nro_maquina)
    return jsonify(response), status