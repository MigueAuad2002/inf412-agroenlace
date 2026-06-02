from werkzeug.security import generate_password_hash,check_password_hash
from ..repositories import auth_repo
from ..config import db
from .aux_functs import create_access_token

def register_new_user(data:dict)->tuple[dict,int]:
    #VALIDACION: SELECCIONAR CAMPOS REQUERIDOS PARA EL REGISTRO
    required_fields=['user','doc','name','mail','number','password']

    for field in required_fields:
        if field not in data:
            return {
                'success':False,
                'message': 'Debe Ingresar Todos los Campos Requeridos'
                },400
        
    #ORGANIZAR TODOS LO PARAMETROS
    user_name=data.get('user').upper()
    doc=data.get('doc')
    name=data.get('name').upper()
    mail=data.get('mail').lower()
    number=data.get('number')
    direction=data.get('dir')
    password=data.get('password')
    id_role=4 #ROL NRO.4 =CLIENTE

    accion='REGISTRO DE USUARIO'

    if direction:
        direction=direction.upper()

    try:
        db.create_connection()

        if auth_repo.check_user_exists(doc, mail, user_name):
            return {'success': False, 'message': 'El usuario ya se encuentra registrado.'}, 409

        #ENCRIPTAR CONTRASEÑA
        password_hash = generate_password_hash(password=password, method='pbkdf2:sha256')  

        #INSERTAR USUARIO A LA BASE DE DATOS
        filas_afectadas = auth_repo.insert_user(
            user=user_name, 
            doc=doc, 
            name=name, 
            mail=mail, 
            number=number, 
            direction=direction, 
            password_hash=password_hash, 
            id_role=id_role
        )
            
        if filas_afectadas < 1:
            return {'success': False, 'message': 'Hubo un problema al registrar el usuario'}, 500
            
        new_user_row = auth_repo.get_user_id_by_username(user_name)
        
        if new_user_row:
                
            new_user_id = new_user_row[0] 
            
            db.insert_log(accion=accion, id_user=new_user_id)
            
        return {'success': True, 'message': 'Usuario Registrado Exitosamente'}, 201
        

    except Exception as e:
        return {
                'success':False,
                'message':str(e)
            },500
    finally:
        db.close_connection()


def validate_user(data:dict)->tuple[dict,int]:
    user_input=data.get('user_input').upper()
    password=data.get('password')
    accion='INICIO DE SESION'

    if not user_input or not password:
        return {'success':False,'message':'Debe Ingresar Correo y Contraseña'},400

    try:
        #ESTABLECER CONEXION A LA BASE DE DATOS
        db.create_connection()

        result=auth_repo.extract_login_user(user_input=user_input)

        if not result:
            return {
                'success':False,
                'message':'El Usuario Ingresado No Existe'
            },404
        
        #ORGANIZAR LOS DATOS DE LA DB
        user_id=result[0]
        user_name=result[1]
        password_hash=result[2]
        name=result[3]
        mail=result[4]
        role_id=result[5]
        account_stat=result[6]
        id_empresa=result[7]

        #INICIO DE SESION FALLIDO: CUENTA SUSPENDIDA
        if account_stat!='ACTIVO':
            return {
                'success':False,
                'message':'La cuenta se encuentra Inactiva o Suspendida.'
            },403
        
        #INICIO DE SESION FALLIDO: CONTRASEÑA INCORRECTA
        if not check_password_hash(password_hash,password):
            return {
                'success':False,
                'message':'Contraseña Incorrecta.'
            },401
        
        db.insert_log(accion=accion,id_user=user_id)
        #print(rl)

        #INICIO DE SESION EXITOSO: GENERAR TOKEN JWT
        token=create_access_token(
            user_id=user_id,
            user_name=user_name,
            role=role_id,
            id_tenant=id_empresa,
            name=name)
        
        print(f"Login exitoso para el usuario: {user_name}")
        return {
            'success':True,
            'message':'Inicio de Sesion Exitoso',
            'access_token':token,
            'user':{
                'id_usuario':user_id,
                'nombre_razon_social':name,
                'correo':mail,
                'id_rol':role_id,
                'id_empresa':id_empresa
            }
        },200

    except Exception as e:
        return {
            'success':False,
            'message':f'ERROR : {e}',
        },500
    finally:
        db.close_connection()