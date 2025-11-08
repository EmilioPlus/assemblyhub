# AssemblyHub Backend

## Instalación

```bash
npm install
```

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Si el puerto está en uso
```bash
# Opción 1: Matar el proceso en el puerto 5000 y luego iniciar
npm run kill-and-dev

# Opción 2: Matar el proceso manualmente
npm run kill-port
npm run dev

# Opción 3: Usar otro puerto
PORT=5001 npm run dev
```

## Scripts disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila TypeScript a JavaScript
- `npm run start` - Inicia el servidor compilado
- `npm run kill-port` - Mata procesos en el puerto 5000
- `npm run kill-and-dev` - Mata procesos en el puerto 5000 y luego inicia el servidor

## Variables de entorno

Crea un archivo `.env` en la raíz del backend con:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/assemblyhub
JWT_SECRET=tu_secreto_jwt_aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
MAIL_FROM=AssemblyHub <tu_email@gmail.com>
FRONTEND_URL=http://localhost:5173
```

## Solución de problemas

### Error: Port already in use
Si obtienes el error `EADDRINUSE`, significa que el puerto 5000 ya está en uso. Puedes:

1. Usar el script automático: `npm run kill-and-dev`
2. Matar el proceso manualmente:
   ```bash
   # Encontrar el proceso
   netstat -ano | findstr :5000
   # Matar el proceso (reemplaza <PID> con el número del proceso)
   taskkill /PID <PID> /F
   ```
3. Cambiar el puerto: `PORT=5001 npm run dev`

