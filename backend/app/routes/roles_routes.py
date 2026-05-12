from flask import Blueprint, request, jsonify
from ..config import db, Config
from ..services import roles_service

roles_routes = Blueprint('roles_routes', __name__)

#GET ROLES
@roles_routes.route('/api/get-roles', methods=['GET'])
def get_roles():
   auth_header=request.headers.get('Authorization')

   response_data,status_code=roles_service.fetch_roles(auth_header)

   return jsonify(response_data),status_code


#CREATE ROLE
@roles_routes.route('/api/add-roles', methods=['POST'])
def add_roles():
    auth_header = request.headers.get('Authorization')
    data=request.get_json()

    if not data:
        return jsonify({
            'success':False,
            'message':'Solicitud Invalida'
        })
    
    response_data,status_code=roles_service.create_new_role(auth_header,data)

    return jsonify(response_data),status_code

#UPDATE ROLE
@roles_routes.route('/api/update-roles', methods=['POST'])  
def update_roles():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No se enviaron datos en la petición.'}), 400

    response_data, status_code = roles_service.update_role(auth_header, data)
    
    return jsonify(response_data), status_code


#DELETE ROLE
@roles_routes.route('/api/delete-roles', methods=['POST'])
def delete_roles():
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No se enviaron datos en la petición.'}), 400

    response_data, status_code = roles_service.remove_role(auth_header, data)
    
    return jsonify(response_data), status_code