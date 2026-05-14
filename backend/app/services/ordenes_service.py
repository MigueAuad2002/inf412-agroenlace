from ..repositories import ordenes_repo
from ..config import db

def get_ordenes_logic(user_id, role_id):
    try:
        db.create_connection()
        
        # Si es Empleado (Rol 3), filtramos por su ID.
        # Si es Admin (1) o Supervisor (2), pasamos None para que traiga todo.
        employee_id_filter = user_id if role_id == 3 else None
        
        result = ordenes_repo.get_work_orders_db(employee_id_filter)
        
        data = []
        if result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in result:
                data.append(dict(zip(columns, row)))

        return {
            'success': True,
            'message': 'Órdenes de trabajo obtenidas exitosamente.',
            'list_ordenes': data
        }, 200

    except Exception as e:
        return {
            'success': False,
            'message': f'Error en el servidor: {str(e)}'
        }, 500
    finally:
        db.close_connection()

def create_work_order(data, supervisor_id):
    tipo = data.get('tipo_trabajo')
    f_inicio = data.get('fecha_inicio')
    id_campana = data.get('id_campana')

    if not tipo or not f_inicio or not id_campana:
        return {'success': False, 'message': 'Faltan datos obligatorios para la orden.'}, 400

    try:
        db.create_connection()
        ra = ordenes_repo.insert_work_order_db(tipo.upper(), f_inicio, data.get('fecha_fin'), id_campana, supervisor_id)
        if ra > 0:
            db.insert_log(f"CREÓ ORDEN DE TRABAJO: {tipo.upper()}", supervisor_id)
            return {'success': True, 'message': 'Orden creada exitosamente.'}, 201
        return {'success': False, 'message': 'No se pudo insertar la orden.'}, 500
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()

def assign_responsible_to_order(data, supervisor_id):
    nro_orden = data.get('nro_orden')
    id_empleado = data.get('id_empleado')

    if not nro_orden or not id_empleado:
        return {'success': False, 'message': 'Faltan datos (nro_orden o id_empleado)'}, 400

    try:
        db.create_connection()
        ra = ordenes_repo.assign_employee_db(nro_orden, id_empleado)
        if ra > 0:
            db.insert_log(f"ASIGNÓ EMPLEADO {id_empleado} A ORDEN {nro_orden}", supervisor_id)
            return {'success': True, 'message': 'Responsable asignado correctamente.'}, 200
        return {'success': False, 'message': 'Orden no encontrada.'}, 404
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()

def remove_work_order(data, supervisor_id):
    nro_orden = data.get('nro_orden')

    if not nro_orden:
        return {'success': False, 'message': 'Debe proporcionar el nro_orden.'}, 400

    try:
        db.create_connection()
        ra = ordenes_repo.delete_work_order_db(nro_orden)
        
        if ra > 0:
            db.insert_log(f"ELIMINÓ ORDEN DE TRABAJO NRO: {nro_orden}", supervisor_id)
            return {'success': True, 'message': 'Orden eliminada exitosamente.'}, 200
            
        return {'success': False, 'message': 'La orden no existe o ya fue eliminada.'}, 404
        
    except Exception as e:
        return {'success': False, 'message': f'Error: {str(e)}'}, 500
    finally:
        db.close_connection()