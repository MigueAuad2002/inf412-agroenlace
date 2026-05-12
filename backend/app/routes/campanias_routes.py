from flask import Blueprint, request, jsonify
from ..config import db, Config
from ..services import campanias_service

campanias_routes = Blueprint('campanias_routes', __name__)


#GET CAMPAÑAS
@campanias_routes.route('/api/get-campanias', methods=['GET'])
def get_campanias():
    auth_header = request.headers.get('Authorization')

    response_data, status_code = campanias_service.fetch_campanias(auth_header)
    
    return jsonify(response_data), status_code



#CREATE CAMPAÑAS
@campanias_routes.route('/api/add-campania', methods=['POST'])
def add_campania():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'Cuerpo de petición inválido o vacío'}), 400

    response_data, status_code = campanias_service.create_campania(auth_header, data)
    
    return jsonify(response_data), status_code


#UPDATE CAMPAÑA
@campanias_routes.route('/api/update-campania', methods=['POST'])
def update_campania():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'Cuerpo de petición vacío.'}), 400

    response, status_code = campanias_service.update_existing_campania(auth_header, data)
    
    return jsonify(response), status_code


#DELETE CAMPAÑA
@campanias_routes.route('/api/delete-campania', methods=['POST'])
def delete_campania():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'Cuerpo de petición vacío.'}), 400

    response, status_code = campanias_service.remove_campania(auth_header, data)
    
    return jsonify(response), status_code