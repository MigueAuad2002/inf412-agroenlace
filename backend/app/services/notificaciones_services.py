from flask_socketio import join_room

def manejar_conexion_usuario(user_id: int):
    """
    FUNCION ENCARGADA DE METER AL USUARIO A UNA SALA PROPIA.
    """
    nombre_sala = f"user_{user_id}"
    
    # join_room es una función nativa de Flask-SocketIO que agrupa esta conexión
    join_room(nombre_sala)
    
    print(f"[SOCKET SERVICE] Conexión establecida. Usuario {user_id} asignado a la sala: {nombre_sala}")
    
    return {
        "status": "connected",
        "room": nombre_sala
    }