from ..repositories import terrenos_repo
from ..config import db

def get_terrenos_list():
    try:
        db.create_connection()
        res = terrenos_repo.get_all_terrenos_db()
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
            return {'success': False, 'message': f'Falta: {f}'}, 400

    nombre = data.get('nombre_sector').upper()
    try:
        db.create_connection()
        if terrenos_repo.check_duplicate_terreno(nombre, id_admin):
            return {'success': False, 'message': 'Terreno ya registrado en tu cuenta.'}, 409
        
        ra = terrenos_repo.insert_terreno_db(nombre, data.get('tamano_hectareas'), 
                                             data.get('latitud'), data.get('longitud'), id_admin)
        if ra > 0:
            db.insert_log("REGISTRO DE NUEVO TERRENO", id_admin)
            return {'success': True, 'message': 'Terreno agregado exitosamente.'}, 201
        return {'success': False, 'message': 'Error al insertar.'}, 500
    except Exception as e:
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
        if data.get(key):
            fields.append(f"{col} = %s")
            val = data.get(key)
            params.append(val.upper() if isinstance(val, str) else val)

    if not fields:
        return {'success': False, 'message': 'No hay datos para actualizar.'}, 400

    try:
        db.create_connection()
        ra = terrenos_repo.update_terreno_dynamic_db(nro_lote, fields, params)
        if ra > 0:
            return {'success': True, 'message': 'Terreno actualizado.'}, 200
        return {'success': False, 'message': 'Sin cambios o no encontrado.'}, 404
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()

def delete_existing_terreno(nro_lote):
    if not nro_lote:
        return {'success': False, 'message': 'nro_lote requerido.'}, 400
    try:
        db.create_connection()
        ra = terrenos_repo.delete_terreno_db(nro_lote)
        if ra > 0:
            return {'success': True, 'message': 'Terreno eliminado.'}, 200
        return {'success': False, 'message': 'Terreno no encontrado.'}, 404
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close_connection()