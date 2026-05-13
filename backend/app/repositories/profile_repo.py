from ..config import Config,db

def get_profile_data(user_id):
    query=f"""
        SELECT user_name,nombre_razon_social,correo,documento_identidad,direccion,telefono,estado_cuenta,b.nombre_rol as rol, a.created_at as fecha_registro
        FROM {Config.SCHEMA}.{Config.T_USER} a
        INNER JOIN {Config.SCHEMA}.{Config.T_ROL} b ON a.id_rol =b.id
        WHERE id_usuario=%s; 
    """

    params=(user_id,)

    result= db.execute_query(query,params,fetchone=True)

    data=[]
    columns=[]
    for desc in db.cur.description:
        columns.append(desc[0])
    
    data=dict(zip(columns,result))

    return data

def update_profile_data(user_id, data, new_password_hash=None):
    #CAMPOS BASICOS A ACTUALIZAR
    query = f"""
        UPDATE {Config.SCHEMA}.{Config.T_USER}
        SET nombre_razon_social = %s, 
            correo = %s, 
            telefono = %s, 
            direccion = %s
    """
    params = [
        data.get('nombre_razon_social'),
        data.get('correo'),
        data.get('telefono'),
        data.get('direccion')
    ]

    #CONCATENAMOS SI HAY NUEVA CONTRASEÑA
    if new_password_hash:
        query += ", password_hash = %s "
        params.append(new_password_hash)

    query += " WHERE id_usuario = %s;"
    params.append(user_id)

    return db.execute_query(query, tuple(params),commit=True)