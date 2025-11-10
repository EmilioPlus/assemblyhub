# API de Documentos de Asamblea

Este documento describe los endpoints disponibles para gestionar documentos de asamblea, incluyendo carga, consulta, eliminación y validación.

## Autenticación

Todos los endpoints requieren autenticación mediante JWT. Incluye el token en el header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Cargar documento de asamblea

**POST** `/api/documentos`

**Descripción:** Carga un nuevo documento asociado a una asamblea. Valida formato, tamaño y unicidad del nombre antes de guardar.

**Permisos:** Solo administradores

**Body (form-data):**

- `assemblyId` (string, requerido): ID de la asamblea
- `name` (string, requerido): Nombre del documento (debe ser único por asamblea)
- `document` (file, requerido): Archivo PDF, JPG o PNG (máx. 10MB)

**Validaciones:**

- El nombre del documento debe ser único dentro de la asamblea
- Formatos permitidos: PDF, JPG, PNG
- Tamaño máximo: 10MB
- El archivo es obligatorio

**Respuesta exitosa (201):**

```json
{
  "msg": "Documento cargado exitosamente",
  "document": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Acta de Constitución",
    "fileName": "assembly-doc-1762637248695-700422563.pdf",
    "originalFileName": "acta_constitución.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "uploadedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "uploadedAt": "2024-01-15T10:00:00.000Z",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Errores:**

- `400`: Campos faltantes, formato inválido, tamaño excedido, o nombre duplicado
- `404`: Asamblea no encontrada
- `403`: Usuario no es administrador

**Ejemplo en Postman:**

```
POST http://localhost:5000/api/documentos
Headers:
  Authorization: Bearer <token>
Body (form-data):
  assemblyId: 65a1b2c3d4e5f6g7h8i9j0k1
  name: Acta de Constitución
  document: <archivo PDF/JPG/PNG>
```

---

### 2. Listar documentos de una asamblea

**GET** `/api/documentos/:assemblyId`

**Descripción:** Obtiene el listado de documentos visibles para los participantes inscritos en una asamblea.

**Permisos:**

- Administradores: Pueden ver todos los documentos (pendientes, aprobados, rechazados)
- Participantes: Solo pueden ver documentos aprobados

**Parámetros:**

- `assemblyId` (path): ID de la asamblea

**Respuesta exitosa (200):**

```json
{
  "msg": "Documentos obtenidos exitosamente",
  "assembly": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Asamblea General 2024",
    "startDateTime": "2024-01-15T10:00:00.000Z",
    "endDateTime": "2024-01-15T18:00:00.000Z"
  },
  "totalDocuments": 3,
  "documents": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Acta de Constitución",
      "fileName": "assembly-doc-1762637248695-700422563.pdf",
      "originalFileName": "acta_constitución.pdf",
      "fileSize": 245678,
      "mimeType": "application/pdf",
      "status": "approved",
      "uploadedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "uploadedAt": "2024-01-15T10:00:00.000Z",
      "validatedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "firstName": "Validador",
        "lastName": "Admin",
        "email": "validador@example.com"
      },
      "validatedAt": "2024-01-15T11:00:00.000Z",
      "observations": "Documento válido",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "downloadUrl": "/api/documentos/download/65a1b2c3d4e5f6g7h8i9j0k3"
    }
  ]
}
```

**Errores:**

- `404`: Asamblea no encontrada
- `403`: Usuario no es participante inscrito o administrador

**Ejemplo en Postman:**

```
GET http://localhost:5000/api/documentos/65a1b2c3d4e5f6g7h8i9j0k1
Headers:
  Authorization: Bearer <token>
```

---

### 3. Eliminar documento

**DELETE** `/api/documentos/:documentId`

**Descripción:** Elimina un documento previo mensaje de confirmación y registra el evento en el historial.

**Permisos:** Solo administradores

**Parámetros:**

- `documentId` (path): ID del documento

**Respuesta exitosa (200):**

```json
{
  "msg": "Documento eliminado exitosamente",
  "deletedDocument": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Acta de Constitución",
    "assembly": "65a1b2c3d4e5f6g7h8i9j0k1",
    "fileName": "assembly-doc-1762637248695-700422563.pdf",
    "originalFileName": "acta_constitución.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "uploadedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
    "uploadedAt": "2024-01-15T10:00:00.000Z",
    "status": "approved"
  }
}
```

**Errores:**

- `404`: Documento no encontrado
- `403`: Usuario no es administrador

**Nota:** La eliminación registra automáticamente el evento en el historial de validaciones con:

- Usuario que eliminó
- Fecha y hora
- Observaciones: "Documento eliminado: [nombre]"

**Ejemplo en Postman:**

```
DELETE http://localhost:5000/api/documentos/65a1b2c3d4e5f6g7h8i9j0k3
Headers:
  Authorization: Bearer <token>
