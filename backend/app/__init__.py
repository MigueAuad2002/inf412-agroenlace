from .config import Config
from flask import Flask
from flask_cors import CORS 
from app.routes import main_routes,audit_routes,crm_routes,pedidos_routes,profile_routes,mant_maquinaria_routes,prediccion_routes,ordenes_routes,cultivos_routes,roles_routes,auth_routes,users_routes,terrenos_routes,empresas_routes,campanias_routes,maquinarias_routes


def create_app():
    app=Flask(__name__)

    app.config.from_object(Config)


    app.register_blueprint(main_routes.router)
    app.register_blueprint(auth_routes.router)
    app.register_blueprint(users_routes.router)
    app.register_blueprint(terrenos_routes.router)
    app.register_blueprint(empresas_routes.router)
    app.register_blueprint(campanias_routes.router)
    app.register_blueprint(maquinarias_routes.router)
    app.register_blueprint(roles_routes.router)
    app.register_blueprint(cultivos_routes.router)
    app.register_blueprint(prediccion_routes.router)
    app.register_blueprint(ordenes_routes.router)
    app.register_blueprint(mant_maquinaria_routes.router)
    app.register_blueprint(profile_routes.router)
    app.register_blueprint(pedidos_routes.router)
    app.register_blueprint(crm_routes.router)
    app.register_blueprint(audit_routes.router)


    """
    app.register_blueprint(auth_routes)
    app.register_blueprint(users_routes)
    app.register_blueprint(audit_routes)
    app.register_blueprint(ordenes_routes)
    app.register_blueprint(terrenos_routes)
    app.register_blueprint(campanias_routes)
    app.register_blueprint(roles_routes)
    app.register_blueprint(profile_routes)
    app.register_blueprint(maquinaria_routes)
    app.register_blueprint(cultivo_routes)
    app.register_blueprint(prediccion_routes)
    app.register_blueprint(empresas_routes)
    app.register_blueprint(mant_maquinaria_routes)
    app.register_blueprint(backup_routes)
    app.register_blueprint(pedidos_routes)
    app.register_blueprint(crm_routes)"""
    
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 

    return app