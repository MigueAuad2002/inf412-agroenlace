from flask import Blueprint, request, jsonify
from ..services import decode_access_token, ordenes_service

ordenes_routes = Blueprint('ordenes_routes', __name__)

def token_required(func):
    """Valida token y extrae el payload. Bloquea solo al Rol 4 (Cliente)."""
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'No autenticado'}), 401
        
        val = decode_access_token(auth.split(" ")[1])
        if not val['success']:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
            
        payload = val.get('payload', {})
        if payload.get('role') == 4:
            return jsonify({'success': False, 'message': 'Acceso denegado. Rol no autorizado.'}), 403
            
        request.user_payload = payload
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

def boss_only(func):
    """Decorador adicional: Solo permite el paso a Admin (1) y Supervisor (2)."""
    def wrapper(*args, **kwargs):
        role = request.user_payload.get('role')
        if role not in [1, 2]:
            return jsonify({
                'success': False, 
                'message': 'Acceso denegado. Solo Administradores o Supervisores pueden realizar esta acción.'
            }), 403
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@ordenes_routes.route('/api/get-ordenes', methods=['GET'])
@token_required
def get_ordenes():
    # Admin, Sup y Emp pueden entrar aquí. El servicio filtra según el rol.
    user_id = request.user_payload.get('user_id')
    role_id = request.user_payload.get('role')
    res, status = ordenes_service.get_ordenes_logic(user_id, role_id)
    return jsonify(res), status

@ordenes_routes.route('/api/add-orden', methods=['POST'])
@token_required
@boss_only
def add_orden():
    sup_id = request.user_payload.get('user_id')
    res, status = ordenes_service.create_work_order(request.get_json(), sup_id)
    return jsonify(res), status

@ordenes_routes.route('/api/assign-responsible', methods=['POST'])
@token_required
@boss_only
def assign_responsible():
    sup_id = request.user_payload.get('user_id')
    res, status = ordenes_service.assign_responsible_to_order(request.get_json(), sup_id)
    return jsonify(res), status

@ordenes_routes.route('/api/delete-orden', methods=['POST'])
@token_required
@boss_only
def delete_orden():
    sup_id = request.user_payload.get('user_id')
    res, status = ordenes_service.remove_work_order(request.get_json(), sup_id)
    return jsonify(res), status