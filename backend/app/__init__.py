from .config import Config
from flask import Flask
<<<<<<< HEAD
from flask_cors import CORS 
from .routes import main_routes,auth_routes,users_routes,agro_routes,terrenos_routes,campanias_routes
=======
from flask_cors import CORS
from .routes import main_routes,auth_routes,users_routes,terrenos_routes,audit_routes,agro_routes
>>>>>>> 29859cf9bb313033d6b6a6501125a4493f0302ee

def create_app():
    app=Flask(__name__)

    app.config.from_object(Config)

    app.register_blueprint(main_routes)
    app.register_blueprint(auth_routes)
    app.register_blueprint(users_routes)
    app.register_blueprint(audit_routes)
    app.register_blueprint(agro_routes)
    app.register_blueprint(terrenos_routes)
    app.register_blueprint(campanias_routes)

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    return app