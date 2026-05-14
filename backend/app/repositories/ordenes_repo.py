from ..config import Config, db

def get_work_orders_db(employee_id=None):
    """Consulta órdenes. Si recibe employee_id, filtra solo las de ese empleado."""
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
    
    params = ()
    if employee_id:
        query += " WHERE o.id_empleado = %s"
        params = (employee_id,)
        
    query += " ORDER BY o.nro_orden DESC"
    
    return db.execute_query(query, params, fetchall=True)

def insert_work_order_db(tipo, f_inicio, f_fin, id_campana, id_sup):
    query = f"""
        INSERT INTO {Config.SCHEMA}.{Config.T_ORDEN} 
        (tipo_trabajo, fecha_inicio, fecha_fin, estado, id_campana, id_supervisor)
        VALUES (%s, %s, %s, 'PENDIENTE', %s, %s)
    """
    params = (tipo, f_inicio, f_fin, id_campana, id_sup)
    return db.execute_query(query, params, commit=True)

def assign_employee_db(nro_orden, id_empleado):
    query = f"UPDATE {Config.SCHEMA}.{Config.T_ORDEN} SET id_empleado = %s WHERE nro_orden = %s"
    return db.execute_query(query, (id_empleado, nro_orden), commit=True)

def delete_work_order_db(nro_orden):
    query = f"DELETE FROM {Config.SCHEMA}.{Config.T_ORDEN} WHERE nro_orden = %s"
    return db.execute_query(query, (nro_orden,), commit=True)