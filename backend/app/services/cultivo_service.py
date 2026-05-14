from decimal import Decimal, InvalidOperation
from ..repositories import cultivo_repo
from ..config import db


def _to_decimal(value, field_name, default=None):
    if value is None or value == "":
        return default, None

    try:
        value = Decimal(str(value))

        if value < 0:
            return None, f"El campo {field_name} no puede ser negativo."

        return value, None

    except (InvalidOperation, ValueError):
        return None, f"El campo {field_name} debe ser numérico."


def get_cultivos_list():
    try:
        db.create_connection()

        result = cultivo_repo.get_all_cultivos()

        data = []
        if result is not None and db.cur.description:
            columns = [column[0] for column in db.cur.description]

            for row in result:
                data.append(dict(zip(columns, row)))

        return {
            "success": True,
            "message": "Bodega de cultivos obtenida exitosamente.",
            "list_cultivos": data
        }, 200

    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }, 500

    finally:
        db.close_connection()


def create_cultivo(data):
    if not data:
        return {
            "success": False,
            "message": "No se enviaron datos."
        }, 400

    required_fields = ["nombre_producto", "categoria"]

    for field in required_fields:
        if field not in data or not data[field]:
            return {
                "success": False,
                "message": f"Falta el campo: {field}"
            }, 400

    nombre_producto = data.get("nombre_producto").strip().upper()
    categoria = data.get("categoria").strip().upper()

    unidad_medida = data.get("unidad_medida")
    unidad_medida = unidad_medida.strip().upper() if unidad_medida else None

    precio_unitario, error = _to_decimal(
        data.get("precio_unitario"),
        "precio_unitario",
        default=None
    )
    if error:
        return {"success": False, "message": error}, 400

    stock_actual, error = _to_decimal(
        data.get("stock_actual"),
        "stock_actual",
        default=0
    )
    if error:
        return {"success": False, "message": error}, 400

    stock_minimo, error = _to_decimal(
        data.get("stock_minimo"),
        "stock_minimo",
        default=0
    )
    if error:
        return {"success": False, "message": error}, 400

    try:
        db.create_connection()

        ra = cultivo_repo.insert_cultivo(
            nombre_producto,
            categoria,
            unidad_medida,
            precio_unitario,
            stock_actual,
            stock_minimo
        )

        if ra > 0:
            return {
                "success": True,
                "message": "Cultivo registrado exitosamente."
            }, 201

        return {
            "success": False,
            "message": "Error al registrar el cultivo."
        }, 500

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }, 500

    finally:
        db.close_connection()


def remove_cultivo(id_producto):
    if not id_producto:
        return {
            "success": False,
            "message": "Debe seleccionar un cultivo."
        }, 400

    try:
        id_producto = int(id_producto)

    except ValueError:
        return {
            "success": False,
            "message": "El id_producto debe ser un número entero."
        }, 400

    try:
        db.create_connection()

        ra = cultivo_repo.delete_cultivo_by_id(id_producto)

        if ra > 0:
            return {
                "success": True,
                "message": "Cultivo eliminado exitosamente.",
                "filas": ra
            }, 200

        return {
            "success": False,
            "message": "Cultivo no encontrado."
        }, 404

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }, 500

    finally:
        db.close_connection()


def modify_cultivo(data):
    if not data:
        return {
            "success": False,
            "message": "No se enviaron datos."
        }, 400

    id_producto = data.get("id_producto")

    if not id_producto:
        return {
            "success": False,
            "message": "id_producto requerido."
        }, 400

    try:
        id_producto = int(id_producto)

    except ValueError:
        return {
            "success": False,
            "message": "El id_producto debe ser un número entero."
        }, 400

    fields = []
    params = []

    string_mappings = {
        "nombre_producto": "nombre_producto",
        "categoria": "categoria",
        "unidad_medida": "unidad_medida"
    }

    numeric_mappings = {
        "precio_unitario": "precio_unitario",
        "stock_actual": "stock_actual",
        "stock_minimo": "stock_minimo"
    }

    for key, column in string_mappings.items():
        if key in data and data.get(key) not in [None, ""]:
            value = data.get(key).strip().upper()
            fields.append(f"{column} = %s")
            params.append(value)

    for key, column in numeric_mappings.items():
        if key in data and data.get(key) not in [None, ""]:
            value, error = _to_decimal(data.get(key), key)

            if error:
                return {
                    "success": False,
                    "message": error
                }, 400

            fields.append(f"{column} = %s")
            params.append(value)

    if not fields:
        return {
            "success": False,
            "message": "No hay datos para actualizar."
        }, 400

    try:
        db.create_connection()

        ra = cultivo_repo.update_cultivo_dynamic(
            id_producto,
            fields,
            params
        )

        if ra > 0:
            return {
                "success": True,
                "message": "Cultivo actualizado exitosamente."
            }, 200

        return {
            "success": False,
            "message": "Sin cambios o cultivo no encontrado."
        }, 404

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }, 500

    finally:
        db.close_connection()