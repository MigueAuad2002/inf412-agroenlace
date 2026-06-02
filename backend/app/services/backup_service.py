import os
import subprocess
from datetime import datetime
from ..config import Config

def generar_backup_bd_memoria():
    try:
        #PREPARAR NOMBRE DEL ARCHIVO CON FORMATO DE FECHA HORA
        fecha_actual = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
        nombre_archivo = f"agroenlace_backup_{fecha_actual}.sql"
        
        #VARIABLES DE ENTORNO PARA LA DB
        env = os.environ.copy()
        env['PGPASSWORD'] = Config.DB_PASSWORD

        # COMANDO PG_DUMP PARA EXPORTAR EL ARCHIVO EL ARCHIVO
        comando = [
            "pg_dump",
            "-h", Config.DB_HOST,
            "-p", str(Config.DB_PORT),
            "-U", Config.DB_USER,
            "-F", "p", 
            "-O",
            "-x",
            "-n", Config.SCHEMA,
            Config.DB_NAME
        ]

        #EJECUTAR COMANDO Y CAPTURAR LA SALIDA
        proceso = subprocess.run(comando, env=env, capture_output=True, text=False, check=True)

        return {
            'success': True, 
            'file_bytes': proceso.stdout,
            'file_name': nombre_archivo
        }, 200

    except subprocess.CalledProcessError as e:
        #ENVIAR ERROR QUE TIRO SQL
        error_msg = e.stderr.decode('utf-8') if e.stderr else str(e)
        print(f"[ERROR de pg_dump] {error_msg}")
        return {'success': False, 'message': 'Fallo al extraer los datos del servidor EC2.'}, 500
    except Exception as e:
        print(f"[ERROR Backup] {str(e)}")
        return {'success': False, 'message': f'Error generando el backup: {str(e)}'}, 500