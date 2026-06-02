from ..config import Config, db

SCHEMA = Config.SCHEMA

def get_historial_by_maquina(nro_maquina):
    query = f"""
        SELECT ot.nro_orden, om.nro_maquina, ot.tipo_trabajo,
               ot.reporte_texto AS descripcion, ot.fecha_inicio, ot.fecha_fin,
               ot.estado, ot.id_supervisor, ot.id_empleado, om.detalle AS observaciones
        FROM {SCHEMA}.orden_trabajo ot
        JOIN {SCHEMA}.orden_maquinaria om ON ot.nro_orden = om.nro_orden
        WHERE ot.tipo_trabajo LIKE 'MANTENIMIENTO_%%'
          AND om.nro_maquina = %s
        ORDER BY ot.fecha_inicio DESC;
    """
    result = db.execute_query(query, (nro_maquina,), fetchall=True)
    if not result:
        return []
    columns = [desc[0] for desc in db.cur.description]
    return [dict(zip(columns, row)) for row in result]

def get_all_historial():
    query = f"""
        SELECT ot.nro_orden, om.nro_maquina, m.placa, m.modelo,
               ot.tipo_trabajo, ot.reporte_texto AS descripcion,
               ot.fecha_inicio, ot.fecha_fin, ot.estado,
               ot.id_supervisor, ot.id_empleado, om.detalle AS observaciones
        FROM {SCHEMA}.orden_trabajo ot
        JOIN {SCHEMA}.orden_maquinaria om ON ot.nro_orden = om.nro_orden
        JOIN {SCHEMA}.maquinaria m ON om.nro_maquina = m.nro_maquina
        WHERE ot.tipo_trabajo LIKE 'MANTENIMIENTO_%%'
        ORDER BY ot.fecha_inicio DESC;
    """
    result = db.execute_query(query, fetchall=True)
    if not result:
        return []
    columns = [desc[0] for desc in db.cur.description]
    return [dict(zip(columns, row)) for row in result]

def get_historial_by_id(nro_orden):
    query = f"""
        SELECT ot.nro_orden, om.nro_maquina, ot.tipo_trabajo,
               ot.reporte_texto AS descripcion, ot.fecha_inicio, ot.fecha_fin,
               ot.estado, ot.id_supervisor, ot.id_empleado, om.detalle AS observaciones
        FROM {SCHEMA}.orden_trabajo ot
        JOIN {SCHEMA}.orden_maquinaria om ON ot.nro_orden = om.nro_orden
        WHERE ot.nro_orden = %s
          AND ot.tipo_trabajo LIKE 'MANTENIMIENTO_%%';
    """
    return db.execute_query(query, (nro_orden,), fetchone=True)

def add_historial(data, supervisor_id):
    tipo = 'MANTENIMIENTO_' + data.get('tipo_mant', '').upper()

    query_orden = f"""
        INSERT INTO {SCHEMA}.orden_trabajo
        (tipo_trabajo, fecha_inicio, fecha_fin, estado, id_supervisor, id_empleado, reporte_texto)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING nro_orden;
    """
    params_orden = (
        tipo,
        data.get('fecha_inicio'),
        data.get('fecha_fin'),
        data.get('estado', 'COMPLETADO'),
        supervisor_id,
        data.get('id_empleado'),
        data.get('descripcion'),
    )
    # commit=False mantiene la transacción abierta para el segundo INSERT
    result = db.execute_query(query_orden, params_orden, fetchone=True, commit=False)
    nro_orden = result[0] if result else None

    query_maquina = f"""
        INSERT INTO {SCHEMA}.orden_maquinaria (nro_orden, nro_maquina, detalle)
        VALUES (%s, %s, %s);
    """
    db.execute_query(query_maquina, (nro_orden, data.get('nro_maquina'), data.get('observaciones')), commit=True)

    return nro_orden

def update_historial(nro_orden, data):
    tipo = 'MANTENIMIENTO_' + data.get('tipo_mant', '').upper()
    query = f"""
        UPDATE {SCHEMA}.orden_trabajo
        SET tipo_trabajo = %s, reporte_texto = %s,
            fecha_inicio = %s, fecha_fin = %s, estado = %s, id_empleado = %s
        WHERE nro_orden = %s;
    """
    params = (
        tipo,
        data.get('descripcion'),
        data.get('fecha_inicio'),
        data.get('fecha_fin'),
        data.get('estado'),
        data.get('id_empleado'),
        nro_orden,
    )
    return db.execute_query(query, params, commit=True)

def update_detalle_maquina(nro_orden, observaciones):
    query = f"""
        UPDATE {SCHEMA}.orden_maquinaria
        SET detalle = %s
        WHERE nro_orden = %s;
    """
    return db.execute_query(query, (observaciones, nro_orden), commit=True)

def delete_historial(nro_orden):
    # orden_maquinaria se elimina primero por integridad referencial
    db.execute_query(
        f"DELETE FROM {SCHEMA}.orden_maquinaria WHERE nro_orden = %s;",
        (nro_orden,), commit=False
    )
    return db.execute_query(
        f"DELETE FROM {SCHEMA}.orden_trabajo WHERE nro_orden = %s;",
        (nro_orden,), commit=True
    )

def maquina_exists(nro_maquina):
    query = f"SELECT nro_maquina FROM {SCHEMA}.maquinaria WHERE nro_maquina = %s;"
    return db.execute_query(query, (nro_maquina,), fetchone=True)
