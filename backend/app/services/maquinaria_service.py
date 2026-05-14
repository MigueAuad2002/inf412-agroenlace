from ..repositories import maquinaria_repo
from ..config import db
from .aux_functs import decode_access_token

def fetch_maquinaria(auth_header: str):
    # 1. VALIDACIÓN DE TOKEN
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401
    
    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation["success"]:
        return {'success': False, 'message': 'Sesión inválida.'}, 401
    
    # 2. LÓGICA DE NEGOCIO Y BASE DE DATOS
    try:
        db.create_connection()
        data = maquinaria_repo.get_all_maquinaria()
        
        # Parseo de fechas y decimales
        for item in data:
            if item['fecha_ult_mant']: item['fecha_ult_mant'] = str(item['fecha_ult_mant'])
            if item['created_at']: item['created_at'] = str(item['created_at'])
            if item['kilometraje']: item['kilometraje'] = float(item['kilometraje'])
            if item['cant_tanque_comb']: item['cant_tanque_comb'] = float(item['cant_tanque_comb'])

        return {'success': True, 'data': data}, 200
    except Exception as e:
        print(f"Error en fetch_maquinaria: {e}")
        return {'success': False, 'message': f'Error del servidor: {str(e)}'}, 500
    finally:
        db.close_connection()

def register_maquinaria(auth_header:str,data:dict):
    try:
        db.create_connection()
        
        # REGLA DE NEGOCIO
        if maquinaria_repo.get_maquinaria_by_placa(data.get('placa')):
            return {'success': False, 'message': 'Ya existe una maquinaria con esa placa.'}, 400
        
        new_id = maquinaria_repo.add_maquinaria(data)

        if new_id<1:
            return {'success': False, 'message': 'Ocurrio un Error al registrar la Maquinaria.'}, 400
        return {'success': True, 'message': 'Maquinaria registrada con éxito.'}, 201
    except Exception as e:
        return {'success': False, 'message': f'Error al registrar: {str(e)}'}, 500
    finally:
        db.close_connection()

def modify_maquinaria(auth_header:str,nro_maquina:int, data:dict):
    try:
        db.create_connection()
        
        
        if maquinaria_repo.get_maquinaria_by_placa(data.get('placa'), exclude_nro=nro_maquina):
            return {'success': False, 'message': 'La placa ingresada ya pertenece a otra maquinaria.'}, 400
            
        maquinaria_repo.update_maquinaria(nro_maquina, data)
        return {'success': True, 'message': 'Maquinaria actualizada correctamente.'}, 200
    except Exception as e:
        return {'success': False, 'message': f'Error al actualizar: {str(e)}'}, 500
    finally:
        db.close_connection()

def remove_maquinaria(auth_header,nro_maquina):
    try:
        db.create_connection()
        maquinaria_repo.delete_maquinaria(nro_maquina)
        return {'success': True, 'message': 'Maquinaria eliminada correctamente.'}, 200
    except Exception as e:
        # Aquí saltará un error si intentas borrar una máquina que ya tiene Órdenes de Trabajo (Integridad referencial)
        return {'success': False, 'message': 'No se puede eliminar la maquinaria porque está en uso o tiene historial.'}, 400
    finally:
        db.close_connection()