from ..repositories import pedidos_repo
from ..config import db

def obtener_catalogo(id_empresa):
    if not id_empresa:
        return {'success': False, 'message': 'ID de empresa es requerido.'}, 400
        
    try:
        db.create_connection()
        # Nos aseguramos que sea entero
        result = pedidos_repo.get_catalogo_insumos(int(id_empresa))
        
        data = []
        if result and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in result:
                row_dict = dict(zip(columns, row))
                # Formateo de números para que el JSON de React (JS) los lea perfecto
                row_dict['precio_unitario'] = float(row_dict['precio_unitario']) if row_dict['precio_unitario'] else 0.0
                row_dict['stock_actual'] = float(row_dict['stock_actual']) if row_dict['stock_actual'] else 0.0
                data.append(row_dict)
                
        return {'success': True, 'catalogo': data}, 200
    except Exception as e:
        print(f'[ERROR] {str(e)}')
        return {'success': False, 'message': f'Error interno: {str(e)}'}, 500
    finally:
        db.close_connection()

def registrar_pedido(data):
    id_cliente = data.get('id_cliente')
    id_supervisor = data.get('id_supervisor_admin') 
    id_empresa = data.get('id_empresa')
    detalles = data.get('detalles', []) 
    
    if not all([id_cliente, id_supervisor, id_empresa]) or len(detalles) == 0:
        return {'success': False, 'message': 'Faltan datos obligatorios o el carrito está vacío.'}, 400

    try:
        db.create_connection()
        
        # 1. Calcular el monto total (Backend manda, por seguridad no confiamos en el total del frontend)
        monto_total = sum(float(item['cantidad']) * float(item['precio_unitario']) for item in detalles)
        
        # 2. Insertar cabecera de la Transacción
        row_id = pedidos_repo.insert_transaccion_cabecera(
            tipo_transaccion='PEDIDO_INSUMO',
            monto_total=monto_total,
            id_cliente=id_cliente,
            id_supervisor_admin=id_supervisor,
            id_empresa=id_empresa
        )
        
        if not row_id:
            raise Exception("No se pudo generar el número de transacción.")
            
        nro_transaccion = row_id[0]
        
        # 3. Procesar cada producto del carrito
        for item in detalles:
            id_prod = item['id_producto']
            cant = float(item['cantidad'])
            precio = float(item['precio_unitario'])
            
            # Verificación de seguridad extra: 
            # Evita que el saldo quede negativo si 2 personas compran al mismo tiempo
            stock_actual = pedidos_repo.verificar_stock(id_prod)
            if stock_actual < cant:
                raise Exception(f"Stock insuficiente para el producto ID {id_prod}. Disponible: {stock_actual}")

            # Insertar en detalle
            pedidos_repo.insert_detalle_venta(cant, precio, nro_transaccion, id_prod)
            
            # Descontar stock
            pedidos_repo.update_stock_bodega(cant, id_prod)
            
        return {
            'success': True, 
            'message': 'Pedido registrado exitosamente.', 
            'nro_transaccion': nro_transaccion,
            'monto_total': monto_total
        }, 201

    except Exception as e:
        print(f'[ERROR Pedido] {str(e)}')
        return {'success': False, 'message': f'Error al procesar el pedido: {str(e)}'}, 500
    finally:
        db.close_connection()

def obtener_historial(id_cliente):
    try:
        db.create_connection()
        result = pedidos_repo.get_historial_pedidos(id_cliente)
        data = []
        if result and db.cur.description:
            columns = [c[0] for c in db.cur.description]
            for row in result:
                row_dict = dict(zip(columns, row))
                row_dict['fecha_hora'] = row_dict['fecha_hora'].strftime('%Y-%m-%d %H:%M')
                row_dict['monto_total'] = float(row_dict['monto_total'])
                data.append(row_dict)
        return {'success': True, 'listado': data}, 200
    finally:
        db.close_connection()

def obtener_detalle(nro_transaccion):
    try:
        db.create_connection()
        result = pedidos_repo.get_detalle_pedido(nro_transaccion)
        data = []
        if result and db.cur.description:
            columns = [c[0] for c in db.cur.description]
            for row in result:
                row_dict = dict(zip(columns, row))
                row_dict['precio_venta'] = float(row_dict['precio_venta'])
                data.append(row_dict)
        return {'success': True, 'detalles': data}, 200
    finally:
        db.close_connection()