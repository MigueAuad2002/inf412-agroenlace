from flask import Blueprint, redirect, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from ..config import db, Config
from ..services import create_access_token, decode_access_token

agro_routes = Blueprint('agro_routes', __name__)


# ENDPOINT MOSTRAR ORDENES DE TRABAJO
@agro_routes.route('/api/get-ordenes', methods=['GET'])
def get_ordenes():

    # OBTENER LA CABECERA DONDE SE ENVIA EL TOKEN
    auth_header = request.headers.get('Authorization')

    # SI NO CONTIENE LA CABECERA RETORNAR JSON ERROR
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'message': 'Usuario No Autenticado.'
        }), 401

    # EXTRAER EL TOKEN LIMPIO
    token = auth_header.split(" ")[1]

    # VALIDAR TOKEN
    validation = decode_access_token(token)

    # TOKEN INVALIDO ARROJAR JSON ERROR
    if not validation['success']:
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401

    # VALIDACIÓN DE ROL: VERIFICAR SI ES CLIENTE
    json = validation.get('payload')
    if json["role"] == 4:
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos superiores.'
        }), 403

    # LOGICA DE EXTRACCION DE ORDENES DE TRABAJO
    try:
        # ESTABLECER CONEXION CON LA BASE DE DATOS
        db.create_connection()

        # EXTRAER UNA LISTA DE ORDENES DE TRABAJO CON LOS DATOS DEL SUPERVISOR Y EMPLEADO
        ordenes_query = f"""
            SELECT 
                o.nro_orden,
                o.tipo_trabajo,
                o.fecha_inicio,
                o.fecha_fin,
                o.fecha_calculo,
                o.estado,
                o.id_campana,
                o.id_supervisor,
                us.user_name AS supervisor_username,
                o.id_empleado,
                ue.user_name AS empleado_username
            FROM {Config.SCHEMA}.{Config.T_ORDEN} o
            LEFT JOIN {Config.SCHEMA}.{Config.T_USER} us
                ON us.id_usuario = o.id_supervisor
            LEFT JOIN {Config.SCHEMA}.{Config.T_USER} ue
                ON ue.id_usuario = o.id_empleado
        """
        ordenes_result = db.execute_query(
            ordenes_query, fetchall=True
        )

        data = []
        columns = []

        for column in db.cur.description:
            columns.append(column[0])

        for row in ordenes_result:
            data.append(dict(zip(columns, row)))

        return jsonify({
            'success': True,
            'message': 'Órdenes de trabajo obtenidas Exitosamente.',
            'list_ordenes': data
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })
    finally:
        db.close_connection()
