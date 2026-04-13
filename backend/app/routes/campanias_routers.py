from flask import Blueprint, request, jsonify

from ..config import db, Config
from ..services import decode_access_token

campanias_routes = Blueprint('campanias_routes', __name__)


# ─────────────────────────────────────────────
# ENDPOINT: GET - LISTAR CAMPANAS DE CULTIVO
# ─────────────────────────────────────────────
@campanias_routes.route('/api/get-campanias', methods=['GET'])
def get_campanias():

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

    # LOGICA DE EXTRACCION DE CAMPANAS DE CULTIVO
    try:
        # ESTABLECER CONEXION CON LA BASE DE DATOS
        db.create_connection()

        # EXTRAER CAMPANAS CON SECTOR DEL TERRENO Y NOMBRE DEL PROPIETARIO
        campanias_query = f"""
            SELECT
                C.ID_CAMPANA,
                C.NOMBRE_CAMPANA,
                C.VARIEDAD,
                C.FECHA_SIEMBRA,
                C.FECHA_COSECHA,
                C.ESTADO,
                C.RENDIMIENTO_ESTIMADO,
                C.RENDIMIENTO_REAL,
                C.NRO_LOTE,
                T.NOMBRE_SECTOR,
                U.ID_USUARIO,
                U.USER_NAME
            FROM {Config.SCHEMA}.{Config.T_CAMPANA} C
            INNER JOIN {Config.SCHEMA}.{Config.T_TERRENO} T
                ON C.NRO_LOTE = T.NRO_LOTE
            INNER JOIN {Config.SCHEMA}.{Config.T_USER} U
                ON U.ID_USUARIO = T.ID_USUARIO
        """
        campanias_result = db.execute_query(
            campanias_query, fetchall=True
        )

        data = []
        
        # Validación de seguridad para evitar "'NoneType' object is not iterable"
        if campanias_result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in campanias_result:
                data.append(dict(zip(columns, row)))

        return jsonify({
            'success': True,
            'message': 'Campañas de cultivo obtenidas Exitosamente.',
            'list_campanias': data
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
# ENDPOINT: POST - AGREGAR CAMPANA DE CULTIVO
# ─────────────────────────────────────────────
@campanias_routes.route('/api/add-campania', methods=['POST'])
def add_campania():

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

    # VALIDACION: CAMPOS REQUERIDOS PARA REGISTRAR UNA CAMPANA
    required_fields = [
        'nombre_campana', 'variedad', 'fecha_siembra',
        'fecha_cosecha', 'estado', 'rendimiento_estimado', 'nro_lote'
    ]

    for field in required_fields:
        if field not in data or str(data[field]).strip() == '':
            return jsonify({
                'success': False,
                'message': f'Debe Ingresar Todos los Campos Requeridos. Falta: {field}'
            })

    # ORGANIZAR PARAMETROS
    nombre_campana       = data.get('nombre_campana').upper()
    variedad             = data.get('variedad').upper()
    fecha_siembra        = data.get('fecha_siembra')
    fecha_cosecha        = data.get('fecha_cosecha')
    estado               = data.get('estado').upper()
    rendimiento_estimado = data.get('rendimiento_estimado')
    rendimiento_real     = data.get('rendimiento_real')   # OPCIONAL: puede ser NULL al inicio
    nro_lote             = data.get('nro_lote')

    # LOGICA DE BASE DE DATOS PARA AGREGAR CAMPANA
    try:
        db.create_connection()

        # VERIFICAR SI YA EXISTE UNA CAMPAÑA CON ESE NOMBRE EN EL MISMO LOTE
        check_query = f"""
            SELECT 1
            FROM {Config.SCHEMA}.{Config.T_CAMPANA}
            WHERE nombre_campana = %s AND nro_lote = %s
            LIMIT 1
        """
        check_params = (nombre_campana, nro_lote)
        result = db.execute_query(check_query, check_params, fetchone=True)

        if result:
            return jsonify({
                'success': False,
                'message': 'Ya existe una campaña con ese nombre registrada en el mismo lote.'
            })

        # EJECUTAR EL INSERT (id_campana es auto-generado por la BD)
        insert_query = f"""
            INSERT INTO {Config.SCHEMA}.{Config.T_CAMPANA}
            (nombre_campana, variedad, fecha_siembra, fecha_cosecha, estado, rendimiento_estimado, rendimiento_real, nro_lote)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        insert_params = (
            nombre_campana, variedad, fecha_siembra, fecha_cosecha,
            estado, rendimiento_estimado, rendimiento_real, nro_lote
        )
        ra = db.execute_query(insert_query, insert_params, commit=True)

        # VALIDAR SI SE AFECTARON FILAS
        if ra < 1:
            return jsonify({
                'success': False,
                'message': 'Hubo un problema al registrar la campaña en la base de datos.'
            })

        print(f'Campaña Registrada Exitosamente, {ra} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Campaña de cultivo agregada exitosamente.'
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
# ENDPOINT: POST - ACTUALIZAR CAMPANA DE CULTIVO
# ─────────────────────────────────────────────
@campanias_routes.route('/api/update-campania', methods=['POST'])
def update_campania():

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
    id_campana = data.get('id_campana')

    # VALIDACION: SE REQUIERE EL ID PARA SABER QUÉ CAMPAÑA ACTUALIZAR
    if not id_campana:
        return jsonify({
            'success': False,
            'message': 'Debe enviar el id_campana de la campaña que desea actualizar.'
        })

    # CONSTRUCCIÓN DINÁMICA: SOLO SE ACTUALIZAN LOS CAMPOS QUE VENGAN EN EL JSON
    update_fields = []
    update_params = []

    if data.get('nombre_campana'):
        update_fields.append("nombre_campana = %s")
        update_params.append(data.get('nombre_campana').upper())

    if data.get('variedad'):
        update_fields.append("variedad = %s")
        update_params.append(data.get('variedad').upper())

    if data.get('fecha_siembra'):
        update_fields.append("fecha_siembra = %s")
        update_params.append(data.get('fecha_siembra'))

    if data.get('fecha_cosecha'):
        update_fields.append("fecha_cosecha = %s")
        update_params.append(data.get('fecha_cosecha'))

    if data.get('estado'):
        update_fields.append("estado = %s")
        update_params.append(data.get('estado').upper())

    if data.get('rendimiento_estimado'):
        update_fields.append("rendimiento_estimado = %s")
        update_params.append(data.get('rendimiento_estimado'))

    if data.get('rendimiento_real') is not None:
        update_fields.append("rendimiento_real = %s")
        update_params.append(data.get('rendimiento_real'))

    if data.get('nro_lote'):
        update_fields.append("nro_lote = %s")
        update_params.append(data.get('nro_lote'))

    # VALIDACIÓN: VERIFICAR QUE SE ENVIÓ AL MENOS UN CAMPO NUEVO
    if not update_fields:
        return jsonify({
            'success': False,
            'message': 'No se enviaron datos nuevos para actualizar.'
        })

    # AGREGAR EL ID_CAMPANA AL FINAL PARA LA CLÁUSULA WHERE
    update_params.append(id_campana)

    # UNIR CAMPOS CON COMAS (Ej: "estado = %s, variedad = %s")
    set_clause = ", ".join(update_fields)

    # LOGICA DE BASE DE DATOS
    try:
        db.create_connection()

        # CONSULTA PARA ACTUALIZAR LA CAMPAÑA
        update_query = f"""
            UPDATE {Config.SCHEMA}.{Config.T_CAMPANA}
            SET {set_clause}
            WHERE id_campana = %s
        """
        update_result = db.execute_query(update_query, tuple(update_params), commit=True)

        # VALIDACIÓN: SI NO SE ENCUENTRA LA CAMPAÑA O LOS DATOS SON IDÉNTICOS
        if update_result < 1:
            return jsonify({
                'success': False,
                'message': 'Campaña no encontrada o los datos ingresados son idénticos a los actuales.'
            })

        print(f'Campaña Actualizada Exitosamente, {update_result} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Campaña de cultivo actualizada exitosamente.',
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
# ENDPOINT: POST - ELIMINAR CAMPANA DE CULTIVO
# ─────────────────────────────────────────────
@campanias_routes.route('/api/delete-campania', methods=['POST'])
def delete_campania():

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

    # OBTENER EL ID DE LA CAMPAÑA A ELIMINAR
    data = request.get_json()
    id_campana = data.get('id_campana')

    if not id_campana:
        return jsonify({
            'success': False,
            'message': 'Debe enviar el id_campana de la campaña que desea eliminar.'
        })

    # LOGICA DE BASE DE DATOS PARA ELIMINAR CAMPAÑA
    try:
        db.create_connection()

        # CONSULTA PARA ELIMINAR LA CAMPAÑA POR SU ID
        delete_query = f"""
            DELETE FROM {Config.SCHEMA}.{Config.T_CAMPANA}
            WHERE id_campana = %s
        """
        delete_params = (id_campana,)
        delete_result = db.execute_query(delete_query, delete_params, commit=True)

        # VALIDACION SI NO SE ENCUENTRA LA CAMPAÑA
        if delete_result < 1:
            return jsonify({
                'success': False,
                'message': 'Campaña No Encontrada.'
            })

        print(f'Campaña Eliminada Exitosamente, {delete_result} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Campaña de cultivo eliminada exitosamente.',
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