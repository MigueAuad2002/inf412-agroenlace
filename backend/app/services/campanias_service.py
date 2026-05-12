from ..repositories import campanias_repo
from ..config import db
from .aux_functs import decode_access_token

def fetch_campanias(auth_header: str) -> tuple[dict, int]:
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401
    
    json_payload = validation.get('payload')
    if json_payload.get("role") != 1:
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403

    try:
        db.create_connection()

        data = campanias_repo.get_all_campanias()

        return {
            'success': True,
            'message': 'Campañas de cultivo obtenidas Exitosamente.',
            'list_campanias': data
        }, 200

    except Exception as e:
        print(f'ERROR en fetch_campanias: {e}')
        return {'success': False, 'message': f'ERROR: {str(e)}'}, 500
        
    finally:
        db.close_connection()

def create_campania(auth_header: str, data: dict) -> tuple[dict, int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    json_payload = validation.get('payload')
    admin_id = json_payload.get("user_id")

    if json_payload.get("role") != 1:
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403

    
    required_fields = [
        'nombre_campana', 'variedad', 'fecha_siembra',
        'fecha_cosecha', 'estado', 'rendimiento_estimado', 'nro_lote'
    ]

    for field in required_fields:
        if field not in data or str(data[field]).strip() == '':
            
            return {'success': False, 'message': f'Debe Ingresar Todos los Campos Requeridos. Falta: {field}'}, 400

    nombre_campana       = data.get('nombre_campana').upper()
    variedad             = data.get('variedad').upper()
    fecha_siembra        = data.get('fecha_siembra')
    fecha_cosecha        = data.get('fecha_cosecha')
    estado               = data.get('estado').upper()
    rendimiento_estimado = data.get('rendimiento_estimado')
    rendimiento_real     = data.get('rendimiento_real') # Puede ser None
    nro_lote             = data.get('nro_lote')

    accion = f"REGISTRO DE NUEVA CAMPAÑA: {nombre_campana} EN LOTE #{nro_lote}"

    
    try:
        db.create_connection()

        
        if campanias_repo.check_campania_exists(nombre_campana, nro_lote):
            
            return {'success': False, 'message': 'Ya existe una campaña con ese nombre registrada en el mismo lote.'}, 409

        
        ra = campanias_repo.insert_campania(
            nombre_campana, variedad, fecha_siembra, fecha_cosecha, 
            estado, rendimiento_estimado, rendimiento_real, nro_lote
        )

        if ra < 1:
            return {'success': False, 'message': 'Hubo un problema al registrar la campaña en la base de datos.'}, 500

        
        try:
            db.insert_log(accion=accion, id_user=admin_id)
        except Exception as log_error:
            print(f"Advertencia: No se pudo registrar en bitácora. Error: {log_error}")

        
        return {'success': True, 'message': 'Campaña de cultivo agregada exitosamente.'}, 201

    except Exception as e:
        print(f'ERROR en create_campania: {e}')
        return {'success': False, 'message': f'ERROR: {str(e)}'}, 500
    finally:
        db.close_connection()

def update_existing_campania(auth_header: str, data: dict) -> tuple[dict, int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    json_payload = validation.get('payload')
    if json_payload.get("role") != 1:
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403

    
    id_campana = data.get('id_campana')
    if not id_campana:
        return {'success': False, 'message': 'Debe enviar el id_campana de la campaña.'}, 400

    
    update_fields = []
    update_params = []

    
    fields_to_process = {
        'nombre_campana': True,  
        'variedad': True,
        'fecha_siembra': False,
        'fecha_cosecha': False,
        'estado': True,
        'rendimiento_estimado': False,
        'rendimiento_real': False,
        'nro_lote': False
    }

    for field, to_upper in fields_to_process.items():
        val = data.get(field)
        
        if field == 'rendimiento_real':
            if val is not None:
                update_fields.append(f"{field} = %s")
                update_params.append(val)
        elif val:
            update_fields.append(f"{field} = %s")
            update_params.append(val.upper() if to_upper else val)

    if not update_fields:
        return {'success': False, 'message': 'No se enviaron datos nuevos para actualizar.'}, 400

    
    update_params.append(id_campana)
    set_clause = ", ".join(update_fields)

    
    try:
        db.create_connection()
        
        result = campanias_repo.update_campania_data(set_clause, update_params)

        if result < 1:
            return {
                'success': False, 
                'message': 'Campaña no encontrada o los datos son idénticos a los actuales.'
            }, 404

        
        db.insert_log(f"ACTUALIZÓ CAMPAÑA ID: {id_campana}", json_payload.get("user_id"))

        return {
            'success': True,
            'message': 'Campaña de cultivo actualizada exitosamente.',
            'filas_afectadas': result
        }, 200

    except Exception as e:
        print(f"Error en update_existing_campania: {e}")
        return {'success': False, 'message': f"ERROR: {str(e)}"}, 500
    finally:
        db.close_connection()

def remove_campania(auth_header: str, data: dict) -> tuple[dict, int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    json_payload = validation.get('payload')
    if json_payload.get("role") != 1:
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403

    
    id_campana = data.get('id_campana')
    if not id_campana:
        return {'success': False, 'message': 'Debe enviar el id_campana de la campaña.'}, 400

    try:
        db.create_connection()
        
        
        filas_afectadas = campanias_repo.delete_campania_from_db(id_campana)

        if filas_afectadas < 1:
            return {'success': False, 'message': 'Campaña No Encontrada.'}, 404

        
        db.insert_log(f"ELIMINÓ CAMPAÑA ID: {id_campana}", json_payload.get("user_id"))

        return {
            'success': True, 
            'message': 'Campaña de cultivo eliminada exitosamente.',
            'filas_afectadas': filas_afectadas
        }, 200

    except Exception as e:
        print(f"Error en remove_campania: {e}")
        return {'success': False, 'message': f"ERROR: {str(e)}"}, 500
    finally:
        db.close_connection()