from ..config import Config, db

def get_all_work_orders():
    query = f"""
        SELECT 
            o.nro_orden,
            o.tipo_trabajo,
            o.fecha_inicio,
            o.fecha_fin,
            o.fecha_calculo,
            o.estado,
            o.id_campana,
            o.id_supervisor,
            us.user_name AS supervisor_username,
            o.id_empleado,
            ue.user_name AS empleado_username
        FROM {Config.SCHEMA}.{Config.T_ORDEN} o
        LEFT JOIN {Config.SCHEMA}.{Config.T_USER} us
            ON us.id_usuario = o.id_supervisor
        LEFT JOIN {Config.SCHEMA}.{Config.T_USER} ue
            ON ue.id_usuario = o.id_empleado
    """
    return db.execute_query(query, fetchall=True)