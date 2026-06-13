from app.repos import maquinaria_repos
from app.classes.postgre import PostgreSQL

def fetch_maquinaria() -> tuple[dict, int]:
    db = PostgreSQL()
    try:
        db.create_connection()
        data = maquinaria_repos.get_all_maquinaria(db)
        
        # Parseo de fechas y decimales
        for item in data:
            if item.get('fecha_ult_mant'): item['fecha_ult_mant'] = str(item['fecha_ult_mant'])
            if item.get('created_at'): item['created_at'] = str(item['created_at'])
            if item.get('kilometraje'): item['kilometraje'] = float(item['kilometraje'])
            if item.get('cant_tanque_comb'): item['cant_tanque_comb'] = float(item['cant_tanque_comb'])

        return {'success': True, 'data': data}, 200
    except Exception as e:
        print(f"Error en fetch_maquinaria: {e}")
        return {'success': False, 'message': f'Error del servidor: {str(e)}'}, 500
    finally:
        db.close_connection()

def register_maquinaria(data: dict, user_id: int) -> tuple[dict, int]:
    db = PostgreSQL()
    try:
        db.create_connection()
        
        # REGLA DE NEGOCIO
        if maquinaria_repos.get_maquinaria_by_placa(db, data.get('placa')):
            return {'success': False, 'message': 'Ya existe una maquinaria con esa placa.'}, 400
        
        ra = maquinaria_repos.add_maquinaria(db, data)

        if ra and ra > 0:
            db.insert_log(accion=f"REGISTRO DE MAQUINARIA PLACA: {data.get('placa')}", id_user=user_id)
            db.conn.commit()
            return {'success': True, 'message': 'Maquinaria registrada con éxito.'}, 201
            
        raise Exception("Ocurrió un error al guardar la maquinaria en la base de datos.")
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        return {'success': False, 'message': f'Error al registrar: {str(e)}'}, 500
    finally:
        db.close_connection()

def modify_maquinaria(nro_maquina: int, data: dict, user_id: int) -> tuple[dict, int]:
    db = PostgreSQL()
    try:
        db.create_connection()
        
        if maquinaria_repos.get_maquinaria_by_placa(db, data.get('placa'), exclude_nro=nro_maquina):
            return {'success': False, 'message': 'La placa ingresada ya pertenece a otra maquinaria.'}, 400
            
        ra = maquinaria_repos.update_maquinaria(db, nro_maquina, data)
        
        if ra and ra > 0:
            db.insert_log(accion=f"ACTUALIZÓ MAQUINARIA NRO: {nro_maquina}", id_user=user_id)
            db.conn.commit()
            return {'success': True, 'message': 'Maquinaria actualizada correctamente.'}, 200
            
        return {'success': False, 'message': 'Sin cambios o maquinaria no encontrada.'}, 404
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        return {'success': False, 'message': f'Error al actualizar: {str(e)}'}, 500
    finally:
        db.close_connection()

def remove_maquinaria(nro_maquina: int, user_id: int) -> tuple[dict, int]:
    db = PostgreSQL()
    try:
        db.create_connection()
        ra = maquinaria_repos.delete_maquinaria(db, nro_maquina)
        
        if ra and ra > 0:
            db.insert_log(accion=f"ELIMINÓ MAQUINARIA NRO: {nro_maquina}", id_user=user_id)
            db.conn.commit()
            return {'success': True, 'message': 'Maquinaria eliminada correctamente.'}, 200
            
        return {'success': False, 'message': 'Maquinaria no encontrada.'}, 404
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        # Aquí saltará un error si intentas borrar una máquina que ya tiene Órdenes de Trabajo (Integridad referencial)
        if "violates foreign key constraint" in str(e).lower() or "foreign key" in str(e).lower():
            return {'success': False, 'message': 'No se puede eliminar la maquinaria porque está en uso o tiene historial.'}, 400
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()