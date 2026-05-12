from ..repositories import roles_repo
from ..config import db
from .aux_functs import decode_access_token

def fetch_roles(auth_header:str)->tuple[dict,int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success':True, 'message':'Usuario No Autenticado.'},401
    
    token=auth_header.split(" ")[1]
    validation=decode_access_token(token)

    if not validation["success"]:
        return {'success':False,'message':'Usuario No Autenticado.'},401
    
    json_token = validation.get('payload') 
    if json_token.get("role") != 1: 
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403
    
    try:
        db.create_connection()
        
        #OBTENER LISTA DE ROLES DESDE LA DB
        data = roles_repo.get_all_roles()

        return {
            'success': True,
            'message': 'Roles obtenidos exitosamente.',
            'list_roles': data
        }, 200

    except Exception as e:
        print(f'ERROR en fetch_roles: {e}')
        return {'success': False, 'message': f'ERROR: {str(e)}'}, 500
        
    finally:
        db.close_connection()


def create_new_role(auth_header:str,data:dict)->tuple[dict,int]:
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success':True,'message':'Usuario No Autenticado.'},401
    
    token=auth_header.split(" ")[1]
    validation=decode_access_token(token)

    if not validation["success"]:
        return {'success':False,'message':'Usuario No Autenticado.'},401
    
    json_token = validation.get('payload') 
    user_id=json_token.get('user_id')
    if json_token.get("role") != 1: 
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403
    
    nombre_rol=data.get('nombre_rol')
    accion='CREAR NUEVO ROL'

    if not nombre_rol or str(nombre_rol).strip()=='':
        return {'success': False, 'message': 'Debe ingresar el nombre del rol.'},400

    try:
        db.create_connection()

        check_result=roles_repo.exist_role(nombre_rol)

        if check_result:
            return {'success':False,'message':'El rol ya se encuentra registrado.'},404
        
        insert_result=roles_repo.insert_new_role(nombre_rol)

        if insert_result<1:
            return {'success':False,'message':'Ocurrio un problema al registrar el rol.'},500
        
        db.insert_log(accion,user_id)

        return {'success':True,'message':'Rol registrado Exitosamente.'},200
        
    except Exception as e:
        return {'success':False,'message':str(e)},500
    finally:
        db.close_connection()


def update_role(auth_header: str, data: dict) -> tuple[dict, int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401
    
    json_token = validation.get('payload') 
    admin_id = json_token.get("user_id")

    if json_token.get("role") != 1: 
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403
    
    
    id_rol = data.get("id")
    nombre_rol = data.get("nombre_rol")

    if not id_rol or not nombre_rol or str(nombre_rol).strip() == '': 
        
        return {'success': False, 'message': 'Debe enviar el ID y el nuevo nombre del rol.'}, 400

    nombre_rol = str(nombre_rol).upper().strip()
    accion = f"ACTUALIZACIÓN DE ROL ID {id_rol} A: {nombre_rol}"

    
    try:
        db.create_connection()

        update_result = roles_repo.update_role_name(id_rol, nombre_rol)        
        if update_result < 1:
            return {'success': False, 'message': 'Rol no encontrado o el nombre es idéntico al actual.'}, 404
            
        try:
            db.insert_log(accion=accion, id_user=admin_id)
        except Exception as log_error:
            print(f"Advertencia Log: {log_error}")

        return {'success': True, 'message': 'Rol actualizado exitosamente.'}, 200

    except Exception as e:
        print(f'ERROR en update_role: {e}')
        return {'success': False, 'message': f'ERROR: {str(e)}'}, 500
        
    finally:
        db.close_connection()


def remove_role(auth_header: str, data: dict) -> tuple[dict, int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401
    
    json_token = validation.get('payload') 
    admin_id = json_token.get("user_id")

    if json_token.get("role") != 1: 
        return {'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}, 403
    
    id_rol = data.get("id")

    if not id_rol: 
        return {'success': False, 'message': 'Debe seleccionar un rol para eliminar.'}, 400

    if int(id_rol) == 1:
        return {'success': False, 'message': 'Acción bloqueada: No se puede eliminar el rol raíz del sistema.'}, 403
    accion = f"ELIMINACIÓN DE ROL ID: {id_rol}"

    try:
        db.create_connection()

        delete_result = roles_repo.delete_role(id_rol)
        
        if delete_result < 1:
            return {'success': False, 'message': 'Rol no encontrado.'}, 404
        
        try:
            db.insert_log(accion=accion, id_user=admin_id)
        except Exception as log_error:
            print(f"Advertencia Log: {log_error}")

        return {'success': True, 'message': 'Rol eliminado exitosamente.'}, 200

    except Exception as e:
        print(f'ERROR en remove_role: {e}')
        error_msg = str(e).lower()
        
        if "violates foreign key constraint" in error_msg or "llave foránea" in error_msg:
            return {'success': False, 'message': 'No se puede eliminar el rol porque hay usuarios asignados a él.'}, 409
            
        return {'success': False, 'message': f'ERROR: {str(e)}'}, 500
        
    finally:
        db.close_connection()