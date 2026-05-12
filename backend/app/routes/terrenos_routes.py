from flask import Blueprint, request, jsonify
from ..services import decode_access_token, terrenos_service

terrenos_routes = Blueprint('terrenos_routes', __name__)

# Decorador de seguridad (puedes moverlo a un archivo de utilidades si quieres)
def admin_required(func):
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'No autenticado'}), 401
        val = decode_access_token(auth.split(" ")[1])
        if not val['success'] or val['payload'].get('role') != 1:
            return jsonify({'success': False, 'message': 'Admin requerido'}), 403
        request.user_payload = val['payload'] # Guardamos el payload para usar el ID
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@terrenos_routes.route('/api/get-terrenos', methods=['GET'])
@admin_required
def get_terrenos():
    res, status = terrenos_service.get_terrenos_list()
    return jsonify(res), status

@terrenos_routes.route('/api/add-terreno', methods=['POST'])
@admin_required
def add_terreno():
    user_id = request.user_payload.get('user_id')
    res, status = terrenos_service.add_new_terreno(request.get_json(), user_id)
    return jsonify(res), status

@terrenos_routes.route('/api/update-terreno', methods=['POST'])
@admin_required
def update_terreno():
    res, status = terrenos_service.update_existing_terreno(request.get_json())
    return jsonify(res), status

@terrenos_routes.route('/api/delete-terreno', methods=['POST'])
@admin_required
def delete_terreno():
    nro_lote = request.get_json().get('nro_lote')
    res, status = terrenos_service.delete_existing_terreno(nro_lote)
    return jsonify(res), status