from flask import Blueprint,redirect,request,jsonify
from werkzeug.security import generate_password_hash,check_password_hash

from ..config import db,Config
from ..services import create_access_token,decode_access_token

users_routes=Blueprint('users_routes',__name__)

@users_routes.route('/api/get-users',methods=['GET'])
def get_users():

    #OBTENER LA CABECERA DONDE SE ENVIA EL TOKEN
    auth_header=request.headers.get('Authorization')

    #SI NO CONTIENE LA CABECERA RETORNAR JSON ERROR
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success':False,
            'message':'Usuario No Autenticado.'
        }),401

    #EXTRAER EL TOKEN LIMPIO
    token = auth_header.split(" ")[1]

    #VALIDAR TOKEN
    validation=decode_access_token(token)

    #TOKEN INVALIDO ARROJAR JSON ERROR
    if not validation['success']:
        return jsonify({'success':False,'message':'Usuario No Autenticado.'}),401
    
    #LOGICA DE EXTRACCION DE USUARIOS
    try:
        #ESTABLECER CONEXION CON LA BASE DE DATOS
        db.create_connection()

        #EXTRAER UNA LISTA DE USUARIOS CON ALGUNAS DE SUS PROPIEDADES
        users_query="""
            select id_usuario, user_name, documento_identidad, nombre_razon_social, telefono, b.nombre_rol as rol
            from agroenlace.usuario a 
            inner join agroenlace.rol b on b.id = a.id_rol
        """
        users_result=db.execute_query(
            users_query,fetchall=True
        )

        print(users_result)
        return jsonify({
            'success':True,
            'message':'Usuarios obtenidos Exitosamente.',
            'list_users':users_result
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success':False,
            'message':f'ERROR: {e}'
        })
    finally:
        db.close_connection()