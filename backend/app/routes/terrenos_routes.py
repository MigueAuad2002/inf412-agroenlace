from flask import Blueprint, request, jsonify

from ..config import db, Config
from ..services import decode_access_token

terrenos_routes = Blueprint('terrenos_routes', __name__)


# ─────────────────────────────────────────────
# ENDPOINT: GET - LISTAR TERRENOS
# ─────────────────────────────────────────────
@terrenos_routes.route('/api/get-terrenos', methods=['GET'])
def get_terrenos():

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

    # VALIDACIÓN DE ROL: SOLO ADMINISTRADORES
    json = validation.get('payload')
    if json["role"] != 1:
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403

    # LOGICA DE EXTRACCION DE TERRENOS
    try:
        # ESTABLECER CONEXION CON LA BASE DE DATOS
        db.create_connection()

        # EXTRAER TERRENOS CON EL NOMBRE DEL PROPIETARIO
        terrenos_query = f"""
            SELECT
                T.NRO_LOTE,
                T.NOMBRE_SECTOR,
                T.TAMANO_HECTAREAS,
                T.LATITUD,
                T.LONGITUD,
                T.ID_USUARIO AS ID,
                U.USER_NAME AS PROPIETARIO
            FROM {Config.SCHEMA}.{Config.T_TERRENO} T
            INNER JOIN {Config.SCHEMA}.{Config.T_USER} U
                ON U.ID_USUARIO = T.ID_USUARIO
        """
        terrenos_result = db.execute_query(
            terrenos_query, fetchall=True
        )

        data = []
        columns = []

        for column in db.cur.description:
            columns.append(column[0])

        for row in terrenos_result:
            data.append(dict(zip(columns, row)))

        return jsonify({
            'success': True,
            'message': 'Terrenos obtenidos Exitosamente.',
            'list_terrenos': data
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })
    finally:
        db.close_connection()


