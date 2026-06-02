from ..repositories import ordenes_repo
from ..config import db

def get_ordenes_logic(user_id, role_id):
    try:
        db.create_connection()
        employee_id_filter = user_id if role_id == 3 else None
        result = ordenes_repo.get_work_orders_db(employee_id_filter)
        
        data = []
        if result:
            columns = [
                'nro_orden', 'tipo_trabajo', 'fecha_inicio', 'fecha_fin', 
                'estado', 'id_campana', 'id_supervisor', 'supervisor_username', 
                'id_empleado', 'empleado_username', 
                'reporte_texto', 'url_imagen' # AGREGAR ESTAS DOS
            ]
            for row in result:
                data.append(dict(zip(columns, row)))

        return {
            'success': True,
            'message': 'Órdenes obtenidas exitosamente.',
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
    
    # CORRECCIÓN: Si llega un string vacío "", lo convertimos a None (NULL en PostgreSQL)
    f_fin = data.get('fecha_fin')
    if not f_fin:  
        f_fin = None

    if not tipo or not f_inicio or not id_campana:
        return {'success': False, 'message': 'Faltan datos obligatorios para la orden.'}, 400

    try:
        db.create_connection()
        ra = ordenes_repo.insert_work_order_db(tipo.upper(), f_inicio, f_fin, id_campana, supervisor_id)
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


def update_work_order_by_employee(data, employee_id):
    nro_orden = data.get('nro_orden')
    estado = data.get('estado')

    # Validaciones básicas
    if not nro_orden or not estado:
        return {'success': False, 'message': 'Faltan datos obligatorios (nro_orden o estado).'}, 400

    # Limpiamos el estado para evitar errores tipográficos
    estado_limpio = str(estado).strip().upper()
    estados_permitidos = ['PENDIENTE', 'EN PROCESO', 'FINALIZADA']
    
    if estado_limpio not in estados_permitidos:
        return {'success': False, 'message': 'El estado enviado no es válido.'}, 400

    # Campos opcionales
    reporte = data.get('reporte_texto', None)
    url_img = data.get('url_imagen', None)
    url_audio = data.get('url_audio', None)

    try:
        db.create_connection()
        
        filas_afectadas = ordenes_repo.update_orden_empleado_db(
            nro_orden, employee_id, estado_limpio, reporte, url_img, url_audio
        )
        
        if filas_afectadas > 0:
            db.insert_log(f"EMPLEADO {employee_id} ACTUALIZÓ ORDEN #{nro_orden} A {estado_limpio}", employee_id)
            return {'success': True, 'message': 'Orden actualizada correctamente.'}, 200
            
        return {
            'success': False, 
            'message': 'No se pudo actualizar. Verifique que la orden exista y le haya sido asignada a usted.'
        }, 404
        
    except Exception as e:
        return {'success': False, 'message': f'Error interno: {str(e)}'}, 500
    finally:
        db.close_connection()