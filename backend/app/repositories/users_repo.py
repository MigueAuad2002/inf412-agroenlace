from ..config import Config, db

def get_all_users():
    query = f"""
        SELECT id_usuario, user_name, documento_identidad, nombre_razon_social, telefono, b.nombre_rol as rol
        FROM {Config.SCHEMA}.{Config.T_USER} a
        INNER JOIN {Config.SCHEMA}.{Config.T_ROL} b ON b.id = a.id_rol
    """
    return db.execute_query(query, fetchall=True)

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


def get_all_employees():
    query = f"""
        SELECT id_usuario, user_name, nombre_razon_social
        FROM {Config.SCHEMA}.{Config.T_USER}
        WHERE id_rol = 3
    """
    return db.execute_query(query, fetchall=True)