from flask import Blueprint,redirect,request,jsonify
from werkzeug.security import generate_password_hash,check_password_hash

from ..config import db,Config
from ..services import create_access_token,decode_access_token

users_routes=Blueprint('users_routes',__name__)


#ENDPOINT MOSTRAR USUARIOS
@users_routes.route('/api/get-users',methods=['GET'])
def get_users():

    #OBTENER LA CABECERA DONDE SE ENVIA EL TOKEN
    auth_header=request.headers.get('Authorization')

    #SI NO CONTIENE LA CABECERA RETORNAR JSON ERROR
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success':False,
            'message':'Usuario No Autenticado.'
        }),401

    #EXTRAER EL TOKEN LIMPIO
    token = auth_header.split(" ")[1]

    #VALIDAR TOKEN
    validation=decode_access_token(token)

    #TOKEN INVALIDO ARROJAR JSON ERROR
    if not validation['success']:
        return jsonify({'success':False,'message':'Usuario No Autenticado.'}),401
    
    # VALIDACIÓN DE ROL: VERIFICAR SI ES ADMIN
    json = validation.get('payload') 
    if json["role"] != 1: 
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403
    
    #LOGICA DE EXTRACCION DE USUARIOS
    try:
        #ESTABLECER CONEXION CON LA BASE DE DATOS
        db.create_connection()

        #EXTRAER UNA LISTA DE USUARIOS CON ALGUNAS DE SUS PROPIEDADES
        users_query=f"""
            select id_usuario, user_name, documento_identidad, nombre_razon_social, telefono, b.nombre_rol as rol
            from {Config.SCHEMA}.{Config.T_USER} a
            inner join {Config.SCHEMA}.{Config.T_ROL} b on b.id = a.id_rol
        """
        users_result=db.execute_query(
            users_query,fetchall=True
        )

        data=[]
        
        # Validación de seguridad para evitar "'NoneType' object is not iterable"
        if users_result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in users_result:
                data.append(dict(zip(columns, row)))
        
        #print('DICCIONARIO')
        #print(data)

        #print('LISTA')
        #print(users_result)
        return jsonify({
            'success':True,
            'message':'Usuarios obtenidos Exitosamente.',
            'list_users':data
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success':False,
            'message':f'ERROR: {e}'
        })
    finally:
        db.close_connection()



#ENDPOINT ELIMINAR USUARIOS 
@users_routes.route('/api/delete-users',methods=['POST'])
def delete_users():

    #OBTENER LA CABECERA DONDE SE ENVIA EL TOKEN
    auth_header=request.headers.get('Authorization')

    #SI NO CONTIENE LA CABECERA RETORNAR JSON ERROR
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success':False,
            'message':'Usuario No Autenticado.'
        }),401

    #EXTRAER EL TOKEN LIMPIO
    token = auth_header.split(" ")[1]

    #VALIDAR TOKEN
    validation=decode_access_token(token)

    #TOKEN INVALIDO ARROJAR JSON ERROR
    if not validation['success']:
        return jsonify({'success':False,'message':'Usuario No Autenticado.'}),401
    
    # VALIDACIÓN DE ROL: VERIFICAR SI ES ADMIN
    json = validation.get('payload') 
    if json["role"] != 1: 
        return jsonify({
            'success': False,
            'message': 'Acceso denegado. Se requieren permisos de Administrador.'
        }), 403
    
    data  = request.get_json()
    username = data.get("user")
    if not username : 
        return jsonify({
            'success':False,
            'message':'Debe seleccionar un usuario.'
        })
    #LOGICA DE EXTRACCION DE USUARIOS
    try:
        #ESTABLECER CONEXION CON LA BASE DE DATOS
        db.create_connection()

        #CONSULTA PARA ELIMINAR UN USUARIO
        delete_query=f"""
            delete from {Config.SCHEMA}.{Config.T_USER}
            where user_name = %s
        """
        delete_params = (username, )
        delete_result=db.execute_query(
            delete_query,delete_params,commit=True
        )
        #VALIDACION SI NO SE ENCUENTRA EL USUARIO
        if delete_result <1 :
            return jsonify({
                'success':False,
                'message':'Usuario No Encontrado.'
            })
        print(delete_result)
        return jsonify({
            'success':True,
            'message':'Usuarios eliminados Exitosamente.',
            'filas_afectadas':delete_result
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success':False,
            'message':f'ERROR: {e}'
        })
    finally:
        db.close_connection()


