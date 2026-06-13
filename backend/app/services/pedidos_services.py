# app/services/pedidos_services.py
from app.repos import pedidos_repos
from app.classes.postgre import PostgreSQL

def obtener_catalogo(id_empresa):
    if not id_empresa:
        return {'success': False, 'message': 'ID de empresa es requerido.'}, 400
        
    db = PostgreSQL()
    try:
        db.create_connection()
        result = pedidos_repos.get_catalogo_insumos(db, int(id_empresa))
        
        data = []
        if result and db.cur.description:
            columns = [column[0] for column in db.cur.description]
            for row in result:
                row_dict = dict(zip(columns, row))
                row_dict['precio_unitario'] = float(row_dict['precio_unitario']) if row_dict['precio_unitario'] else 0.0
                row_dict['stock_actual'] = float(row_dict['stock_actual']) if row_dict['stock_actual'] else 0.0
                data.append(row_dict)
                
        return {'success': True, 'catalogo': data}, 200
    except Exception as e:
        print(f'[ERROR obtener_catalogo] {str(e)}')
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

    db = PostgreSQL()
    try:
        db.create_connection()
        
        # 1. Calcular el monto total (Backend manda)
        monto_total = sum(float(item['cantidad']) * float(item['precio_unitario']) for item in detalles)
        
        # 2. Insertar cabecera de la Transacción
        row_id = pedidos_repos.insert_transaccion_cabecera(
            db,
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
            
            # Verificación de stock ANTES de descontar
            stock_actual = pedidos_repos.verificar_stock(db, id_prod)
            if stock_actual < cant:
                raise Exception(f"Stock insuficiente para el producto ID {id_prod}. Disponible: {stock_actual}")

            # Insertar en detalle
            pedidos_repos.insert_detalle_venta(db, cant, precio, nro_transaccion, id_prod)
            
            # Descontar stock
            pedidos_repos.update_stock_bodega(db, cant, id_prod)
            
        # 4. Registrar en bitácora el pedido
        db.insert_log(f"GENERÓ UN PEDIDO POR {monto_total} Bs (Transacción: {nro_transaccion})", id_supervisor)
        
        # 5. Confirmar transacción completa (Atomicidad)
        db.conn.commit()
            
        return {
            'success': True, 
            'message': 'Pedido registrado exitosamente.', 
            'nro_transaccion': nro_transaccion,
            'monto_total': monto_total
        }, 201

    except Exception as e:
        if db.conn:
            db.conn.rollback() # Si un solo producto falla el stock, deshacemos TODO
        print(f'[ERROR Pedido] {str(e)}')
        return {'success': False, 'message': f'Error al procesar el pedido: {str(e)}'}, 500
    finally:
        db.close_connection()

def obtener_historial(id_cliente):
    db = PostgreSQL()
    try:
        db.create_connection()
        result = pedidos_repos.get_historial_pedidos(db, id_cliente)
        data = []
        if result and db.cur.description:
            columns = [c[0] for c in db.cur.description]
            for row in result:
                row_dict = dict(zip(columns, row))
                row_dict['fecha_hora'] = row_dict['fecha_hora'].strftime('%Y-%m-%d %H:%M')
                row_dict['monto_total'] = float(row_dict['monto_total'])
                data.append(row_dict)
        return {'success': True, 'listado': data}, 200
    except Exception as e:
        print(f'[ERROR obtener_historial] {str(e)}')
        return {'success': False, 'message': f'Error: {str(e)}'}, 500
    finally:
        db.close_connection()

def obtener_detalle(nro_transaccion):
    db = PostgreSQL()
    try:
        db.create_connection()
        result = pedidos_repos.get_detalle_pedido(db, nro_transaccion)
        data = []
        if result and db.cur.description:
            columns = [c[0] for c in db.cur.description]
            for row in result:
                row_dict = dict(zip(columns, row))
                row_dict['precio_venta'] = float(row_dict['precio_venta'])
                data.append(row_dict)
        return {'success': True, 'detalles': data}, 200
    except Exception as e:
        print(f'[ERROR obtener_detalle] {str(e)}')
        return {'success': False, 'message': f'Error: {str(e)}'}, 500
    finally:
        db.close_connection()