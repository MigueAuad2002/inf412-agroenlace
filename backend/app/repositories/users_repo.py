from ..config import Config, db

def get_all_users(id_empresa=None):
    # Se agregó a.id_empresa en el SELECT
    query = f"""
        SELECT a.id_usuario, a.user_name, a.documento_identidad, a.nombre_razon_social, a.telefono, b.nombre_rol as rol, a.id_empresa
        FROM {Config.SCHEMA}.{Config.T_USER} a
        INNER JOIN {Config.SCHEMA}.{Config.T_ROL} b ON b.id = a.id_rol
    """
    params = ()
    
    # Condicional Multi-tenant
    if id_empresa:
        query += " WHERE a.id_empresa = %s"
        params = (id_empresa,)
        
    return db.execute_query(query, params, fetchall=True)

def delete_user_by_username(username):
    query = f"DELETE FROM {Config.SCHEMA}.{Config.T_USER} WHERE user_name = %s"
    return db.execute_query(query, (username,), commit=True)

def update_user_dynamic(username, fields, params):
    set_clause = ", ".join(fields)
    query = f"""
        UPDATE {Config.SCHEMA}.{Config.T_USER}
        SET {set_clause}
        WHERE user_name = %s
    """
    # Agregamos el username al final de la tupla de parámetros
    return db.execute_query(query, tuple(params + [username]), commit=True)

def get_all_employees(id_empresa=None):
    query = f"""
        SELECT id_usuario, user_name, nombre_razon_social, id_empresa
        FROM {Config.SCHEMA}.{Config.T_USER}
        WHERE id_rol = 3
    """
    params = []
    
    # Condicional Multi-tenant: usamos AND porque ya hay un WHERE
    if id_empresa:
        query += " AND id_empresa = %s"
        params.append(id_empresa)
        
    # Usamos tuple(params) porque execute_query suele esperar una tupla
    return db.execute_query(query, tuple(params) if params else None, fetchall=True)