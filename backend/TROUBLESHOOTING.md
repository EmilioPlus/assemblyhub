# Solución de Problemas - AssemblyHub Backend

## Error 500 en Login

### Problema Común: MongoDB no está corriendo

**Síntoma:**
```
Error 500 (Internal Server Error) en /api/auth/login
```

**Solución:**

1. **Verifica que MongoDB esté corriendo:**
   ```bash
   # En Windows
   net start MongoDB
   
   # O verifica los servicios
   services.msc
   ```

2. **Verifica la conexión:**
   ```bash
   # Prueba conectarte manualmente
   mongosh mongodb://localhost:27017
   ```

3. **Verifica el archivo .env:**
   ```env
   MONGO_URI=mongodb://localhost:27017/assemblyhub
   JWT_SECRET=tu_secreto_aqui
   PORT=5000
   ```

### Problema: JWT_SECRET no configurado

**Síntoma:**
```
Error: JWT_SECRET no está configurado
```

**Solución:**
1. Crea un archivo `.env` en la raíz del backend
2. Agrega: `JWT_SECRET=tu_secreto_seguro_aqui`
3. Reinicia el servidor

### Problema: Puerto 5000 en uso

**Solución:**
```bash
npm run kill-and-dev
```

O cambia el puerto:
```bash
PORT=5001 npm run dev
```

## Verificar el Estado del Servidor

1. **Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Verificar logs del servidor:**
   - Revisa la consola donde está corriendo `npm run dev`
   - Busca mensajes de error específicos

## Errores Comunes

### Error: "MongoDB connection error"
- **Causa:** MongoDB no está corriendo
- **Solución:** Inicia MongoDB

### Error: "JWT_SECRET no está configurado"
- **Causa:** Falta el archivo .env o la variable JWT_SECRET
- **Solución:** Crea/actualiza el archivo .env

### Error: "EADDRINUSE"
- **Causa:** El puerto 5000 ya está en uso
- **Solución:** `npm run kill-and-dev`

