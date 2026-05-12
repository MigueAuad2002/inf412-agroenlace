from ..repositories import audit_repo
from ..config import db

def fetch_audit_logs():
    try:
        # ESTABLECER CONEXION
        db.create_connection()

        # OBTENER RESULTADOS DEL REPOSITORIO
        result = audit_repo.get_last_30_days_logs()

        data = []
        # FORMATEO DINÁMICO A DICCIONARIO
        if result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in result:
                data.append(dict(zip(columns, row)))

        return {
            'success': True,
            'message': 'Bitácora de los últimos 30 días obtenida correctamente.',
            'bitacora': data
        }, 200

    except Exception as e:
        return {
            'success': False,
            'message': f'Error al obtener la bitácora: {str(e)}'
        }, 500
    finally:
        db.close_connection()