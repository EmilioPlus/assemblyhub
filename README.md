# AssemblyHub

Sistema de gestión de asambleas y votaciones digitales para la administración de eventos corporativos, organizaciones y entidades que requieren procesos de votación seguros y auditables.

## 📋 Descripción

AssemblyHub es una aplicación web completa que permite:

- **Gestión de Asambleas**: Crear, editar y administrar asambleas con participantes registrados
- **Sistema de Votación**: Crear preguntas de votación, gestionar tiempos y visualizar resultados en tiempo real
- **Gestión de Usuarios**: Administración de usuarios con roles (Administrador, Participante, Invitado)
- **Delegados**: Registro de delegados con documentos de poder para representación
- **Auditoría**: Registro completo de todas las acciones para trazabilidad
- **Reportes**: Generación de reportes en PDF y Excel
- **Seguridad**: Autenticación JWT, encriptación de contraseñas, control de acceso basado en roles

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 16 o superior) - [Descargar Node.js](https://nodejs.org/)
- **MongoDB** (versión 4.4 o superior) - [Descargar MongoDB](https://www.mongodb.com/try/download/community)
- **npm** (viene incluido con Node.js) o **yarn**
- **Git** (opcional, para clonar el repositorio)

### Verificar Instalación

```bash
node --version
npm --version
mongod --version
```

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd assemblyhub
```

### 2. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar Dependencias del Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configuración

### Configuración del Backend

1. **Crear archivo `.env` en la carpeta `backend/`:**

```env
# Puerto del servidor
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/assemblyhub

# JWT Configuration
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
MAIL_FROM=AssemblyHub <tu_email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Resend API (alternativa a SMTP)
# RESEND_API_KEY=re_xxxxxxxxxxxxx

# Environment
NODE_ENV=development
```

2. **Generar JWT_SECRET:**

```bash
# En Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# En Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y pégalo en `JWT_SECRET` del archivo `.env`.

### Configuración del Frontend

El frontend está configurado para conectarse automáticamente al backend en `http://localhost:5000`. Si necesitas cambiar esto, modifica el archivo `frontend/src/config/api.ts`.

## 🗄️ Base de Datos

### Iniciar MongoDB

**Windows:**
```bash
# Iniciar MongoDB como servicio
net start MongoDB

# O iniciar manualmente
mongod
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Mac:**
```bash
brew services start mongodb-community
```

### Crear Base de Datos

MongoDB creará automáticamente la base de datos `assemblyhub` cuando el backend se conecte por primera vez.

## 🏃 Ejecución

### Desarrollo

#### 1. Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

#### 2. Iniciar el Frontend

En una nueva terminal:

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Producción

#### 1. Compilar el Backend

```bash
cd backend
npm run build
npm start
```

#### 2. Compilar el Frontend

```bash
cd frontend
npm run build
```

Los archivos estáticos se generarán en `frontend/dist/`

## 📁 Estructura del Proyecto

```
assemblyhub/
├── backend/                 # Servidor backend (Node.js + Express + TypeScript)
│   ├── config/             # Configuraciones
│   │   ├── db.ts          # Configuración de MongoDB
│   │   └── upload.ts      # Configuración de Multer para archivos
│   ├── controllers/        # Controladores (opcional)
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   ├── middlewares/        # Middlewares personalizados
│   │   └── auth.middleware.ts
│   ├── models/            # Modelos de MongoDB (Mongoose)
│   │   ├── Assembly.ts
│   │   ├── User.ts
│   │   ├── Question.ts
│   │   ├── Vote.ts
│   │   ├── Delegate.ts
│   │   ├── LoginAttempt.ts
│   │   └── ... (otros modelos)
│   ├── routes/            # Rutas de la API
│   │   ├── auth.routes.ts
│   │   ├── assembly.routes.ts
│   │   ├── voting.routes.ts
│   │   ├── user.routes.ts
│   │   ├── delegate.routes.ts
│   │   ├── role.routes.ts
│   │   └── reportes.routes.ts
│   ├── utils/             # Utilidades
│   │   └── authMiddleware.ts
│   ├── uploads/           # Archivos subidos (delegados, documentos)
│   ├── index.ts           # Punto de entrada del servidor
│   ├── package.json
│   ├── tsconfig.json
│   └── .env               # Variables de entorno (no versionar)
│
└── frontend/              # Cliente frontend (React + TypeScript + Vite)
    ├── public/            # Archivos estáticos
    │   └── img/
    ├── src/
    │   ├── components/    # Componentes reutilizables
    │   │   └── ProfileModal.tsx
    │   ├── config/        # Configuraciones
    │   │   └── api.ts     # Configuración de endpoints API
    │   ├── contexts/      # Contextos de React
    │   │   └── AuthContext.tsx
    │   ├── hooks/         # Custom hooks
    │   │   └── useUserProfile.ts
    │   ├── pages/         # Páginas/Componentes de ruta
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── CreateAssembly.tsx
    │   │   ├── AdminAssemblies.tsx
    │   │   ├── CreateVoting.tsx
    │   │   ├── Voting.tsx
    │   │   ├── DelegateRegistration.tsx
    │   │   ├── RoleManagement.tsx
    │   │   └── ... (otras páginas)
    │   ├── services/      # Servicios API
    │   │   └── apiService.ts
    │   ├── Styles/        # Estilos con styled-components
    │   │   ├── Login.styles.tsx
    │   │   ├── Dashboard.styles.tsx
    │   │   └── ... (otros estilos)
    │   ├── types/         # Tipos TypeScript
    │   │   └── index.ts
    │   ├── App.tsx        # Componente principal
    │   ├── main.tsx       # Punto de entrada
    │   └── index.css      # Estilos globales
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## 🔧 Scripts Disponibles

### Backend

```bash
npm run dev          # Iniciar servidor en modo desarrollo
npm run build        # Compilar TypeScript a JavaScript
npm run start        # Iniciar servidor en modo producción
npm run kill-port    # Matar procesos en el puerto 5000
npm run kill-and-dev # Matar procesos y luego iniciar servidor
```

### Frontend

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build de producción
npm run lint         # Ejecutar linter
```

## 🔐 Autenticación y Roles

El sistema utiliza JWT (JSON Web Tokens) para la autenticación. Los roles disponibles son:

- **admin**: Acceso completo al sistema
- **participant**: Acceso al área de participantes, votación e inscripción
- **guest**: Acceso limitado (solo visualización)

## 📡 Endpoints Principales de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Asambleas
- `GET /api/assemblies/listar` - Listar asambleas
- `POST /api/assemblies` - Crear asamblea
- `GET /api/assemblies/detalle/:id` - Obtener detalle de asamblea
- `PUT /api/assemblies/editar/:id` - Editar asamblea
- `DELETE /api/assemblies/eliminar/:id` - Eliminar asamblea

### Votaciones
- `POST /api/votaciones/crear` - Crear pregunta de votación
- `GET /api/votaciones/listar/:asambleaId` - Listar votaciones
- `PUT /api/votaciones/estado/:id` - Activar/Cerrar votación
- `POST /api/votaciones/emitir` - Emitir voto
- `GET /api/votaciones/resultados/:questionId` - Ver resultados

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `PUT /api/users/rol` - Cambiar rol de usuario (admin)
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil

## 🐛 Solución de Problemas

### Error: Puerto 5000 en uso

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# O usar el script del backend
npm run kill-and-dev
```

### Error: MongoDB no conecta

1. Verifica que MongoDB esté corriendo:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux
   sudo systemctl status mongod
   ```

2. Verifica la URI en el archivo `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/assemblyhub
   ```

### Error: JWT_SECRET no configurado

Asegúrate de tener el archivo `.env` en la carpeta `backend/` con la variable `JWT_SECRET` configurada.

### Error: Módulos no encontrados

```bash
# Reinstalar dependencias
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas Importantes

- **Variables de entorno**: Nunca versiones el archivo `.env`. Está en `.gitignore`.
- **Base de datos**: Asegúrate de tener MongoDB corriendo antes de iniciar el backend.
- **Puertos**: El backend usa el puerto 5000 y el frontend el puerto 5173 por defecto.
- **Seguridad**: En producción, cambia `JWT_SECRET` por un valor seguro y aleatorio.
- **Email**: Configura las credenciales SMTP o Resend para el envío de correos.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autores

- **Equipo de Desarrollo AssemblyHub**

## 🙏 Agradecimientos

- MongoDB
- Express.js
- React
- Material-UI
- Vite
- TypeScript

---

**¿Problemas?** Revisa el archivo `backend/TROUBLESHOOTING.md` para más información sobre solución de problemas.

