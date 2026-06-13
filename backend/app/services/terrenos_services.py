# app/services/terrenos_service.py
from app.repos import terrenos_repos
from app.classes.postgre import PostgreSQL

def get_terrenos_list():
    db = PostgreSQL()
    try:
        db.create_connection()
        res = terrenos_repos.get_all_terrenos_db(db)
        
        data = []
        if res is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in res:
                data.append(dict(zip(columns, row)))
                
        return {'success': True, 'list_terrenos': data}, 200
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()


def add_new_terreno(data, id_admin):
    required = ['nombre_sector', 'tamano_hectareas', 'latitud', 'longitud']
    for f in required:
        if not data.get(f):
            return {'success': False, 'message': f'Falta el campo: {f}'}, 400

    nombre = data.get('nombre_sector').upper()
    db = PostgreSQL()
    
    try:
        db.create_connection()
        
        if terrenos_repos.check_duplicate_terreno(db, nombre, id_admin):
            return {'success': False, 'message': 'Terreno ya registrado en tu cuenta.'}, 409
        
        ra = terrenos_repos.insert_terreno_db(
            db, nombre, data.get('tamano_hectareas'), 
            data.get('latitud'), data.get('longitud'), id_admin
        )
        
        if ra and ra > 0:
            db.insert_log(accion="REGISTRO DE NUEVO TERRENO", id_user=id_admin)
            db.conn.commit() # Confirmamos inserción y log juntos
            return {'success': True, 'message': 'Terreno agregado exitosamente.'}, 201
            
        raise Exception('Error al insertar el terreno en la base de datos.')
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()


def update_existing_terreno(data):
    nro_lote = data.get('nro_lote')
    if not nro_lote:
        return {'success': False, 'message': 'nro_lote requerido.'}, 400

    fields, params = [], []
    mappings = {
        'nombre_sector': 'nombre_sector',
        'tamano_hectareas': 'tamano_hectareas',
        'latitud': 'latitud',
        'longitud': 'longitud',
        'estado': 'estado',
        'id_usuario': 'id_usuario'
    }

    for key, col in mappings.items():
        if data.get(key) is not None:
            fields.append(f"{col} = %s")
            val = data.get(key)
            params.append(val.upper() if isinstance(val, str) else val)

    if not fields:
        return {'success': False, 'message': 'No hay datos para actualizar.'}, 400

    db = PostgreSQL()
    try:
        db.create_connection()
        ra = terrenos_repos.update_terreno_dynamic_db(db, nro_lote, fields, params)
        
        if ra and ra > 0:
            db.conn.commit() # Confirmamos actualización
            return {'success': True, 'message': 'Terreno actualizado.'}, 200
            
        return {'success': False, 'message': 'Sin cambios o terreno no encontrado.'}, 404
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()


def delete_existing_terreno(nro_lote):
    if not nro_lote:
        return {'success': False, 'message': 'nro_lote requerido.'}, 400
        
    db = PostgreSQL()
    try:
        db.create_connection()
        ra = terrenos_repos.delete_terreno_db(db, nro_lote)
        
        if ra and ra > 0:
            db.conn.commit() # Confirmamos eliminación
            return {'success': True, 'message': 'Terreno eliminado.'}, 200
            
        return {'success': False, 'message': 'Terreno no encontrado.'}, 404
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()