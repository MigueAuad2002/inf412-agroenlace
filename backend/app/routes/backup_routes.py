import io
from flask import Blueprint, jsonify, send_file
from ..services import backup_service
from .empresas_routes import admin_required 

backup_routes = Blueprint('backup_routes', __name__)

@backup_routes.route('/api/backup/manual', methods=['GET'])
@admin_required
def manual_backup():
    res, status = backup_service.generar_backup_bd_memoria()
    
    if res.get('success'):
        #CONVERTIMOS LA SALIDA EN UN ARCHIVO
        buffer_memoria = io.BytesIO(res['file_bytes'])
        
        return send_file(
            buffer_memoria, 
            as_attachment=True, 
            download_name=res['file_name'],
            mimetype='application/sql'
        )
    else:
        return jsonify(res), status