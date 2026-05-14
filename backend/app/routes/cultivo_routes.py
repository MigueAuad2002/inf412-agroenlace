from functools import wraps
from flask import Blueprint, request, jsonify
from ..services import decode_access_token, cultivo_service

cultivo_routes = Blueprint("cultivo_routes", __name__)

ALLOWED_ROLES = [1, 2]


def admin_or_supervisor_required(func):
    """Decorator para validar token y permitir solo Administrador o Supervisor"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "No autenticado."
            }), 401

        token = auth_header.split(" ")[1]
        validation = decode_access_token(token)

        if not validation["success"]:
            return jsonify({
                "success": False,
                "message": "Token inválido o expirado."
            }), 401

        role = validation.get("payload", {}).get("role")

        try:
            role = int(role)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Rol inválido."
            }), 403

        if role not in ALLOWED_ROLES:
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Solo Administrador o Supervisor."
            }), 403

        return func(*args, **kwargs)

    return wrapper


@cultivo_routes.route("/api/get-cultivos", methods=["GET"])
@admin_or_supervisor_required
def get_cultivos():
    res, status = cultivo_service.get_cultivos_list()
    return jsonify(res), status


@cultivo_routes.route("/api/add-cultivos", methods=["POST"])
@admin_or_supervisor_required
def add_cultivos():
    res, status = cultivo_service.create_cultivo(request.get_json())
    return jsonify(res), status


@cultivo_routes.route("/api/update-cultivos", methods=["POST"])
@admin_or_supervisor_required
def update_cultivos():
    res, status = cultivo_service.modify_cultivo(request.get_json())
    return jsonify(res), status


@cultivo_routes.route("/api/delete-cultivos", methods=["POST"])
@admin_or_supervisor_required
def delete_cultivos():
    data = request.get_json()
    id_producto = data.get("id_producto") if data else None

    res, status = cultivo_service.remove_cultivo(id_producto)
    return jsonify(res), status