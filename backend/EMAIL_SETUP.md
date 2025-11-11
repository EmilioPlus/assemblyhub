# Configuración de Email - Gmail

Este documento explica cómo configurar el envío de correos electrónicos usando Gmail.

## ⚠️ Importante: Contraseña de Aplicación

Gmail **NO permite** usar tu contraseña normal para aplicaciones de terceros. Debes crear una **"Contraseña de aplicación"** específica.

## Pasos para Configurar Gmail

### 1. Habilitar la Verificación en Dos Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Navega a **Seguridad** → **Verificación en dos pasos**
3. Sigue las instrucciones para habilitarla (si no está activada)

### 2. Generar una Contraseña de Aplicación

1. Ve a: https://myaccount.google.com/apppasswords
2. O navega: **Seguridad** → **Verificación en dos pasos** → **Contraseñas de aplicaciones**
3. Selecciona:
   - **Aplicación**: "Correo"
   - **Dispositivo**: "Otro (nombre personalizado)" → Escribe "AssemblyHub"
4. Haz clic en **Generar**
5. **Copia la contraseña de 16 caracteres** que aparece (solo se muestra una vez)

### 3. Configurar Variables de Entorno

Edita tu archivo `.env` en la raíz del backend:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jaiberhiguita4@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # ← Pega aquí la contraseña de aplicación (16 caracteres, sin espacios)
MAIL_FROM=AssemblyHub <jaiberhiguita4@gmail.com>
```

**Nota**: La contraseña de aplicación tiene 16 caracteres, generalmente separados en grupos de 4. Puedes copiarla con o sin espacios, ambos funcionan.

### 4. Verificar la Configuración

1. Reinicia el servidor backend
2. Intenta enviar un correo (por ejemplo, recuperar contraseña)
3. Revisa los logs del servidor:
   - ✅ `Servidor SMTP verificado correctamente` = Configuración correcta
   - ❌ `Error al verificar servidor SMTP: EAUTH` = Credenciales incorrectas

## Solución de Problemas

### Error: "EAUTH" o "Invalid login"

- ✅ Verifica que estés usando una **Contraseña de aplicación**, no tu contraseña normal
- ✅ Asegúrate de que la verificación en dos pasos esté activada
- ✅ Verifica que no haya espacios extra en `SMTP_PASS`
- ✅ Verifica que `SMTP_USER` sea tu email completo (ej: `jaiberhiguita4@gmail.com`)

### Error: "Connection timeout"

- ✅ Verifica tu conexión a internet
- ✅ Verifica que el puerto 587 no esté bloqueado por firewall
- ✅ Intenta cambiar `SMTP_PORT=465` y `secure=true` (requiere ajuste en código)

### Los correos no llegan

- ✅ Revisa la carpeta de **Spam/Correo no deseado**
- ✅ Verifica que el email destino sea correcto
- ✅ Revisa los logs del servidor para ver si hay errores
- ✅ Verifica que Gmail no haya bloqueado el acceso (revisa alertas de seguridad en tu cuenta)

## Configuración Alternativa: Otros Servicios SMTP

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu_email@outlook.com
SMTP_PASS=tu_contraseña
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_api_key_de_sendgrid
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu_dominio.mailgun.org
SMTP_PASS=tu_contraseña_de_mailgun
```

## Notas Adicionales

- En desarrollo, si no configuras las credenciales, el sistema usará Ethereal Email (solo para pruebas)
- Los correos de Ethereal no se envían realmente, pero puedes ver un preview URL en los logs
- Para producción, siempre usa un servicio SMTP real (Gmail, SendGrid, Mailgun, etc.)

