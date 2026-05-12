from ..config import Config, db

def get_last_30_days_logs():
    query = f"""
        SELECT A.NRO, A.fecha_hora, A.accion, B.user_name
        FROM {Config.SCHEMA}.{Config.T_BITACORA} A
        INNER JOIN {Config.SCHEMA}.{Config.T_USER} B 
            ON A.id_usuario = B.id_usuario
        WHERE A.fecha_hora >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY A.fecha_hora DESC
    """
    return db.execute_query(query, fetchall=True)