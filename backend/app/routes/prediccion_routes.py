from flask import Blueprint, request, jsonify
from ..services import prediccion_service

prediccion_routes = Blueprint('prediccion_routes', __name__)


# GET PREDICCIÓN DE RENDIMIENTO POR CAMPAÑA
@prediccion_routes.route('/api/prediccion/campana/<int:id_campana>', methods=['GET'])
def predecir_rendimiento_campana(id_campana):
    auth_header = request.headers.get('Authorization')

    response_data, status_code = prediccion_service.predecir_rendimiento(auth_header, id_campana)

    return jsonify(response_data), status_code
