from ..config import Config, db

def get_all_empresas():
    query = f"""
        SELECT id_empresa, nombre_empresa, nit, estado, created_at 
        FROM {Config.SCHEMA}.empresa
        ORDER BY id_empresa ASC
    """
    return db.execute_query(query, fetchall=True)

def insert_empresa(nombre_empresa, nit, estado):
    query = f"""
        INSERT INTO {Config.SCHEMA}.empresa (nombre_empresa, nit, estado)
        VALUES (%s, %s, %s)
    """
    return db.execute_query(query, (nombre_empresa, nit, estado), commit=True)

def delete_empresa(id_empresa):
    query = f"DELETE FROM {Config.SCHEMA}.empresa WHERE id_empresa = %s"
    return db.execute_query(query, (id_empresa,), commit=True)

def update_empresa_dynamic(id_empresa, fields, params):
    set_clause = ", ".join(fields)
    query = f"""
        UPDATE {Config.SCHEMA}.empresa
        SET {set_clause}
        WHERE id_empresa = %s
    """
    return db.execute_query(query, tuple(params + [id_empresa]), commit=True)