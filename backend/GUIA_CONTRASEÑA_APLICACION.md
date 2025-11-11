# 🔐 Guía: Dónde Encontrar la Contraseña de Aplicación de Gmail

## 📍 Ubicación Exacta

### Opción 1: Enlace Directo (Más Rápido)
**Ve directamente a:**
```
https://myaccount.google.com/apppasswords
```

### Opción 2: Navegación Manual

1. **Abre tu navegador** y ve a: https://myaccount.google.com/
2. En el menú lateral izquierdo, haz clic en **"Seguridad"** (Security)
3. Busca la sección **"Cómo iniciar sesión en Google"** (How you sign in to Google)
4. Haz clic en **"Verificación en dos pasos"** (2-Step Verification)
   - ⚠️ **IMPORTANTE**: Si no tienes la verificación en dos pasos activada, primero debes activarla
5. Una vez en "Verificación en dos pasos", desplázate hacia abajo
6. Busca la sección **"Contraseñas de aplicaciones"** (App passwords)
7. Haz clic en **"Contraseñas de aplicaciones"**

## 🎯 Pasos para Generar la Contraseña

Una vez que estés en la página de "Contraseñas de aplicaciones":

1. **Selecciona la aplicación:**
   - Haz clic en el menú desplegable "Seleccionar app"
   - Elige **"Correo"** (Mail)

2. **Selecciona el dispositivo:**
   - Haz clic en el menú desplegable "Seleccionar dispositivo"
   - Elige **"Otro (nombre personalizado)"**
   - Escribe: **"AssemblyHub"** (o cualquier nombre que prefieras)

3. **Genera la contraseña:**
   - Haz clic en el botón **"Generar"** (Generate)

4. **Copia la contraseña:**
   - Google te mostrará una contraseña de **16 caracteres** (ejemplo: `abcd efgh ijkl mnop`)
   - ⚠️ **IMPORTANTE**: Esta contraseña solo se muestra UNA VEZ
   - **Cópiala inmediatamente** y guárdala en un lugar seguro

## 📋 Ejemplo Visual de la Página

```
┌─────────────────────────────────────────┐
│  Contraseñas de aplicaciones            │
├─────────────────────────────────────────┤
│                                         │
│  Seleccionar app: [Correo ▼]           │
│  Seleccionar dispositivo: [Otro... ▼]  │
│  Nombre: [AssemblyHub        ]         │
│                                         │
│  [        Generar        ]              │
│                                         │
└─────────────────────────────────────────┘
```

## ⚠️ Requisitos Previos

**ANTES de poder generar una contraseña de aplicación, debes tener:**

1. ✅ **Verificación en dos pasos activada**
   - Si no la tienes activada, Google te pedirá activarla primero
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en dos pasos"

2. ✅ **Cuenta de Google verificada**

## 🔄 Si No Ves la Opción "Contraseñas de Aplicaciones"

Si no ves la opción "Contraseñas de aplicaciones", puede ser porque:

1. **No tienes verificación en dos pasos activada**
   - Solución: Actívala primero en la sección de Seguridad

2. **Tu cuenta usa una contraseña de aplicación de organización**
   - Solución: Contacta a tu administrador de Google Workspace

3. **Estás usando una cuenta de Google Workspace con políticas restrictivas**
   - Solución: Contacta a tu administrador

## 📝 Después de Obtener la Contraseña

Una vez que tengas la contraseña de 16 caracteres:

1. **Abre tu archivo `.env`** en la raíz del backend
2. **Actualiza estas líneas:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jaiberhiguita4@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # ← Pega aquí la contraseña (puedes quitar los espacios)
MAIL_FROM=AssemblyHub <jaiberhiguita4@gmail.com>
```

3. **Reinicia el servidor backend**

## 🆘 Ayuda Adicional

### Enlace Directo a Contraseñas de Aplicaciones:
👉 **https://myaccount.google.com/apppasswords**

### Si necesitas activar Verificación en Dos Pasos:
👉 **https://myaccount.google.com/security**

### Página Principal de Seguridad:
👉 **https://myaccount.google.com/security**

## 💡 Consejos

- La contraseña de aplicación es diferente a tu contraseña normal de Gmail
- Puedes generar múltiples contraseñas de aplicación (una para cada app)
- Si olvidas o pierdes la contraseña, simplemente genera una nueva
- Las contraseñas de aplicación son más seguras que usar tu contraseña principal