```

---

### 4. Listar documentos pendientes de validación

**GET** `/api/documentos/pendientes`

**Descripción:** Lista todos los documentos en estado pendiente que requieren validación por parte de un administrador.

**Permisos:** Solo administradores

**Query parameters:**

- `assemblyId` (opcional): ID de la asamblea para filtrar documentos

**Respuesta exitosa (200):**

```json
{
  "msg": "Documentos pendientes obtenidos exitosamente",
  "totalDocuments": 5,
  "documents": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Acta de Constitución",
      "fileName": "assembly-doc-1762637248695-700422563.pdf",
      "originalFileName": "acta_constitución.pdf",
      "fileSize": 245678,
      "mimeType": "application/pdf",
      "status": "pending",
      "uploadedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "uploadedAt": "2024-01-15T10:00:00.000Z",
      "assembly": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Asamblea General 2024",
        "startDateTime": "2024-01-15T10:00:00.000Z",
        "endDateTime": "2024-01-15T18:00:00.000Z"
      },
      "downloadUrl": "/api/documentos/download/65a1b2c3d4e5f6g7h8i9j0k3"
    }
  ]
}
```

**Errores:**

- `403`: Usuario no es administrador

**Ejemplo en Postman:**

```
GET http://localhost:5000/api/documentos/pendientes
Headers:
  Authorization: Bearer <token>

GET http://localhost:5000/api/documentos/pendientes?assemblyId=65a1b2c3d4e5f6g7h8i9j0k1
Headers:
  Authorization: Bearer <token>
