from ..config import Config, db

def get_all_campanias():
    # EXTRAER CAMPANAS CON SECTOR DEL TERRENO Y NOMBRE DEL PROPIETARIO
    campanias_query = f"""
        SELECT
            C.ID_CAMPANA,
            C.NOMBRE_CAMPANA,
            C.VARIEDAD,
            C.FECHA_SIEMBRA,
            C.FECHA_COSECHA,
            C.ESTADO,
            C.RENDIMIENTO_ESTIMADO,
            C.RENDIMIENTO_REAL,
            C.NRO_LOTE,
            T.NOMBRE_SECTOR,
            U.ID_USUARIO,
            U.USER_NAME
        FROM {Config.SCHEMA}.{Config.T_CAMPANA} C
        INNER JOIN {Config.SCHEMA}.{Config.T_TERRENO} T
            ON C.NRO_LOTE = T.NRO_LOTE
        INNER JOIN {Config.SCHEMA}.{Config.T_USER} U
            ON U.ID_USUARIO = T.ID_USUARIO
    """
    
    campanias_result = db.execute_query(campanias_query, fetchall=True)

    data = []
    
    if campanias_result is not None and db.cur and db.cur.description:
        columns = [column[0] for column in db.cur.description]
        for row in campanias_result:
            data.append(dict(zip(columns, row)))

    return data

def check_campania_exists(nombre_campana, nro_lote):
    check_query = f"""
        SELECT 1
        FROM {Config.SCHEMA}.{Config.T_CAMPANA}
        WHERE nombre_campana = %s AND nro_lote = %s
        LIMIT 1
    """
    check_params = (nombre_campana, nro_lote)
    return db.execute_query(check_query, check_params, fetchone=True)

def insert_campania(nombre_campana, variedad, fecha_siembra, fecha_cosecha, estado, rendimiento_estimado, rendimiento_real, nro_lote):
    insert_query = f"""
        INSERT INTO {Config.SCHEMA}.{Config.T_CAMPANA}
        (nombre_campana, variedad, fecha_siembra, fecha_cosecha, estado, rendimiento_estimado, rendimiento_real, nro_lote)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    insert_params = (
        nombre_campana, variedad, fecha_siembra, fecha_cosecha,
        estado, rendimiento_estimado, rendimiento_real, nro_lote
    )
    
    return db.execute_query(insert_query, insert_params, commit=True)

def update_campania_data(set_clause, params):
    """
    Ejecuta una actualización dinámica basada en los campos enviados.
    """
    update_query = f"""
        UPDATE {Config.SCHEMA}.{Config.T_CAMPANA}
        SET {set_clause}
        WHERE id_campana = %s
    """
    
    return db.execute_query(update_query, tuple(params), commit=True)

def delete_campania_from_db(id_campana):
    """
    Elimina el registro de la campaña por su ID.
    """
    delete_query = f"""
        DELETE FROM {Config.SCHEMA}.{Config.T_CAMPANA}
        WHERE id_campana = %s
    """
    
    return db.execute_query(delete_query, (id_campana,), commit=True)