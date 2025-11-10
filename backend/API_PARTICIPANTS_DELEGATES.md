# API de Participantes y Delegados

Este documento describe los endpoints disponibles para gestionar participantes y delegados en las asambleas.

## Autenticación

Todos los endpoints requieren autenticación mediante JWT. Incluye el token en el header:
```
Authorization: Bearer <token>
```

## Endpoints de Participantes

### 1. Listar participantes de una asamblea
**GET** `/api/participants/:assemblyId`

**Descripción:** Obtiene la lista de todos los participantes inscritos en una asamblea, incluyendo información sobre sus delegados (si tienen).

**Permisos:** 
- Administradores: Pueden ver todos los participantes
- Participantes: Solo pueden ver la lista si están inscritos en la asamblea

**Parámetros:**
- `assemblyId` (path): ID de la asamblea

**Respuesta exitosa (200):**
```json
{
  "msg": "Participantes obtenidos exitosamente",
  "assembly": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Asamblea General 2024",
    "startDateTime": "2024-01-15T10:00:00.000Z",
    "endDateTime": "2024-01-15T18:00:00.000Z"
  },
  "totalParticipants": 5,
  "participants": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "documentType": "CC",
      "documentNumber": "1234567890",
      "role": "participant",
      "hasDelegate": true,
      "delegate": {
        "firstName": "María",
        "firstLastName": "González",
        "documentNumber": "9876543210",
        "email": "maria.gonzalez@example.com",
        "sharesDelegated": 100,
        "validationStatus": "approved",
        "validatedBy": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "firstName": "Admin",
          "lastName": "User"
        },
        "validatedAt": "2024-01-10T14:30:00.000Z",
        "notes": "Documento válido"
      }
    }
  ]
}
```

**Errores:**
- `404`: Asamblea no encontrada
- `403`: No tiene permiso para ver los participantes

---

### 2. Obtener detalles de un participante en una asamblea
**GET** `/api/participants/:assemblyId/:participantId`

**Descripción:** Obtiene información detallada de un participante específico en una asamblea, incluyendo su delegado (si tiene) y sus votos (solo para administradores).

**Permisos:**
- Administradores: Pueden ver todos los detalles, incluyendo votos
- Participantes: Solo pueden ver sus propios detalles

**Parámetros:**
- `assemblyId` (path): ID de la asamblea
- `participantId` (path): ID del participante

