from flask import Blueprint,request,jsonify

from ..services import profile_service


profile_routes=Blueprint('profile_routes',__name__)

@profile_routes.route('/api/profile',methods=['GET'])
def get_profile():
    auth_header=request.headers.get('Authorization')

    response_data,status_code=profile_service.fetch_profile_data(auth_header)

    return jsonify(response_data),status_code

@profile_routes.route('/api/update-profile', methods=['PUT'])
def update_profile():
    auth_header = request.headers.get('Authorization')
    
    data = request.get_json()
    response_data, status_code = profile_service.modify_profile_data(auth_header, data)
    return jsonify(response_data), status_code