from ..repositories import profile_repo
from ..config import db
from .aux_functs import decode_access_token
from werkzeug.security import generate_password_hash


def fetch_profile_data(auth_header:str)->tuple[dict,int]:
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success':False, 'message':'Usuario No Autenticado.'},401
    
    token=auth_header.split(" ")[1]
    validation=decode_access_token(token)

    if not validation["success"]:
        return {'success':False,'message':'Usuario No Autenticado.'},401
    
    json_token = validation.get('payload') 
    id_usuario=json_token.get('user_id')
    
    try:
        db.create_connection()
        
        #OBTENER DATOS DE PERFIL DESDE LA DB
        data = profile_repo.get_profile_data(id_usuario)

        return {
            'success': True,
            'message': 'Datos de Perfil Obtenidos Exitosamente.',
            'data': data
        }, 200

    except Exception as e:
        print(f'ERROR en fetch_profile_data: {e}')
        return {'success': False, 'message': f'ERROR: {str(e)}'}, 500
        
    finally:
        db.close_connection()

def modify_profile_data(auth_header: str, data: dict) -> tuple[dict, int]:
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'success': False, 'message': 'Usuario No Autenticado.'}, 401
    
    token = auth_header.split(" ")[1]
    validation = decode_access_token(token)

    if not validation["success"]:
        return {'success': False, 'message': 'Sesión inválida o expirada.'}, 401
    
    id_usuario = validation.get('payload').get('user_id')
    
    try:
        db.create_connection()
        

        new_pw_hash = None
        if data.get('newPassword'):
            if data.get('newPassword') != data.get('confirmPassword'):
                return {'success': False, 'message': 'Las nuevas contraseñas no coinciden.'}, 400
            new_pw_hash = generate_password_hash(password=data.get('newPassword'),method='pbkdf2:sha256')

        #LLAMAR A LA FUNCION DE REPO PARA ACTUALIZAR EL USUARIO
        result=profile_repo.update_profile_data(id_usuario, data, new_pw_hash)

        if result<1:
            return {
                'success':False,
                'message':'Ocurrio un Problema al Actualizar tu Usuario.'
            },400

        return {
            'success': True,
            'message': 'Perfil actualizado correctamente.'
        }, 200

    except Exception as e:
        print(f'ERROR en modify_profile_data: {e}')
        return {'success': False, 'message': f'Error al actualizar: {str(e)}'}, 500
        
    finally:
        db.close_connection()