**Respuesta exitosa (200):**
```json
{
  "msg": "Detalles del participante obtenidos exitosamente",
  "assembly": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Asamblea General 2024",
    "startDateTime": "2024-01-15T10:00:00.000Z",
    "endDateTime": "2024-01-15T18:00:00.000Z"
  },
  "participant": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "documentType": "CC",
    "documentNumber": "1234567890",
    "role": "participant",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "hasDelegate": true,
  "delegate": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "firstName": "María",
    "secondName": "Ana",
    "firstLastName": "González",
    "secondLastName": "López",
    "documentType": "CC",
    "documentNumber": "9876543210",
    "email": "maria.gonzalez@example.com",
    "sharesDelegated": 100,
    "validationStatus": "approved",
    "validatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "firstName": "Admin",
      "lastName": "User"
    },
    "validatedAt": "2024-01-10T14:30:00.000Z",
    "notes": "Documento válido",
    "createdAt": "2024-01-10T14:00:00.000Z"
  },
  "votes": {
    "totalVotes": 3,
    "votes": [
      {
        "questionText": "¿Aprueba el presupuesto?",
        "questionType": "single",
        "order": 1,
        "respuesta": ["sí"],
        "pesoVoto": 100,
        "horaEmision": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Errores:**
- `404`: Asamblea o participante no encontrado
- `400`: El usuario no está inscrito en la asamblea
- `403`: No tiene permiso para ver los detalles

---

### 3. Obtener delegado de un participante
**GET** `/api/participants/:assemblyId/:participantId/delegado`

**Descripción:** Obtiene información del delegado asignado a un participante en una asamblea específica.

**Permisos:**
- Administradores: Pueden consultar cualquier delegado
- Participantes: Solo pueden consultar su propio delegado

**Parámetros:**
- `assemblyId` (path): ID de la asamblea
- `participantId` (path): ID del participante

**Respuesta exitosa (200):**
```json
{
  "msg": "Delegado encontrado",
  "delegate": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "participant": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "documentType": "CC",
      "documentNumber": "1234567890"
    },
    "assembly": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Asamblea General 2024",
      "startDateTime": "2024-01-15T10:00:00.000Z",
      "endDateTime": "2024-01-15T18:00:00.000Z"
    },
    "firstName": "María",
    "firstLastName": "González",
    "documentType": "CC",
    "documentNumber": "9876543210",
    "email": "maria.gonzalez@example.com",
    "sharesDelegated": 100,
    "powerOfAttorneyValidation": {
      "status": "approved",
      "validatedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "firstName": "Admin",
        "lastName": "User"
      },
      "validatedAt": "2024-01-10T14:30:00.000Z",
      "notes": "Documento válido"
    }
  },
  "hasDelegate": true
}
```

**Respuesta si no hay delegado (404):**
```json
{
  "msg": "No se encontró un delegado asignado a este participante para esta asamblea",
  "hasDelegate": false
}
```

**Errores:**
- `404`: Asamblea, participante o delegado no encontrado
- `403`: No tiene permiso para consultar el delegado

---

## Endpoints de Delegados

### 4. Consultar delegado asignado a un participante
**GET** `/api/delegates/:assemblyId/:participantId`

**Descripción:** Consulta el delegado asignado a un participante en una asamblea específica. Este endpoint es equivalente al endpoint de participantes `/api/participants/:assemblyId/:participantId/delegado`.

**Permisos:**
- Administradores: Pueden consultar cualquier delegado
- Participantes: Solo pueden consultar su propio delegado

**Parámetros:**
- `assemblyId` (path): ID de la asamblea
- `participantId` (path): ID del participante

**Respuesta:** Ver endpoint #3

---

### 5. Registrar un nuevo delegado
**POST** `/api/delegates/registrar`

**Descripción:** Registra un nuevo delegado para un participante en una asamblea. Valida que el participante esté inscrito, que no tenga otro delegado, y que el documento de poder sea válido.

**Permisos:** Participantes inscritos en la asamblea

**Body (form-data):**
- `assembly` (string, requerido): ID de la asamblea
- `firstName` (string, requerido): Nombre del delegado
- `secondName` (string, opcional): Segundo nombre del delegado
- `firstLastName` (string, requerido): Primer apellido del delegado
- `secondLastName` (string, opcional): Segundo apellido del delegado
- `documentType` (string, requerido): Tipo de documento (CC, CE, PA, TI)
- `documentNumber` (string, requerido): Número de documento
- `email` (string, requerido): Correo electrónico del delegado
- `sharesDelegated` (number, requerido): Número de acciones a delegar
- `powerOfAttorney` (file, requerido): Archivo PDF del documento de poder (máx. 5MB)

**Validaciones:**
- Solo se permite un delegado por participante y asamblea
- El número de documento del delegado no puede estar ya registrado en la asamblea
- El archivo debe ser PDF y no exceder 5MB
- El número de acciones debe ser mayor a 0 y no exceder 1,000,000

**Respuesta exitosa (201):**
```json
{
  "msg": "Delegado registrado exitosamente. Se ha enviado una notificación al delegado.",
  "delegate": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "participant": "65a1b2c3d4e5f6g7h8i9j0k2",
    "assembly": "65a1b2c3d4e5f6g7h8i9j0k1",
    "firstName": "María",
    "firstLastName": "González",
    "documentType": "CC",
    "documentNumber": "9876543210",
    "email": "maria.gonzalez@example.com",
    "sharesDelegated": 100,
    "powerOfAttorneyValidation": {
      "status": "pending"
    }
  }
}
```

**Errores:**
- `400`: Campos faltantes, validaciones fallidas, o delegado ya existe
- `403`: Usuario no es participante inscrito
- `404`: Asamblea no encontrada

---

### 6. Listar todos los delegados (Admin)
**GET** `/api/delegates/all`

**Descripción:** Lista todos los delegados registrados en el sistema. Permite filtrar por estado de validación y asamblea.

**Permisos:** Solo administradores

**Query parameters:**
- `status` (opcional): Estado de validación (pending, approved, rejected)
- `assembly` (opcional): ID de la asamblea

**Respuesta exitosa (200):**
```json
{
  "delegates": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "participant": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@example.com"
      },
      "assembly": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Asamblea General 2024",
        "startDateTime": "2024-01-15T10:00:00.000Z",
        "endDateTime": "2024-01-15T18:00:00.000Z"
      },
      "firstName": "María",
      "firstLastName": "González",
      "documentNumber": "9876543210",
      "email": "maria.gonzalez@example.com",
      "sharesDelegated": 100,
      "powerOfAttorneyValidation": {
        "status": "approved",
        "validatedBy": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "firstName": "Admin",
          "lastName": "User"
        },
        "validatedAt": "2024-01-10T14:30:00.000Z"
      }
    }
  ]
}
```

---

### 7. Obtener delegados del participante actual
**GET** `/api/delegates/my-delegates`

**Descripción:** Obtiene todos los delegados registrados por el participante autenticado.

**Permisos:** Participantes

**Respuesta exitosa (200):**
```json
{
  "delegates": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "assembly": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Asamblea General 2024",
        "startDateTime": "2024-01-15T10:00:00.000Z",
        "endDateTime": "2024-01-15T18:00:00.000Z"
      },
      "firstName": "María",
      "firstLastName": "González",
      "powerOfAttorneyValidation": {
        "status": "approved",
        "validatedBy": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "firstName": "Admin",
          "lastName": "User"
        }
      }
    }
  ]
}
```

---

### 8. Validar documento de poder (Admin)
**PUT** `/api/delegates/validar/:id`

**Descripción:** Valida o rechaza el documento de poder de un delegado.

**Permisos:** Solo administradores

**Parámetros:**
- `id` (path): ID del delegado

**Body:**
```json
{
  "status": "approved", // o "rejected"
  "notes": "Documento válido" // opcional
}
```

**Respuesta exitosa (200):**
```json
{
  "msg": "Documento validado exitosamente",
  "delegate": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "powerOfAttorneyValidation": {
      "status": "approved",
      "validatedBy": "65a1b2c3d4e5f6g7h8i9j0k3",
      "validatedAt": "2024-01-10T14:30:00.000Z",
      "notes": "Documento válido"
    }
  }
}
```

---

### 9. Obtener documento de poder (Admin)
**GET** `/api/delegates/documento/:id`

**Descripción:** Descarga el documento de poder de un delegado.

**Permisos:** Solo administradores

**Parámetros:**
- `id` (path): ID del delegado

**Respuesta:** Archivo PDF

---

### 10. Obtener historial de auditoría (Admin)
**GET** `/api/delegates/auditoria`

**Descripción:** Obtiene el historial de auditoría de registros y validaciones de delegados.

**Permisos:** Solo administradores

**Query parameters:**
- `participant` (opcional): ID del participante
- `assembly` (opcional): ID de la asamblea
- `action` (opcional): Acción (register, validate)

**Respuesta exitosa (200):**
```json
{
  "logs": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "participant": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@example.com"
      },
      "delegate": "65a1b2c3d4e5f6g7h8i9j0k4",
      "assembly": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Asamblea General 2024"
      },
      "action": "register",
      "registeredBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@example.com"
      },
      "documentStatus": "pending",
      "emailSent": true,
      "emailSentAt": "2024-01-10T14:00:00.000Z",
      "createdAt": "2024-01-10T14:00:00.000Z"
    }
  ]
}
```

---

## Ejemplos de uso en Postman

### 1. Listar participantes de una asamblea
```
GET http://localhost:5000/api/participants/65a1b2c3d4e5f6g7h8i9j0k1
Headers:
  Authorization: Bearer <token>
