# Configuración de Google OAuth para GitHub Pages

## Paso 1: Configurar URLs en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/qpecqvvjyoycsxuvrzge
2. Navega a **Authentication** → **URL Configuration**
3. Configura lo siguiente:

### Site URL
```
https://caserav.github.io/caserozen/
```

### Redirect URLs (añade ambas)
```
https://caserav.github.io/caserozen/**
https://caserav.github.io/caserozen/
```

## Paso 2: Configurar Google OAuth Provider

1. En Supabase, ve a **Authentication** → **Providers**
2. Busca **Google** y haz clic en él
3. Activa el toggle de "Enable Google provider"

### Opción A: Usar las credenciales por defecto de Supabase (RECOMENDADO)
- Simplemente activa el provider
- Supabase usará sus propias credenciales de Google

### Opción B: Usar tus propias credenciales de Google
Si quieres usar tu propia cuenta de Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth 2.0**
5. Configura las URLs autorizadas:
   - **Orígenes autorizados**: `https://caserav.github.io`
   - **URIs de redirección**: `https://qpecqvvjyoycsxuvrzge.supabase.co/auth/v1/callback`
6. Copia el **Client ID** y **Client Secret**
7. Pégalos en la configuración de Google en Supabase

## Paso 3: Verificar

1. Guarda los cambios en Supabase
2. Espera 1-2 minutos para que se propaguen los cambios
3. Recarga tu app en GitHub Pages
4. Intenta iniciar sesión con Google

## IMPORTANTE: Mientras configuras Google

**USA EL LOGIN CON EMAIL/PASSWORD** que ya está funcionando:
1. Haz clic en la pestaña "Registrarse"
2. Crea una cuenta con tu email y contraseña
3. Inicia sesión normalmente

El login con email/password **NO requiere ninguna configuración adicional** y ya funciona.

## Solución de problemas

Si después de configurar Google sigue sin funcionar:

1. Abre la consola del navegador (F12)
2. Busca mensajes de error
3. Verifica que las URLs en Supabase sean exactamente:
   - `https://caserav.github.io/caserozen/` (con la barra final)
   - `https://caserav.github.io/caserozen/**` (con el wildcard)
