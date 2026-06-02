from ..repositories import mant_maquinaria_repo
from ..config import db
from .aux_functs import decode_access_token

TIPOS_MANT_VALIDOS = {'PREVENTIVO', 'CORRECTIVO', 'REVISION', 'EMERGENCIA'}

def _validate_token(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, ({'success': False, 'message': 'Usuario No Autenticado.'}, 401)
    token = auth_header.split(' ')[1]
    validation = decode_access_token(token)
    if not validation['success']:
        return None, ({'success': False, 'message': 'Sesión inválida.'}, 401)
    return validation['payload'], None

def _parse_registro(item):
    for campo in ('fecha_inicio', 'fecha_fin'):
        if item.get(campo):
            item[campo] = str(item[campo])
    return item


def fetch_historial_by_maquina(auth_header, nro_maquina):
    _, err = _validate_token(auth_header)
    if err:
        return err

    try:
        db.create_connection()
        if not mant_maquinaria_repo.maquina_exists(nro_maquina):
            return {'success': False, 'message': 'La maquinaria no existe.'}, 404

        data = mant_maquinaria_repo.get_historial_by_maquina(nro_maquina)
        data = [_parse_registro(item) for item in data]
        return {'success': True, 'data': data}, 200
    except Exception as e:
        print(f'Error en fetch_historial_by_maquina: {e}')
        return {'success': False, 'message': f'Error del servidor: {str(e)}'}, 500
    finally:
        db.close_connection()


def fetch_all_historial(auth_header):
    _, err = _validate_token(auth_header)
    if err:
        return err

    try:
        db.create_connection()
        data = mant_maquinaria_repo.get_all_historial()
        data = [_parse_registro(item) for item in data]
        return {'success': True, 'data': data}, 200
    except Exception as e:
        print(f'Error en fetch_all_historial: {e}')
        return {'success': False, 'message': f'Error del servidor: {str(e)}'}, 500
    finally:
        db.close_connection()


def register_mantenimiento(auth_header, data):
    payload, err = _validate_token(auth_header)
    if err:
        return err

    campos_requeridos = ['nro_maquina', 'tipo_mant', 'descripcion', 'fecha_inicio']
    for campo in campos_requeridos:
        if not data.get(campo):
            return {'success': False, 'message': f'El campo "{campo}" es obligatorio.'}, 400

    if data['tipo_mant'].upper() not in TIPOS_MANT_VALIDOS:
        return {'success': False, 'message': f'tipo_mant inválido. Valores aceptados: {", ".join(TIPOS_MANT_VALIDOS)}.'}, 400

    try:
        db.create_connection()
        if not mant_maquinaria_repo.maquina_exists(data.get('nro_maquina')):
            return {'success': False, 'message': 'La maquinaria no existe.'}, 404

        data['tipo_mant'] = data['tipo_mant'].upper()
        supervisor_id = payload.get('user_id')
        nro_orden = mant_maquinaria_repo.add_historial(data, supervisor_id)

        if not nro_orden:
            return {'success': False, 'message': 'Ocurrió un error al registrar el mantenimiento.'}, 400

        return {'success': True, 'message': 'Mantenimiento registrado con éxito.', 'nro_orden': nro_orden}, 201
    except Exception as e:
        print(f'Error en register_mantenimiento: {e}')
        return {'success': False, 'message': f'Error al registrar: {str(e)}'}, 500
    finally:
        db.close_connection()


def modify_mantenimiento(auth_header, nro_orden, data):
    _, err = _validate_token(auth_header)
    if err:
        return err

    campos_requeridos = ['tipo_mant', 'descripcion', 'fecha_inicio']
    for campo in campos_requeridos:
        if not data.get(campo):
            return {'success': False, 'message': f'El campo "{campo}" es obligatorio.'}, 400

    if data['tipo_mant'].upper() not in TIPOS_MANT_VALIDOS:
        return {'success': False, 'message': f'tipo_mant inválido. Valores aceptados: {", ".join(TIPOS_MANT_VALIDOS)}.'}, 400

    try:
        db.create_connection()
        if not mant_maquinaria_repo.get_historial_by_id(nro_orden):
            return {'success': False, 'message': 'El registro de mantenimiento no existe.'}, 404

        data['tipo_mant'] = data['tipo_mant'].upper()
        mant_maquinaria_repo.update_historial(nro_orden, data)

        if data.get('observaciones') is not None:
            mant_maquinaria_repo.update_detalle_maquina(nro_orden, data.get('observaciones'))

        return {'success': True, 'message': 'Mantenimiento actualizado correctamente.'}, 200
    except Exception as e:
        print(f'Error en modify_mantenimiento: {e}')
        return {'success': False, 'message': f'Error al actualizar: {str(e)}'}, 500
    finally:
        db.close_connection()


def remove_mantenimiento(auth_header, nro_orden):
    _, err = _validate_token(auth_header)
    if err:
        return err

    try:
        db.create_connection()
        if not mant_maquinaria_repo.get_historial_by_id(nro_orden):
            return {'success': False, 'message': 'El registro de mantenimiento no existe.'}, 404

        mant_maquinaria_repo.delete_historial(nro_orden)
        return {'success': True, 'message': 'Registro de mantenimiento eliminado correctamente.'}, 200
    except Exception as e:
        print(f'Error en remove_mantenimiento: {e}')
        return {'success': False, 'message': 'No se pudo eliminar el registro de mantenimiento.'}, 400
    finally:
        db.close_connection()
