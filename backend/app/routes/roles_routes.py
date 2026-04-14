from flask import Blueprint, request, jsonify
from ..config import db, Config
from ..services import decode_access_token

roles_routes = Blueprint('roles_routes', __name__)

# ==========================================
# ENDPOINT: OBTENER TODOS LOS ROLES
# ==========================================
@roles_routes.route('/api/get-roles', methods=['GET'])
def get_roles():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401
    
    json_token = validation.get('payload') 
    if json_token.get("role") != 1: 
        return jsonify({'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}), 403
    
    try:
        db.create_connection()

        # Asumimos que la tabla tiene 'id' y 'nombre_rol' basándonos en tu query de usuarios
        roles_query = f"""
            SELECT id, nombre_rol
            FROM {Config.SCHEMA}.{Config.T_ROL}
            ORDER BY id ASC
        """
        roles_result = db.execute_query(roles_query, fetchall=True)

        data = []
        
        # Validación de seguridad a prueba de balas (El Caza-Bugs)
        if roles_result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in roles_result:
                data.append(dict(zip(columns, row)))
        
        return jsonify({
            'success': True,
            'message': 'Roles obtenidos exitosamente.',
            'list_roles': data
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({'success': False, 'message': f'ERROR: {e}'})
    finally:
        db.close_connection()


# ==========================================
# ENDPOINT: AGREGAR UN NUEVO ROL
# ==========================================
@roles_routes.route('/api/add-roles', methods=['POST'])
def add_roles():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401
    
    json_token = validation.get('payload') 
    admin_id = json_token.get("user_id") # Extraemos ID para la Bitácora

    if json_token.get("role") != 1: 
        return jsonify({'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}), 403
    
    data = request.get_json()
    nombre_rol = data.get('nombre_rol')

    if not nombre_rol or str(nombre_rol).strip() == '':
        return jsonify({'success': False, 'message': 'Debe ingresar el nombre del rol.'})

    nombre_rol = nombre_rol.upper().strip()
    accion = f"CREACIÓN DE NUEVO ROL: {nombre_rol}"

    try:
        db.create_connection()

        # Verificar si el rol ya existe
        check_query = f"SELECT 1 FROM {Config.SCHEMA}.{Config.T_ROL} WHERE nombre_rol = %s LIMIT 1"
        result = db.execute_query(check_query, (nombre_rol,), fetchone=True)

        if result:
            return jsonify({'success': False, 'message': 'El rol ya se encuentra registrado.'})

        # Insertar nuevo rol
        insert_query = f"INSERT INTO {Config.SCHEMA}.{Config.T_ROL} (nombre_rol) VALUES (%s)"
        ra = db.execute_query(insert_query, (nombre_rol,), commit=True)
        
        if ra < 1:
            return jsonify({'success': False, 'message': 'Hubo un problema al registrar el rol.'})
        
        # Registro en Bitácora
        try:
            db.insert_log(accion=accion, id_user=admin_id)
        except Exception as log_error:
            print(f"Advertencia Log: {log_error}")

        return jsonify({'success': True, 'message': 'Rol agregado exitosamente.'})

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({'success': False, 'message': f'ERROR: {e}'})
    finally:
        db.close_connection()


# ==========================================
# ENDPOINT: ACTUALIZAR UN ROL EXISTENTE
# ==========================================
@roles_routes.route('/api/update-roles', methods=['POST'])  
def update_roles():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401
    
    json_token = validation.get('payload') 
    admin_id = json_token.get("user_id")

    if json_token.get("role") != 1: 
        return jsonify({'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}), 403
    
    data = request.get_json()
    id_rol = data.get("id")
    nombre_rol = data.get("nombre_rol")

    if not id_rol or not nombre_rol or str(nombre_rol).strip() == '': 
        return jsonify({'success': False, 'message': 'Debe enviar el ID y el nuevo nombre del rol.'})

    nombre_rol = nombre_rol.upper().strip()
    accion = f"ACTUALIZACIÓN DE ROL ID {id_rol} A: {nombre_rol}"

    try:
        db.create_connection()

        update_query = f"UPDATE {Config.SCHEMA}.{Config.T_ROL} SET nombre_rol = %s WHERE id = %s"
        update_result = db.execute_query(update_query, (nombre_rol, id_rol), commit=True)
        
        if update_result < 1:
            return jsonify({'success': False, 'message': 'Rol no encontrado o el nombre es idéntico al actual.'})
            
        # Registro en Bitácora
        try:
            db.insert_log(accion=accion, id_user=admin_id)
        except Exception as log_error:
            print(f"Advertencia Log: {log_error}")

        return jsonify({'success': True, 'message': 'Rol actualizado exitosamente.'})

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({'success': False, 'message': f'ERROR: {e}'})
    finally:
        db.close_connection()


# ==========================================
# ENDPOINT: ELIMINAR UN ROL
# ==========================================
@roles_routes.route('/api/delete-roles', methods=['POST'])
def delete_roles():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401

    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation['success']:
        return jsonify({'success': False, 'message': 'Usuario No Autenticado.'}), 401
    
    json_token = validation.get('payload') 
    admin_id = json_token.get("user_id")

    if json_token.get("role") != 1: 
        return jsonify({'success': False, 'message': 'Acceso denegado. Se requieren permisos de Administrador.'}), 403
    
    data = request.get_json()
    id_rol = data.get("id")

    if not id_rol: 
        return jsonify({'success': False, 'message': 'Debe seleccionar un rol para eliminar.'})

    # MEGA PROTECCIÓN: Evitar que borren el rol 1 (Administrador) desde Postman o similares
    if id_rol == 1:
        return jsonify({'success': False, 'message': 'Acción bloqueada: No se puede eliminar el rol raíz del sistema.'}), 403

    accion = f"ELIMINACIÓN DE ROL ID: {id_rol}"

    try:
        db.create_connection()

        delete_query = f"DELETE FROM {Config.SCHEMA}.{Config.T_ROL} WHERE id = %s"
        delete_result = db.execute_query(delete_query, (id_rol,), commit=True)
        
        if delete_result < 1:
            return jsonify({'success': False, 'message': 'Rol no encontrado.'})
        
        # Registro en Bitácora
        try:
            db.insert_log(accion=accion, id_user=admin_id)
        except Exception as log_error:
            print(f"Advertencia Log: {log_error}")

        return jsonify({'success': True, 'message': 'Rol eliminado exitosamente.'})

    except Exception as e:
        print(f'ERROR: {e}')
        # Si falla por Foreign Key constraint (ej. hay usuarios usando este rol)
        if "violates foreign key constraint" in str(e).lower() or "llave foránea" in str(e).lower():
            return jsonify({'success': False, 'message': 'No se puede eliminar el rol porque hay usuarios asignados a él.'})
        return jsonify({'success': False, 'message': f'ERROR: {e}'})
    finally:
        db.close_connection()