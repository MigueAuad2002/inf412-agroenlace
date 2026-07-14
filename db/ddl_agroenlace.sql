-- EMPRESA
CREATE TABLE empresa (
    id_empresa      serial4         NOT NULL,
    nombre_empresa  varchar(150)    NOT NULL,
    nit             varchar(30)     NULL,
    estado          varchar(20)     DEFAULT 'ACTIVO' NULL,
    created_at      timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT empresa_pkey PRIMARY KEY (id_empresa)
);

-- ROL
CREATE TABLE rol (
    id              serial4         NOT NULL,
    nombre_rol      varchar(50)     NOT NULL,
    created_at      timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT rol_pkey PRIMARY KEY (id)
);

-- USUARIO
CREATE TABLE usuario (
    id_usuario          serial4         NOT NULL,
    user_name           varchar(50)     NOT NULL,
    password_hash       varchar(255)    NOT NULL,
    documento_identidad varchar(20)     NOT NULL,
    nombre_razon_social varchar(150)    NOT NULL,
    direccion           text            NULL,
    correo              varchar(100)    NOT NULL,
    telefono            varchar(20)     NOT NULL,
    estado_cuenta       varchar(20)     DEFAULT 'ACTIVO' NULL,
    created_at          timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    id_rol              int4            NOT NULL,
    id_empresa          int4            NULL,
    CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario),
    CONSTRAINT usuario_user_name_key UNIQUE (user_name),
    CONSTRAINT usuario_correo_key UNIQUE (correo),
    CONSTRAINT usuario_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES rol(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT usuario_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- BITACORA
CREATE TABLE bitacora (
    nro         serial4     NOT NULL,
    fecha_hora  timestamp   DEFAULT CURRENT_TIMESTAMP NULL,
    accion      text        NOT NULL,
    id_usuario  int4        NOT NULL,
    id_empresa  int4        NULL,
    CONSTRAINT bitacora_pkey PRIMARY KEY (nro),
    CONSTRAINT bitacora_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT bitacora_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- NIVEL_FIDELIZACION
CREATE TABLE nivel_fidelizacion (
    id_nivel            serial4         NOT NULL,
    nombre_nivel        varchar(80)     NOT NULL,
    descripcion         text            NULL,
    min_transacciones   int4            DEFAULT 0 NULL,
    min_monto_acumulado numeric(12, 2)  DEFAULT 0 NULL,
    prioridad           int4            DEFAULT 1 NULL,
    estado              varchar(20)     DEFAULT 'ACTIVO' NULL,
    id_empresa          int4            NOT NULL,
    created_at          timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT nivel_fidelizacion_pkey PRIMARY KEY (id_nivel),
    CONSTRAINT nivel_fidelizacion_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)
);

-- REGLA_FIDELIZACION
CREATE TABLE regla_fidelizacion (
    id_regla             serial4        NOT NULL,
    id_nivel             int4           NOT NULL,
    tipo_transaccion     varchar(50)    DEFAULT 'PEDIDO_INSUMO' NULL,
    porcentaje_descuento numeric(5, 2)  DEFAULT 0 NULL,
    monto_max_descuento  numeric(12, 2) NULL,
    vigencia_desde       date           NULL,
    vigencia_hasta       date           NULL,
    estado               varchar(20)    DEFAULT 'ACTIVO' NULL,
    created_at           timestamp      DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT regla_fidelizacion_pkey PRIMARY KEY (id_regla),
    CONSTRAINT regla_fidelizacion_id_nivel_fkey FOREIGN KEY (id_nivel) REFERENCES nivel_fidelizacion(id_nivel)
);

-- BODEGA
CREATE TABLE bodega (
    id_producto     serial4         NOT NULL,
    nombre_producto varchar(150)    NOT NULL,
    categoria       varchar(30)     NOT NULL,
    unidad_medida   varchar(20)     NULL,
    precio_unitario numeric(10, 2)  NULL,
    stock_actual    numeric(10, 2)  DEFAULT 0 NULL,
    stock_minimo    numeric(10, 2)  DEFAULT 0 NULL,
    id_empresa      int4            NULL,
    CONSTRAINT bodega_pkey PRIMARY KEY (id_producto),
    CONSTRAINT bodega_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- MAQUINARIA
CREATE TABLE maquinaria (
    nro_maquina      serial4        NOT NULL,
    tipo             varchar(30)    NOT NULL,
    modelo           varchar(100)   NULL,
    placa            varchar(20)    NOT NULL,
    estado           varchar(30)    DEFAULT 'DISPONIBLE' NULL,
    kilometraje      numeric(10, 2) NULL,
    cant_tanque_comb numeric(10, 2) NULL,
    fecha_ult_mant   date           NULL,
    created_at       timestamp      DEFAULT CURRENT_TIMESTAMP NULL,
    id_empresa       int4           NULL,
    CONSTRAINT maquinaria_pkey PRIMARY KEY (nro_maquina),
    CONSTRAINT maquinaria_placa_key UNIQUE (placa),
    CONSTRAINT maquinaria_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- TERRENO
CREATE TABLE terreno (
    nro_lote         serial4        NOT NULL,
    nombre_sector    varchar(100)   NOT NULL,
    tamano_hectareas numeric(10, 2) NOT NULL,
    latitud          numeric(10, 8) NULL,
    longitud         numeric(11, 8) NULL,
    estado           varchar(30)    DEFAULT 'EN_DESCANSO' NULL,
    created_at       timestamp      DEFAULT CURRENT_TIMESTAMP NULL,
    id_usuario       int4           NOT NULL,
    id_empresa       int4           NULL,
    CONSTRAINT terreno_pkey PRIMARY KEY (nro_lote),
    CONSTRAINT terreno_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT terreno_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- DISPOSITIVO_IOT
CREATE TABLE dispositivo_iot (
    id_dispositivo     serial4      NOT NULL,
    codigo_dispositivo varchar(80)  NOT NULL,
    nombre_dispositivo varchar(120) NOT NULL,
    tipo_dispositivo   varchar(50)  DEFAULT 'TELEMETRIA' NULL,
    estado             varchar(30)  DEFAULT 'ACTIVO' NULL,
    fecha_vinculacion  timestamp    DEFAULT CURRENT_TIMESTAMP NULL,
    nro_lote           int4         NOT NULL,
    id_usuario         int4         NOT NULL,
    id_empresa         int4         NULL,
    CONSTRAINT dispositivo_iot_pkey PRIMARY KEY (id_dispositivo),
    CONSTRAINT dispositivo_iot_codigo_dispositivo_key UNIQUE (codigo_dispositivo),
    CONSTRAINT dispositivo_iot_nro_lote_fkey FOREIGN KEY (nro_lote) REFERENCES terreno(nro_lote) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT dispositivo_iot_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT dispositivo_iot_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- LECTURA_TELEMETRIA
CREATE TABLE lectura_telemetria (
    id_lectura     serial4      NOT NULL,
    humedad        numeric(5, 2) NOT NULL,
    temperatura    numeric(5, 2) NOT NULL,
    estado_terreno varchar(30)  DEFAULT 'NORMAL' NULL,
    fecha_hora     timestamp    DEFAULT CURRENT_TIMESTAMP NULL,
    id_dispositivo int4         NOT NULL,
    CONSTRAINT lectura_telemetria_pkey PRIMARY KEY (id_lectura),
    CONSTRAINT lectura_telemetria_id_dispositivo_fkey FOREIGN KEY (id_dispositivo) REFERENCES dispositivo_iot(id_dispositivo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ALERTA_TELEMETRIA
CREATE TABLE alerta_telemetria (
    id_alerta       serial4      NOT NULL,
    humedad_min     numeric(5, 2) NULL,
    humedad_max     numeric(5, 2) NULL,
    temperatura_min numeric(5, 2) NULL,
    temperatura_max numeric(5, 2) NULL,
    activa          bool         DEFAULT true NULL,
    created_at      timestamp    DEFAULT CURRENT_TIMESTAMP NULL,
    id_dispositivo  int4         NOT NULL,
    CONSTRAINT alerta_telemetria_pkey PRIMARY KEY (id_alerta),
    CONSTRAINT alerta_telemetria_id_dispositivo_fkey FOREIGN KEY (id_dispositivo) REFERENCES dispositivo_iot(id_dispositivo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CAMPANA_CULTIVO
CREATE TABLE campana_cultivo (
    id_campana           serial4        NOT NULL,
    variedad             varchar(100)   NULL,
    fecha_siembra        date           NULL,
    fecha_cosecha        date           NULL,
    estado               varchar(30)    DEFAULT 'PLANIFICADA' NULL,
    rendimiento_estimado numeric(10, 2) NULL,
    rendimiento_real     numeric(10, 2) NULL,
    nro_lote             int4           NOT NULL,
    nombre_campana       text           NULL,
    id_empresa           int4           NULL,
    CONSTRAINT campana_cultivo_pkey PRIMARY KEY (id_campana),
    CONSTRAINT campana_cultivo_nro_lote_fkey FOREIGN KEY (nro_lote) REFERENCES terreno(nro_lote) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT campana_cultivo_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- LOTE_COSECHA
CREATE TABLE lote_cosecha (
    id_lote_cosecha             serial4        NOT NULL,
    codigo_lote                 varchar(50)    NOT NULL,
    producto_cosechado          varchar(150)   NOT NULL,
    cantidad                    numeric(10, 2) NULL,
    unidad_medida               varchar(20)    DEFAULT 'KG' NULL,
    fecha_cosecha               date           NOT NULL,
    condiciones_almacenamiento  text           NOT NULL,
    estado                      varchar(30)    DEFAULT 'REGISTRADO' NULL,
    qr_token                    varchar(120)   NOT NULL,
    created_at                  timestamp      DEFAULT CURRENT_TIMESTAMP NULL,
    id_campana                  int4           NOT NULL,
    nro_lote                    int4           NOT NULL,
    id_usuario                  int4           NOT NULL,
    id_empresa                  int4           NULL,
    CONSTRAINT lote_cosecha_pkey PRIMARY KEY (id_lote_cosecha),
    CONSTRAINT lote_cosecha_codigo_lote_key UNIQUE (codigo_lote),
    CONSTRAINT lote_cosecha_qr_token_key UNIQUE (qr_token),
    CONSTRAINT lote_cosecha_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES campana_cultivo(id_campana) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT lote_cosecha_nro_lote_fkey FOREIGN KEY (nro_lote) REFERENCES terreno(nro_lote) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT lote_cosecha_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT lote_cosecha_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

CREATE INDEX idx_lote_cosecha_campana ON lote_cosecha (id_campana);
CREATE INDEX idx_lote_cosecha_empresa ON lote_cosecha (id_empresa);

-- QR_TRAZABILIDAD
CREATE TABLE qr_trazabilidad (
    id_qr               serial4         NOT NULL,
    id_lote_cosecha     int4            NOT NULL,
    token_qr            varchar(255)    NOT NULL,
    url_qr              text            NULL,
    estado              varchar(50)     DEFAULT 'ACTIVO' NULL,
    fecha_generacion    timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    fecha_expiracion    timestamp       NULL,
    veces_escaneado     int4            DEFAULT 0 NULL,
    ultimo_escaneo      timestamp       NULL,
    CONSTRAINT qr_trazabilidad_pkey PRIMARY KEY (id_qr),
    CONSTRAINT qr_trazabilidad_token_qr_key UNIQUE (token_qr),
    CONSTRAINT qr_trazabilidad_id_lote_cosecha_fkey FOREIGN KEY (id_lote_cosecha) REFERENCES lote_cosecha(id_lote_cosecha)
);

CREATE INDEX idx_qr_trazabilidad_token ON qr_trazabilidad (token_qr);

-- ORDEN_TRABAJO
CREATE TABLE orden_trabajo (
    nro_orden       serial4     NOT NULL,
    tipo_trabajo    varchar(30) NOT NULL,
    fecha_inicio    timestamp   NULL,
    fecha_fin       timestamp   NULL,
    fecha_calculo   timestamp   NULL,
    estado          varchar(30) DEFAULT 'PENDIENTE' NULL,
    id_campana      int4        NULL,
    id_supervisor   int4        NOT NULL,
    id_empleado     int4        NULL,
    reporte_texto   text        NULL,
    url_imagen      text        NULL,
    url_audio       text        NULL,
    id_empresa      int4        NULL,
    CONSTRAINT orden_trabajo_pkey PRIMARY KEY (nro_orden),
    CONSTRAINT orden_trabajo_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES campana_cultivo(id_campana) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT orden_trabajo_id_supervisor_fkey FOREIGN KEY (id_supervisor) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT orden_trabajo_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT orden_trabajo_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- DETALLE_BODEGA
CREATE TABLE detalle_bodega (
    id_detalle  serial4         NOT NULL,
    cant_usada  numeric(10, 2)  NOT NULL,
    nro_orden   int4            NOT NULL,
    id_producto int4            NOT NULL,
    CONSTRAINT detalle_bodega_pkey PRIMARY KEY (id_detalle),
    CONSTRAINT detalle_bodega_nro_orden_fkey FOREIGN KEY (nro_orden) REFERENCES orden_trabajo(nro_orden) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT detalle_bodega_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES bodega(id_producto) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ORDEN_MAQUINARIA
CREATE TABLE orden_maquinaria (
    id_detalle  serial4 NOT NULL,
    detalle     text    NULL,
    nro_orden   int4    NOT NULL,
    nro_maquina int4    NOT NULL,
    CONSTRAINT orden_maquinaria_pkey PRIMARY KEY (id_detalle),
    CONSTRAINT orden_maquinaria_nro_orden_fkey FOREIGN KEY (nro_orden) REFERENCES orden_trabajo(nro_orden) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT orden_maquinaria_nro_maquina_fkey FOREIGN KEY (nro_maquina) REFERENCES maquinaria(nro_maquina) ON DELETE CASCADE ON UPDATE CASCADE
);

-- TRANSACCION_COMERCIAL
CREATE TABLE transaccion_comercial (
    nro_transaccion     serial4         NOT NULL,
    tipo_transaccion    varchar(30)     NOT NULL,
    estado_transaccion  varchar(30)     DEFAULT 'PENDIENTE' NULL,
    fecha_hora          timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    monto_total         numeric(12, 2)  DEFAULT 0 NULL,
    id_cliente          int4            NOT NULL,
    id_supervisor_admin int4            NOT NULL,
    id_empresa          int4            NULL,
    CONSTRAINT transaccion_comercial_pkey PRIMARY KEY (nro_transaccion),
    CONSTRAINT transaccion_comercial_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT transaccion_comercial_id_supervisor_admin_fkey FOREIGN KEY (id_supervisor_admin) REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT transaccion_comercial_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE
);

-- DETALLE_VENTA
CREATE TABLE detalle_venta (
    id_detalle      serial4         NOT NULL,
    cantidad        numeric(10, 2)  NOT NULL,
    precio_venta    numeric(10, 2)  NOT NULL,
    nro_transaccion int4            NOT NULL,
    id_producto     int4            NOT NULL,
    CONSTRAINT detalle_venta_pkey PRIMARY KEY (id_detalle),
    CONSTRAINT detalle_venta_nro_transaccion_fkey FOREIGN KEY (nro_transaccion) REFERENCES transaccion_comercial(nro_transaccion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT detalle_venta_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES bodega(id_producto) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CONTROL_CALIDAD
CREATE TABLE control_calidad (
    id_ctrl_cal             serial4         NOT NULL,
    porcentaje_humedad      numeric(5, 2)   NULL,
    porcentaje_impurezas    numeric(5, 2)   NULL,
    observaciones           text            NULL,
    estado_aceptacion       varchar(30)     NOT NULL,
    id_detalle              int4            NOT NULL,
    CONSTRAINT control_calidad_pkey PRIMARY KEY (id_ctrl_cal),
    CONSTRAINT control_calidad_id_detalle_fkey FOREIGN KEY (id_detalle) REFERENCES detalle_venta(id_detalle) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ALQUILER_MAQUINA
CREATE TABLE alquiler_maquina (
    id_alquiler             serial4         NOT NULL,
    estado_alquiler         varchar(30)     DEFAULT 'RESERVADO' NULL,
    horas_uso_salida        numeric(10, 2)  NULL,
    horas_uso_entrada       numeric(10, 2)  NULL,
    observaciones_entrega   text            NULL,
    observaciones_devolucion text           NULL,
    fecha_inicio            timestamp       NULL,
    fecha_fin               timestamp       NULL,
    nro_transaccion         int4            NOT NULL,
    nro_maquina             int4            NOT NULL,
    CONSTRAINT alquiler_maquina_pkey PRIMARY KEY (id_alquiler),
    CONSTRAINT alquiler_maquina_nro_transaccion_fkey FOREIGN KEY (nro_transaccion) REFERENCES transaccion_comercial(nro_transaccion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT alquiler_maquina_nro_maquina_fkey FOREIGN KEY (nro_maquina) REFERENCES maquinaria(nro_maquina) ON DELETE CASCADE ON UPDATE CASCADE
);

-- DESCUENTO_TRANSACCION
CREATE TABLE descuento_transaccion (
    id_descuento        serial4         NOT NULL,
    nro_transaccion     int4            NOT NULL,
    id_cliente          int4            NOT NULL,
    id_nivel            int4            NULL,
    id_regla            int4            NULL,
    subtotal_original   numeric(12, 2)  NOT NULL,
    porcentaje_descuento numeric(5, 2)  DEFAULT 0 NULL,
    descuento_total     numeric(12, 2)  DEFAULT 0 NULL,
    monto_final         numeric(12, 2)  NOT NULL,
    created_at          timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT descuento_transaccion_pkey PRIMARY KEY (id_descuento),
    CONSTRAINT descuento_transaccion_nro_transaccion_fkey FOREIGN KEY (nro_transaccion) REFERENCES transaccion_comercial(nro_transaccion),
    CONSTRAINT descuento_transaccion_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario),
    CONSTRAINT descuento_transaccion_id_nivel_fkey FOREIGN KEY (id_nivel) REFERENCES nivel_fidelizacion(id_nivel),
    CONSTRAINT descuento_transaccion_id_regla_fkey FOREIGN KEY (id_regla) REFERENCES regla_fidelizacion(id_regla)
);

-- PAGOS_TRANSACCION
CREATE TABLE pagos_transaccion (
    nro_pago        serial4         NOT NULL,
    monto_pagado    numeric(12, 2)  NOT NULL,
    fecha_pago      timestamp       DEFAULT CURRENT_TIMESTAMP NULL,
    metodo_pago     varchar(30)     NOT NULL,
    nro_comprobante varchar(50)     NULL,
    observaciones   text            NULL,
    nro_transaccion int4            NOT NULL,
    CONSTRAINT pagos_transaccion_pkey PRIMARY KEY (nro_pago),
    CONSTRAINT pagos_transaccion_nro_transaccion_fkey FOREIGN KEY (nro_transaccion) REFERENCES transaccion_comercial(nro_transaccion) ON DELETE CASCADE ON UPDATE CASCADE
);

-- DOCUMENTO_LEGAL
CREATE TABLE documento_legal (
    nro_documento   serial4      NOT NULL,
    tipo_documento  varchar(30)  NOT NULL,
    url_archivo     varchar(255) NULL,
    fecha_firma     date         NULL,
    nro_transaccion int4         NOT NULL,
    CONSTRAINT documento_legal_pkey PRIMARY KEY (nro_documento),
    CONSTRAINT documento_legal_nro_transaccion_fkey FOREIGN KEY (nro_transaccion) REFERENCES transaccion_comercial(nro_transaccion) ON DELETE CASCADE ON UPDATE CASCADE
);

-- RUTA_LOGISTICA
CREATE TABLE ruta_logistica (
    id_ruta                 serial4      NOT NULL,
    id_transaccion          int4         NOT NULL,
    id_chofer               int4         NOT NULL,
    id_empresa              int4         NOT NULL,
    origen                  varchar(255) NOT NULL,
    destino                 varchar(255) NOT NULL,
    fecha_asignacion        timestamp    DEFAULT CURRENT_TIMESTAMP NULL,
    fecha_entrega_estimada  date         NOT NULL,
    fecha_entrega_real      timestamp    NULL,
    estado                  varchar(50)  DEFAULT 'ASIGNADA' NULL,
    observaciones           text         NULL,
    url_evidencia_imagen    text         NULL,
    url_evidencia_audio     text         NULL,
    created_at              timestamp    DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT ruta_logistica_pkey PRIMARY KEY (id_ruta),
    CONSTRAINT ruta_logistica_id_transaccion_fkey FOREIGN KEY (id_transaccion) REFERENCES transaccion_comercial(nro_transaccion),
    CONSTRAINT ruta_logistica_id_chofer_fkey FOREIGN KEY (id_chofer) REFERENCES usuario(id_usuario),
    CONSTRAINT ruta_logistica_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)
);