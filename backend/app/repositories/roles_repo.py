from ..config import Config,db

def get_all_roles():
    roles_query=f"""
    SELECT id, nombre_rol
    FROM {Config.SCHEMA}.{Config.T_ROL}
    ORDER BY id ASC
    """

    roles_result=db.execute_query(roles_query,fetchall=True)

    data=[]

    if roles_result is not None and db.cur and db.cur.description:
        columns = [column[0] for column in db.cur.description]
        for row in roles_result:
            data.append(dict(zip(columns, row)))

    return data


def exist_role(nombre_rol):
    check_query=f"""
        SELECT 1
        FROM {Config.SCHEMA}.{Config.T_ROL}
        WHERE nombre_rol=%s
    """

    return db.execute_query(check_query,(nombre_rol,),fetchone=True)

def insert_new_role(nombre_rol):
    insert_query = f"INSERT INTO {Config.SCHEMA}.{Config.T_ROL} (nombre_rol) VALUES (%s)"
    ra = db.execute_query(insert_query, (nombre_rol,), commit=True)


def update_role_name(id_rol, nombre_rol):
    update_query = f"""
        UPDATE {Config.SCHEMA}.{Config.T_ROL} 
        SET nombre_rol = %s 
        WHERE id = %s
    """
    
    return db.execute_query(update_query, (nombre_rol, id_rol), commit=True)


def delete_role(id_rol):
    delete_query = f"DELETE FROM {Config.SCHEMA}.{Config.T_ROL} WHERE id = %s"
    

    return db.execute_query(delete_query, (id_rol,), commit=True)