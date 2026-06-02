from .config import Config
from flask import Flask
from flask_cors import CORS 
from .routes import main_routes,auth_routes,users_routes,ordenes_routes,pedidos_routes,terrenos_routes,campanias_routes, audit_routes,roles_routes,profile_routes,maquinaria_routes, cultivo_routes,prediccion_routes,empresas_routes, crm_routes,backup_routes


def create_app():
    app=Flask(__name__)

    app.config.from_object(Config)

    app.register_blueprint(main_routes) 
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
    app.register_blueprint(backup_routes)
    app.register_blueprint(pedidos_routes)
    app.register_blueprint(crm_routes)
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 

    return app