#ENDPOINT AGREGAR USUARIOS
@users_routes.route('/api/add-users', methods=['POST'])
def add_users():

    # 1. OBTENER LA CABECERA DONDE SE ENVIA EL TOKEN
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
    
    # 2. OBTENER DATOS (JSON) DESDE EL FRONTEND
    data = request.get_json()

    # VALIDACION: SELECCIONAR CAMPOS REQUERIDOS PARA EL REGISTRO
    required_fields = ['user', 'doc', 'name', 'mail', 'number', 'password']

    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({
                'success': False,
                'message': f'Debe Ingresar Todos los Campos Requeridos. Falta: {field}'
            })

    # 3. ORGANIZAR TODOS LOS PARAMETROS
    user_name = data.get('user').upper()
    doc = data.get('doc')
    name = data.get('name').upper()
    mail = data.get('mail').lower()
    number = data.get('number')
    direction = data.get('dir')
    password = data.get('password')
    
    # Aquí puedes recibir el rol desde el frontend si el admin puede crear distintos roles,
    # o dejarlo fijo en 4 como lo tenías.
    id_role = data.get('id_role', 4) 

    if direction:
        direction = direction.upper()

    # 4. LOGICA DE BASE DE DATOS PARA AGREGAR USUARIO
    try:
        db.create_connection()

        # VERIFICAR SI EL USUARIO, DOCUMENTO O CORREO YA EXISTEN
        check_query = f"""
            SELECT 1
            FROM {Config.SCHEMA}.{Config.T_USER}
            WHERE DOCUMENTO_IDENTIDAD=%s OR CORREO=%s OR USER_NAME=%s
            LIMIT 1
        """
        check_params = (doc, mail, user_name)
        result = db.execute_query(check_query, check_params, fetchone=True)

        if result:
            return jsonify({
                'success': False, 
                'message': 'El usuario, documento o correo ya se encuentra registrado.'
            })

        # ENCRIPTAR CONTRASEÑA
        password_hash = generate_password_hash(password=password, method='pbkdf2:sha256')  

        # EJECUTAR EL INSERT DEPENDIENDO SI HAY DIRECCION O NO
        if direction:
            insert_query = f"""
                INSERT INTO {Config.SCHEMA}.{Config.T_USER} 
                (USER_NAME, PASSWORD_HASH, DOCUMENTO_IDENTIDAD, NOMBRE_RAZON_SOCIAL, DIRECCION, CORREO, TELEFONO, ID_ROL)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            insert_params = (user_name, password_hash, doc, name, direction, mail, number, id_role)
        else:
            insert_query = f"""
                INSERT INTO {Config.SCHEMA}.{Config.T_USER} 
                (USER_NAME, PASSWORD_HASH, DOCUMENTO_IDENTIDAD, NOMBRE_RAZON_SOCIAL, CORREO, TELEFONO, ID_ROL)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            insert_params = (user_name, password_hash, doc, name, mail, number, id_role)
        
        ra = db.execute_query(insert_query, insert_params, commit=True)
        
        # VALIDAR SI SE AFECTARON FILAS
        if ra < 1:
            return jsonify({
                'success': False,
                'message': 'Hubo un problema al registrar el usuario en la base de datos.'
            })
        
        print(f'Usuario Registrado Exitosamente, {ra} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Usuario agregado exitosamente.'
        })

    except Exception as e:
        print(f'ERROR: {e}')
        return jsonify({
            'success': False,
            'message': f'ERROR: {e}'
        })
    finally:
        db.close_connection()


#ENDPOINT ACTUALIZAR USUARIOS
@users_routes.route('/api/update-users', methods=['POST'])  
def update_users():

    # 1. OBTENER LA CABECERA DONDE SE ENVIA EL TOKEN
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
    
    # 2. OBTENER DATOS (JSON) DESDE EL FRONTEND
    data = request.get_json()
    username = data.get("user").upper()

    # VALIDACION: SE REQUIERE EL USUARIO PARA SABER A QUIÉN ACTUALIZAR
    if not username: 
        return jsonify({
            'success': False,
            'message': 'Debe enviar el usuario (user) que desea actualizar.'
        })

    # 3. CONSTRUCCIÓN DINÁMICA DE LA CONSULTA
    # Vamos agregando a estas listas solo los campos que vengan en el JSON
    update_fields = []
    update_params = []

    if data.get('doc'):
        update_fields.append("documento_identidad = %s")
        update_params.append(data.get('doc'))
        
    if data.get('name'):
        update_fields.append("nombre_razon_social = %s")
        update_params.append(data.get('name').upper())
        
    if data.get('mail'):
        update_fields.append("correo = %s")
        update_params.append(data.get('mail').lower())
        
    if data.get('number'):
        update_fields.append("telefono = %s")
        update_params.append(data.get('number'))
        
    if data.get('dir'):
        update_fields.append("direccion = %s")
        update_params.append(data.get('dir').upper())
        
    if data.get('id_role'):
        update_fields.append("id_rol = %s")
        update_params.append(data.get('id_role'))
        
    if data.get('password'):
        # ENCRIPTAR NUEVA CONTRASEÑA SI SE ENVÍA
        password_hash = generate_password_hash(password=data.get('password'), method='pbkdf2:sha256')
        update_fields.append("password_hash = %s")
        update_params.append(password_hash)

    # VALIDACIÓN: SI NO SE ENVIÓ NINGÚN DATO ADICIONAL AL USUARIO
    if not update_fields:
        return jsonify({
            'success': False,
            'message': 'No se enviaron datos nuevos para actualizar.'
        })

    # Agregamos el username al final de los parámetros para la cláusula WHERE
    update_params.append(username)
    
    # Unimos los campos con comas (Ejemplo resultado: "correo = %s, telefono = %s")
    set_clause = ", ".join(update_fields)

    # 4. LÓGICA DE BASE DE DATOS
    try:
        db.create_connection()

        # CONSULTA PARA ACTUALIZAR USUARIO USANDO LA VARIABLE DE ENTORNO SCHEMA
        update_query = f"""
            UPDATE {Config.SCHEMA}.{Config.T_USER}
            SET {set_clause}
            WHERE user_name = %s
        """
        
        # Ejecutar pasando la tupla de parámetros
        update_result = db.execute_query(update_query, tuple(update_params), commit=True)
        
        # VALIDACIÓN: SI NO SE ENCUENTRA EL USUARIO O SI LOS DATOS SON IDÉNTICOS
        if update_result < 1:
            return jsonify({
                'success': False,
                'message': 'Usuario no encontrado o los datos ingresados son idénticos a los actuales.'
            })
            
        print(f'Usuario Actualizado Exitosamente, {update_result} filas afectadas')
        return jsonify({
            'success': True,
            'message': 'Usuario actualizado exitosamente.',
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