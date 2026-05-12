from ..repositories import ordenes_repo
from ..config import db

def get_ordenes_data():
    try:
        db.create_connection()
        result = ordenes_repo.get_all_work_orders()

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