# ─────────────────────────────────────────────
# ENDPOINT: POST - AGREGAR TERRENO
# ─────────────────────────────────────────────
@terrenos_routes.route('/api/add-terreno', methods=['POST'])
def add_terreno():

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

    # VALIDACIÓN DE ROL: VERIFICAR SI ES ADMIN
    json = validation.get('payload')
    if json["role"] != 1:
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403

    # OBTENER DATOS (JSON) DESDE EL FRONTEND
    data = request.get_json()

    # VALIDACION: CAMPOS REQUERIDOS PARA REGISTRAR UN TERRENO
    required_fields = ['nombre_sector', 'tamano_hectareas', 'latitud', 'longitud', 'estado', 'id_usuario']

    for field in required_fields:
        if field not in data or not str(data[field]).strip():
            return jsonify({
                'success': False,
                'message': f'Debe Ingresar Todos los Campos Requeridos. Falta: {field}'
            })

    # ORGANIZAR PARAMETROS
    nombre_sector    = data.get('nombre_sector').upper()
    tamano_hectareas = data.get('tamano_hectareas')
    latitud          = data.get('latitud')
    longitud         = data.get('longitud')
    estado           = data.get('estado').upper()
    id_usuario       = data.get('id_usuario')

    # LOGICA DE BASE DE DATOS PARA AGREGAR TERRENO
    try:
        db.create_connection()

        # VERIFICAR SI YA EXISTE UN LOTE CON ESE NOMBRE PARA EL MISMO PROPIETARIO
        check_query = f"""
            SELECT 1
            FROM {Config.SCHEMA}.{Config.T_TERRENO}
            WHERE nombre_sector = %s AND id_usuario = %s
            LIMIT 1
        """
        check_params = (nombre_sector, id_usuario)
        result = db.execute_query(check_query, check_params, fetchone=True)

        if result:
            return jsonify({
                'success': False,
                'message': 'Ya existe un terreno con ese nombre registrado para el mismo propietario.'
            })

        # EJECUTAR EL INSERT (nro_lote es auto-generado por la BD)
        insert_query = f"""
            INSERT INTO {Config.SCHEMA}.{Config.T_TERRENO}
            (nombre_sector, tamano_hectareas, latitud, longitud, estado, id_usuario)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        insert_params = (nombre_sector, tamano_hectareas, latitud, longitud, estado, id_usuario)
        ra = db.execute_query(insert_query, insert_params, commit=True)

        # VALIDAR SI SE AFECTARON FILAS
        if ra < 1:
            return jsonify({
                'success': False,
                'message': 'Hubo un problema al registrar el terreno en la base de datos.'
            })

        print(f'Terreno Registrado Exitosamente, {ra} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Terreno agregado exitosamente.'
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })
    finally:
        db.close_connection()


# ─────────────────────────────────────────────
# ENDPOINT: POST - ACTUALIZAR TERRENO
# ─────────────────────────────────────────────
@terrenos_routes.route('/api/update-terreno', methods=['POST'])
def update_terreno():

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

    # VALIDACIÓN DE ROL: VERIFICAR SI ES ADMIN
    json = validation.get('payload')
    if json["role"] != 1:
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403

    # OBTENER DATOS (JSON) DESDE EL FRONTEND
    data = request.get_json()
    nro_lote = data.get('nro_lote')

    # VALIDACION: SE REQUIERE EL NRO_LOTE PARA SABER QUÉ TERRENO ACTUALIZAR
    if not nro_lote:
        return jsonify({
            'success': False,
            'message': 'Debe enviar el nro_lote del terreno que desea actualizar.'
        })

    # CONSTRUCCIÓN DINÁMICA: SOLO SE ACTUALIZAN LOS CAMPOS QUE VENGAN EN EL JSON
    update_fields = []
    update_params = []

    if data.get('nombre_sector'):
        update_fields.append("nombre_sector = %s")
        update_params.append(data.get('nombre_sector').upper())

    if data.get('tamano_hectareas'):
        update_fields.append("tamano_hectareas = %s")
        update_params.append(data.get('tamano_hectareas'))

    if data.get('latitud'):
        update_fields.append("latitud = %s")
        update_params.append(data.get('latitud'))

    if data.get('longitud'):
        update_fields.append("longitud = %s")
        update_params.append(data.get('longitud'))

    if data.get('estado'):
        update_fields.append("estado = %s")
        update_params.append(data.get('estado').upper())

    if data.get('id_usuario'):
        update_fields.append("id_usuario = %s")
        update_params.append(data.get('id_usuario'))

    # VALIDACIÓN: VERIFICAR QUE SE ENVIÓ AL MENOS UN CAMPO NUEVO
    if not update_fields:
        return jsonify({
            'success': False,
            'message': 'No se enviaron datos nuevos para actualizar.'
        })

    # AGREGAR EL NRO_LOTE AL FINAL PARA LA CLÁUSULA WHERE
    update_params.append(nro_lote)

    # UNIR CAMPOS CON COMAS (Ej: "nombre_sector = %s, estado = %s")
    set_clause = ", ".join(update_fields)

    # LOGICA DE BASE DE DATOS
    try:
        db.create_connection()

        # CONSULTA PARA ACTUALIZAR EL TERRENO
        update_query = f"""
            UPDATE {Config.SCHEMA}.{Config.T_TERRENO}
            SET {set_clause}
            WHERE nro_lote = %s
        """
        update_result = db.execute_query(update_query, tuple(update_params), commit=True)

        # VALIDACIÓN: SI NO SE ENCUENTRA EL LOTE O LOS DATOS SON IDÉNTICOS
        if update_result < 1:
            return jsonify({
                'success': False,
                'message': 'Terreno no encontrado o los datos ingresados son idénticos a los actuales.'
            })

        print(f'Terreno Actualizado Exitosamente, {update_result} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Terreno actualizado exitosamente.',
            'filas_afectadas': update_result
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })
    finally:
        db.close_connection()


# ─────────────────────────────────────────────
# ENDPOINT: POST - ELIMINAR TERRENO
# ─────────────────────────────────────────────
@terrenos_routes.route('/api/delete-terreno', methods=['POST'])
def delete_terreno():

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

    # VALIDACIÓN DE ROL: VERIFICAR SI ES ADMIN
    json = validation.get('payload')
    if json["role"] != 1:
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403

    # OBTENER EL NRO_LOTE DEL TERRENO A ELIMINAR
    data = request.get_json()
    nro_lote = data.get('nro_lote')

    if not nro_lote:
        return jsonify({
            'success': False,
            'message': 'Debe enviar el nro_lote del terreno que desea eliminar.'
        })

    # LOGICA DE BASE DE DATOS PARA ELIMINAR TERRENO
    try:
        db.create_connection()

        # CONSULTA PARA ELIMINAR EL TERRENO POR SU NRO_LOTE
        delete_query = f"""
            DELETE FROM {Config.SCHEMA}.{Config.T_TERRENO}
            WHERE nro_lote = %s
        """
        delete_params = (nro_lote,)
        delete_result = db.execute_query(delete_query, delete_params, commit=True)

        # VALIDACION SI NO SE ENCUENTRA EL TERRENO
        if delete_result < 1:
            return jsonify({
                'success': False,
                'message': 'Terreno No Encontrado.'
            })

        print(f'Terreno Eliminado Exitosamente, {delete_result} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Terreno eliminado exitosamente.',
            'filas_afectadas': delete_result
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })
    finally:
        db.close_connection()
