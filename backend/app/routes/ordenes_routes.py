from flask import Blueprint, request, jsonify
from ..services import decode_access_token, ordenes_service

ordenes_routes = Blueprint('ordenes_routes', __name__)

def staff_required(func):
    """Acceso permitido solo para Admin, Supervisor y Empleado (Excluye Rol 4)"""
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'No autenticado'}), 401
        
        val = decode_access_token(auth.split(" ")[1])
        if not val['success']:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
            
        # Validación de Rol (Si es 4, es un cliente y no tiene permiso aquí)
        if val['payload'].get('role') == 4:
            return jsonify({
                'success': False, 
                'message': 'Acceso denegado. Se requieren permisos superiores.'
            }), 403
            
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@ordenes_routes.route('/api/get-ordenes', methods=['GET'])
@staff_required
def get_ordenes():
    res, status = ordenes_service.get_ordenes_data()
    return jsonify(res), status