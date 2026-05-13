from flask import Blueprint,request,jsonify

from ..services import auth_service

auth_routes=Blueprint('auth_routes',__name__)

#REGISTRO DE USUARIO
@auth_routes.route('/api/register',methods=['POST'])
def register():
    data=request.get_json()

    if not data:
        return jsonify({
            'success':False,
            'message':'Peticion Vacia.'
        })

    response_data,status_code=auth_service.register_new_user(data)

    return jsonify(response_data),status_code


#INICIO DE SESION
@auth_routes.route('/api/login',methods=['POST'])
def login():
    data=request.get_json()

    if not data:
        return jsonify({
            'success':False,
            'message':'Petición Vacia.'
        })
    
    response_data,status_code=auth_service.validate_user(data)
    return jsonify(response_data),status_code