```

---

### 5. Aprobar documento

**PUT** `/api/documentos/:id/aprobar`

**Descripción:** Cambia el estado del documento a "Aprobado", registra el usuario validador, la fecha y la hora, y envía notificación por email al usuario que lo subió. La validación queda registrada en el historial con trazabilidad completa (validador, fecha, hora, decisión y observaciones).

**Permisos:** Solo administradores

**Parámetros:**

- `id` (path): ID del documento

**Body:**

```json
{
  "observations": "Documento válido y completo" // Opcional
}
```

**Respuesta exitosa (200):**

```json
{
  "msg": "Documento aprobado exitosamente. Se ha notificado al usuario.",
  "document": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Acta de Constitución",
    "status": "approved",
    "validatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "firstName": "Validador",
      "lastName": "Admin",
      "email": "validador@example.com"
    },
    "validatedAt": "2024-01-15T11:00:00.000Z",
    "observations": "Documento válido y completo",
    "assembly": "65a1b2c3d4e5f6g7h8i9j0k1"
  }
}
```

**Errores:**

- `404`: Documento no encontrado
- `400`: El documento ya está aprobado o rechazado
- `403`: Usuario no es administrador

**Ejemplo en Postman:**

```
PUT http://localhost:5000/api/documentos/65a1b2c3d4e5f6g7h8i9j0k3/aprobar
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "observations": "Documento válido y completo"
}
```

---

### 6. Rechazar documento

**PUT** `/api/documentos/:id/rechazar`

**Descripción:** Cambia el estado a "Rechazado", requiere observaciones obligatorias, y envía notificación por email con las razones del rechazo. La validación queda registrada en el historial con trazabilidad completa (validador, fecha, hora, decisión y observaciones).

**Permisos:** Solo administradores

**Parámetros:**

- `id` (path): ID del documento

**Body:**

```json
{
  "observations": "El documento no cumple con los requisitos establecidos. Faltan firmas." // Obligatorio
}
```

**Respuesta exitosa (200):**

```json
{
  "msg": "Documento rechazado. Se ha notificado al usuario con las razones del rechazo.",
  "document": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Acta de Constitución",
    "status": "rejected",
    "validatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "firstName": "Validador",
      "lastName": "Admin",
      "email": "validador@example.com"
    },
    "validatedAt": "2024-01-15T11:00:00.000Z",
    "observations": "El documento no cumple con los requisitos establecidos. Faltan firmas.",
    "assembly": "65a1b2c3d4e5f6g7h8i9j0k1"
  }
}
```

**Errores:**

- `404`: Documento no encontrado
- `400`: Observaciones faltantes o el documento ya está aprobado/rechazado
- `403`: Usuario no es administrador

**Ejemplo en Postman:**

```
PUT http://localhost:5000/api/documentos/65a1b2c3d4e5f6g7h8i9j0k3/rechazar
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "observations": "El documento no cumple con los requisitos establecidos. Faltan firmas."
}
```

---

### 7. Obtener historial de validación de un documento

**GET** `/api/documentos/history/:documentId`

**Descripción:** Obtiene el historial completo de validaciones de un documento, incluyendo carga, aprobación, rechazo y eliminación.

**Permisos:** Solo administradores

**Parámetros:**

- `documentId` (path): ID del documento

**Respuesta exitosa (200):**

```json
{
  "msg": "Historial obtenido exitosamente",
  "documentId": "65a1b2c3d4e5f6g7h8i9j0k3",
  "history": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "action": "approve",
      "userId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "firstName": "Validador",
        "lastName": "Admin",
        "email": "validador@example.com"
      },
      "previousStatus": "pending",
      "newStatus": "approved",
      "observations": "Documento válido y completo",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "validator": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "firstName": "Validador",
        "lastName": "Admin",
        "email": "validador@example.com"
      },
      "date": "2024-01-15T11:00:00.000Z",
      "time": "2024-01-15T11:00:00.000Z",
      "decision": "approved"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "action": "upload",
      "userId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "previousStatus": null,
      "newStatus": "pending",
      "observations": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "validator": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "date": "2024-01-15T10:00:00.000Z",
      "time": "2024-01-15T10:00:00.000Z",
      "decision": "pending"
    }
  ]
}
```

**Campos del historial:**

- `action`: Acción realizada (upload, approve, reject, delete)
- `userId`: Usuario que realizó la acción (validador/usuario que cargó)
- `previousStatus`: Estado anterior del documento
- `newStatus`: Nuevo estado del documento
- `observations`: Observaciones (obligatorio si es rechazo)
- `createdAt`: Fecha y hora de la acción
- `validator`: Información del validador/usuario
- `date`: Fecha de la acción
- `time`: Hora de la acción
- `decision`: Decisión tomada (approved, rejected, pending)

**Errores:**

- `404`: No se encontró historial para este documento
- `403`: Usuario no es administrador

**Ejemplo en Postman:**

```
GET http://localhost:5000/api/documentos/history/65a1b2c3d4e5f6g7h8i9j0k3
Headers:
  Authorization: Bearer <token>
