from flask import Blueprint,redirect,request,jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from ..config import db,Config
from ..services import create_access_token,decode_access_token

audit_routes = Blueprint('audit_routes', __name__)

# ENDPOINT: OBTENER BITACORA (ULTIMOS 30 DIAS)
@audit_routes.route('/api/get-bitacora', methods=['GET'])
def get_bitacora():

    # AUTENTICACION
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'message': 'Usuario No Autenticado.'
        }), 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return jsonify({
            'success': False,
            'message': 'Usuario No Autenticado.'
        }), 401
    
    # VALIDAR ROL ADMIN
    json_token = validation.get('payload')

    if json_token["role"] != 1:
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403

    try:
        db.create_connection()

        # CONSULTA
        bitacora_query = f"""
            SELECT A.NRO, A.fecha_hora, A.accion, B.user_name
            FROM {Config.SCHEMA}.{Config.T_BITACORA} A
            INNER JOIN {Config.SCHEMA}.{Config.T_USER} B 
                ON A.id_usuario = B.id_usuario
            WHERE A.fecha_hora >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY A.fecha_hora DESC
        """

        result = db.execute_query(
            bitacora_query,
            fetchall=True
        )

        data = []
        columns = []

        for column in db.cur.description:
            columns.append(column[0])

        for row in result:
            data.append(dict(zip(columns, row)))

        # RESPUESTA
        return jsonify({
            'success': True,
            'message': 'Bitácora de los últimos 30 días obtenida correctamente.',
            'bitacora': data
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })

    finally:
        db.close_connection()