```

### 2. Obtener detalles de un participante
```
GET http://localhost:5000/api/participants/65a1b2c3d4e5f6g7h8i9j0k1/65a1b2c3d4e5f6g7h8i9j0k2
Headers:
  Authorization: Bearer <token>
```

### 3. Consultar delegado de un participante
```
GET http://localhost:5000/api/delegates/65a1b2c3d4e5f6g7h8i9j0k1/65a1b2c3d4e5f6g7h8i9j0k2
Headers:
  Authorization: Bearer <token>
```

### 4. Registrar un nuevo delegado
```
POST http://localhost:5000/api/delegates/registrar
Headers:
  Authorization: Bearer <token>
Body (form-data):
  assembly: 65a1b2c3d4e5f6g7h8i9j0k1
  firstName: María
  firstLastName: González
  documentType: CC
  documentNumber: 9876543210
  email: maria.gonzalez@example.com
  sharesDelegated: 100
  powerOfAttorney: <archivo PDF>
```

### 5. Validar documento de poder
```
PUT http://localhost:5000/api/delegates/validar/65a1b2c3d4e5f6g7h8i9j0k4
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "status": "approved",
  "notes": "Documento válido"
}
```

---

## Notas importantes

1. **Autenticación:** Todos los endpoints requieren un token JWT válido en el header `Authorization: Bearer <token>`

2. **Permisos:** 
   - Los administradores tienen acceso completo a todos los endpoints
   - Los participantes solo pueden ver y gestionar sus propios datos y delegados

3. **Validaciones:**
   - Solo se permite un delegado por participante y asamblea
   - El documento de poder debe ser PDF y no exceder 5MB
   - El número de documento del delegado debe ser único por asamblea
   - El participante debe estar inscrito en la asamblea para registrar un delegado

4. **Notificaciones:** Al registrar un delegado, se envía automáticamente un correo electrónico al delegado con sus credenciales y detalles de la asamblea

5. **Auditoría:** Todas las acciones de registro y validación se registran en el historial de auditoría para trazabilidad