```

---

## Endpoints adicionales (rutas alternativas)

### 5. Cargar documento (ruta alternativa)

**POST** `/api/assembly-documents/upload`

Equivalente a `POST /api/documentos`, pero con ruta más descriptiva.

### 6. Listar documentos (ruta alternativa)

**GET** `/api/assembly-documents/:assemblyId`

Equivalente a `GET /api/documentos/:assemblyId`, pero con ruta más descriptiva.

### 7. Eliminar documento (ruta alternativa)

**DELETE** `/api/assembly-documents/:documentId`

Equivalente a `DELETE /api/documentos/:documentId`, pero con ruta más descriptiva.

### 8. Validar documento (Aprobar o Rechazar)

**POST** `/api/assembly-documents/validate`

**Descripción:** Valida un documento (aprueba o rechaza) y registra la acción en el historial.

**Permisos:** Solo administradores

**Body:**

```json
{
  "documentId": "65a1b2c3d4e5f6g7h8i9j0k3",
  "status": "approved", // o "rejected"
  "observations": "Documento válido y completo" // Obligatorio si es "rejected"
}
```

**Respuesta exitosa (200):**

```json
{
  "msg": "Documento aprobado exitosamente.",
  "document": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Acta de Constitución",
    "status": "approved",
    "validatedBy": "65a1b2c3d4e5f6g7h8i9j0k4",
    "validatedAt": "2024-01-15T11:00:00.000Z",
    "observations": "Documento válido y completo"
  }
}
```

---

## Estructura de datos en MongoDB

### Colección: `assemblydocuments`

```javascript
{
  _id: ObjectId,
  assembly: ObjectId, // Referencia a Assembly
  name: String, // Nombre único por asamblea
  fileName: String, // Nombre del archivo en el servidor
  originalFileName: String, // Nombre original
  filePath: String, // Ruta relativa del archivo
  fileSize: Number, // Tamaño en bytes
  mimeType: String, // application/pdf, image/jpeg, image/png
  uploadedBy: ObjectId, // Referencia a User
  uploadedAt: Date,
  status: String, // pending, approved, rejected
  validatedBy: ObjectId, // Referencia a User (admin)
  validatedAt: Date,
  observations: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: `documentvalidationhistories`

```javascript
{
  _id: ObjectId,
  documentId: ObjectId, // Referencia a AssemblyDocument
  assembly: ObjectId, // Referencia a Assembly
  action: String, // upload, approve, reject, delete
  userId: ObjectId, // Usuario que realizó la acción
  previousStatus: String, // pending, approved, rejected
  newStatus: String, // pending, approved, rejected
  observations: String, // Observaciones (obligatorio si es rechazo)
  createdAt: Date
}
```

---

## Consultas útiles en MongoDB

### Ver todos los documentos de una asamblea

```javascript
db.assemblydocuments.find({ assembly: ObjectId("65a1b2c3d4e5f6g7h8i9j0k1") });
```

### Ver documentos pendientes de validación

```javascript
db.assemblydocuments.find({ status: "pending" });
```

### Ver historial de validación de un documento

```javascript
db.documentvalidationhistories
  .find({ documentId: ObjectId("65a1b2c3d4e5f6g7h8i9j0k3") })
  .sort({ createdAt: -1 });
```

### Ver historial de validaciones por asamblea

```javascript
db.documentvalidationhistories
  .find({ assembly: ObjectId("65a1b2c3d4e5f6g7h8i9j0k1") })
  .sort({ createdAt: -1 });
```

### Ver documentos cargados por un usuario

```javascript
db.assemblydocuments.find({ uploadedBy: ObjectId("65a1b2c3d4e5f6g7h8i9j0k2") });
```

### Ver documentos validados por un administrador

```javascript
db.assemblydocuments.find({
  validatedBy: ObjectId("65a1b2c3d4e5f6g7h8i9j0k4"),
});
```

---

## Notas importantes

1. **Autenticación:** Todos los endpoints requieren un token JWT válido en el header `Authorization: Bearer <token>`

2. **Permisos:**

   - Solo administradores pueden cargar, eliminar y validar documentos
   - Los participantes solo pueden ver documentos aprobados
   - Los administradores pueden ver todos los documentos (pendientes, aprobados, rechazados)

3. **Validaciones:**

   - El nombre del documento debe ser único por asamblea
   - Formatos permitidos: PDF, JPG, PNG
   - Tamaño máximo: 10MB
   - Si se rechaza un documento, las observaciones son obligatorias

4. **Historial de validaciones:**

   - Se registra automáticamente cada acción (carga, aprobación, rechazo, eliminación)
   - Incluye: validador, fecha, hora, decisión y observaciones
   - El historial se mantiene incluso si el documento es eliminado

5. **Auditoría:**

   - Todas las operaciones se registran en el historial
   - Se guarda información del usuario que realizó la acción
   - Se registran metadatos del archivo (nombre, tamaño, tipo)

6. **Orden de documentos:**

   - Los documentos se ordenan del más reciente al más antiguo (por fecha de carga)

7. **Notificaciones por email:**

   - Se envía automáticamente un email al usuario que cargó el documento cuando es aprobado o rechazado
   - El email de aprobación incluye: nombre del documento, asamblea, validador, fecha y observaciones (si las hay)
   - El email de rechazo incluye: nombre del documento, asamblea, validador, fecha y razones del rechazo
   - Si el envío del email falla, la operación de validación no se ve afectada (se loguea el error)
   - Las notificaciones se envían usando la configuración SMTP definida en las variables de entorno

8. **Trazabilidad completa:**
   - Cada validación queda registrada en la base de datos con trazabilidad completa
   - Campos registrados: validador, fecha, hora, decisión (approved/rejected) y observaciones
   - El historial se mantiene incluso si el documento es eliminado
   - Se puede consultar el historial completo de validaciones de un documento mediante el endpoint `/api/documentos/history/:documentId`
