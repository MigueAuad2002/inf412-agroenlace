from flask import Blueprint, jsonify, request
from ..services import decode_access_token, audit_service

audit_routes = Blueprint('audit_routes', __name__)

# Reutilizamos la lógica del decorador para limpiar las rutas
def admin_required(func):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401
        
        token = auth_header.split(" ")[1]
        validation = decode_access_token(token)
        
        if not validation['success'] or validation.get('payload', {}).get('role') != 1:
            return jsonify({
                'success': False, 
                'message': 'Acceso denegado. Se requieren permisos de Administrador.'
            }), 403
            
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@audit_routes.route('/api/get-bitacora', methods=['GET'])
@admin_required
def get_bitacora():
    # LLAMADA AL SERVICIO
    response_data, status_code = audit_service.fetch_audit_logs()
    return jsonify(response_data), status_code
