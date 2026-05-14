from werkzeug.security import generate_password_hash
from ..repositories import users_repo, auth_repo # Reutilizamos check e insert de auth
from ..config import db

def get_users_list():
    try:
        db.create_connection()
        result = users_repo.get_all_users()
        
        data = []
        if result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in result:
                data.append(dict(zip(columns, row)))
        
        return {
            'success': True,
            'message': 'Usuarios obtenidos exitosamente.',
            'list_users': data
        }, 200
    except Exception as e:
        return {'success': False, 'message': f'Error: {str(e)}'}, 500
    finally:
        db.close_connection()

def create_user(data):
    required_fields = ['user', 'doc', 'name', 'mail', 'number', 'password']
    for field in required_fields:
        if field not in data or not data[field]:
            return {'success': False, 'message': f'Falta el campo: {field}'}, 400

    user_name = data.get('user').upper()
    doc = data.get('doc')
    name = data.get('name').upper()
    mail = data.get('mail').lower()
    password_hash = generate_password_hash(data.get('password'), method='pbkdf2:sha256')
    id_role = data.get('id_role', 4)    

    try:
        db.create_connection()
        if auth_repo.check_user_exists(doc, mail, user_name):
            return {'success': False, 'message': 'El usuario ya existe.'}, 409

        ra = auth_repo.insert_user(user_name, doc, name, mail, data.get('number'), 
                                   data.get('dir').upper() if data.get('dir') else None, 
                                   password_hash, id_role)
        
        if ra > 0:
            return {'success': True, 'message': 'Usuario agregado exitosamente.'}, 201
        return {'success': False, 'message': 'Error al insertar.'}, 500
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()

def remove_user(username):
    if not username:
        return {'success': False, 'message': 'Debe seleccionar un usuario.'}, 400
    try:
        db.create_connection()
        ra = users_repo.delete_user_by_username(username)
        if ra > 0:
            return {'success': True, 'message': 'Usuario eliminado.', 'filas': ra}, 200
        return {'success': False, 'message': 'Usuario no encontrado.'}, 404
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()

def modify_user(data):
    username = data.get("user")
    if not username:
        return {'success': False, 'message': 'Usuario requerido.'}, 400

    fields, params = [], []
    mappings = {
        'doc': 'documento_identidad',
        'name': 'nombre_razon_social',
        'mail': 'correo',
        'number': 'telefono',
        'dir': 'direccion',
        'id_role': 'id_rol'
    }

    for key, column in mappings.items():
        if data.get(key):
            val = data.get(key)
            fields.append(f"{column} = %s")
            params.append(val.upper() if isinstance(val, str) and key != 'mail' else val.lower() if key == 'mail' else val)

    if data.get('password'):
        fields.append("password_hash = %s")
        params.append(generate_password_hash(data.get('password'), method='pbkdf2:sha256'))

    if not fields:
        return {'success': False, 'message': 'No hay datos para actualizar.'}, 400

    try:
        db.create_connection()
        ra = users_repo.update_user_dynamic(username.upper(), fields, params)
        if ra > 0:
            return {'success': True, 'message': 'Usuario actualizado.'}, 200
        return {'success': False, 'message': 'Sin cambios o usuario no encontrado.'}, 404
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()

def get_employees_list():
    try:
        db.create_connection()
        result = users_repo.get_all_employees()
        
        data = []
        if result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in result:
                data.append(dict(zip(columns, row)))
        
        return {
            'success': True,
            'list_empleados': data
        }, 200
    except Exception as e:
        return {'success': False, 'message': f'Error: {str(e)}'}, 500
    finally:
        db.close_connection()