import os
import uuid
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, send_from_directory # <-- AGREGAMOS send_from_directory
from ..services import decode_access_token, ordenes_service

ordenes_routes = Blueprint('ordenes_routes', __name__)

def token_required(func):
    """Valida token y extrae el payload. Bloquea solo al Rol 4 (Cliente)."""
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'No autenticado'}), 401
        
        val = decode_access_token(auth.split(" ")[1])
        if not val['success']:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
            
        payload = val.get('payload', {})
        rol = int(payload.get('id_rol', payload.get('role', 0)))
        
        if rol == 4:
            return jsonify({'success': False, 'message': 'Acceso denegado. Rol no autorizado.'}), 403
            
        request.user_payload = payload
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

def boss_only(func):
    """Decorador adicional: Solo permite el paso a Admin (1) y Supervisor (2)."""
    def wrapper(*args, **kwargs):
        rol = int(request.user_payload.get('id_rol', request.user_payload.get('role', 0)))
        if rol not in [1, 2]:
            return jsonify({
                'success': False, 
                'message': 'Acceso denegado. Solo Administradores o Supervisores pueden realizar esta acción.'
            }), 403
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@ordenes_routes.route('/api/get-ordenes', methods=['GET'])
@token_required
def get_ordenes():
    user_id = request.user_payload.get('id_usuario', request.user_payload.get('user_id'))
    role_id = int(request.user_payload.get('id_rol', request.user_payload.get('role', 0)))
    res, status = ordenes_service.get_ordenes_logic(user_id, role_id)
    return jsonify(res), status

@ordenes_routes.route('/api/add-orden', methods=['POST'])
@token_required
@boss_only
def add_orden():
    sup_id = request.user_payload.get('id_usuario', request.user_payload.get('user_id'))
    res, status = ordenes_service.create_work_order(request.get_json(), sup_id)
    return jsonify(res), status

@ordenes_routes.route('/api/assign-responsible', methods=['POST'])
@token_required
@boss_only
def assign_responsible():
    sup_id = request.user_payload.get('id_usuario', request.user_payload.get('user_id'))
    res, status = ordenes_service.assign_responsible_to_order(request.get_json(), sup_id)
    return jsonify(res), status

@ordenes_routes.route('/api/delete-orden', methods=['POST'])
@token_required
@boss_only
def delete_orden():
    sup_id = request.user_payload.get('id_usuario', request.user_payload.get('user_id'))
    res, status = ordenes_service.remove_work_order(request.get_json(), sup_id)
    return jsonify(res), status

@ordenes_routes.route('/api/update-mi-orden', methods=['POST'])
@token_required
def update_mi_orden():
    employee_id = request.user_payload.get('id_usuario', request.user_payload.get('user_id'))
    
    # Carpeta donde se guardarán los archivos en el servidor
    UPLOAD_FOLDER = 'app/static/uploads'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    data = {}

    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict() 
        
        # Procesar IMAGEN
        if 'imagen' in request.files:
            file = request.files['imagen']
            if file and file.filename != '':
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
                filename = f"img_{uuid.uuid4().hex}.{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                # MODIFICACIÓN: Guardamos la URL apuntando al nuevo endpoint de lectura
                data['url_imagen'] = f'/api/media/{filename}'
                
        # Procesar AUDIO
        if 'audio' in request.files:
            file = request.files['audio']
            if file and file.filename != '':
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'mp3'
                filename = f"audio_{uuid.uuid4().hex}.{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                # MODIFICACIÓN: Guardamos la URL apuntando al nuevo endpoint de lectura
                data['url_audio'] = f'/api/media/{filename}'

    elif request.is_json:
        data = request.get_json()
        
    else:
        return jsonify({'success': False, 'message': 'Formato no soportado. Use JSON o Multipart/FormData.'}), 400

    if not data:
        return jsonify({'success': False, 'message': 'Cuerpo de petición vacío.'}), 400
        
    res, status = ordenes_service.update_work_order_by_employee(data, employee_id)
    return jsonify(res), status


# =====================================================================
# NUEVO ENDPOINT: PARA LEER / MOSTRAR LAS IMÁGENES Y AUDIOS EN FRONTEND
# =====================================================================
@ordenes_routes.route('/api/media/<path:filename>', methods=['GET'])
def get_media(filename):
    """
    Este endpoint permite que React o Flutter lean los archivos.
    Ejemplo de uso en Flutter: Image.network('http://localhost:5000/api/media/img_12345.png')
    """
    # Obtenemos la ruta absoluta de donde estamos guardando los archivos
    upload_folder = os.path.join(os.getcwd(), 'app', 'static', 'uploads')
    
    # send_from_directory lee el archivo físico y lo envía como respuesta HTTP válida
    return send_from_directory(upload_folder, filename)