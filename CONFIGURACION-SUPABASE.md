# Configuración de Supabase para Móvil y PWA

## IMPORTANTE: URLs de Redirección

Para que la autenticación funcione correctamente en móviles y como PWA, debes configurar las URLs de redirección en Supabase.

### Pasos a seguir:

1. **Ve a tu Dashboard de Supabase**:
   - https://supabase.com/dashboard/project/rplieisbxvruijvnxbya

2. **Navega a Authentication > URL Configuration**:
   - En el menú lateral: Authentication → URL Configuration

3. **Añade las siguientes URLs en "Redirect URLs"**:
   ```
   https://tu-dominio.com/
   https://tu-dominio.com/index.html
   http://localhost:5500/
   http://localhost:5500/index.html
   http://127.0.0.1:5500/
   http://127.0.0.1:5500/index.html
   ```

   **Reemplaza `tu-dominio.com` con la URL real donde está alojada tu aplicación** (por ejemplo, si usas GitHub Pages, Netlify, Vercel, etc.)

4. **Guarda los cambios**

### URLs Comunes según el hosting:

- **GitHub Pages**: `https://tu-usuario.github.io/nombre-repo/`
- **Netlify**: `https://nombre-app.netlify.app/`
- **Vercel**: `https://nombre-app.vercel.app/`
- **Dominio propio**: `https://tudominio.com/`

## Verificar la Configuración

Después de añadir las URLs:

1. Abre la app en tu móvil
2. Haz clic en "Continuar con Google"
3. Revisa la consola del navegador (puedes usar Remote Debugging para móviles):
   - Chrome Android: chrome://inspect
   - Safari iOS: Safari → Develop → Nombre del iPhone

Si ves errores como:
- "redirect_uri not allowed"
- "Invalid redirect URL"

Significa que falta añadir la URL actual en la configuración de Supabase.

## Instalación como PWA

### Android (Chrome):

1. Abre la app en Chrome
2. En el menú (⋮), selecciona "Añadir a pantalla de inicio" o "Instalar app"
3. Confirma la instalación

### iOS (Safari):

1. Abre la app en Safari
2. Toca el botón de compartir (cuadrado con flecha hacia arriba)
3. Desplázate y selecciona "Añadir a pantalla de inicio"
4. Confirma

### Verificar que es una PWA instalable:

La app necesita cumplir estos requisitos:
- ✅ Servirse mediante HTTPS (no HTTP)
- ✅ Tener un manifest.json válido (ya incluido)
- ✅ Tener un service worker registrado (ya incluido)
- ✅ Tener iconos de diferentes tamaños (ya incluidos)

## Solución de Problemas

### El login en móvil no funciona:

1. Verifica que la URL de redirección esté configurada en Supabase
2. Asegúrate de que estás usando HTTPS (no HTTP)
3. Revisa la consola del navegador en busca de errores

### La PWA no se instala:

1. Asegúrate de estar usando HTTPS
2. Verifica que el manifest.json se cargue correctamente
3. Comprueba que el service worker se registre sin errores
4. En algunos navegadores, necesitas visitar la app al menos 2 veces antes de que aparezca la opción de instalación

### El service worker no se actualiza:

1. En Chrome: DevTools → Application → Service Workers → "Unregister"
2. Recarga la página con Ctrl+Shift+R (fuerza la recarga)
3. El nuevo service worker se instalará automáticamente

## Cambios Realizados

### 1. Service Worker (`service-worker.js`)
- Cachea los archivos principales de la app
- Permite que la app funcione offline
- Necesario para PWA

### 2. Manifest Mejorado (`manifest.json`)
- URLs relativas para mejor compatibilidad
- Iconos con formato maskable para Android
- Configuración optimizada para PWA

### 3. Meta Tags para iOS (`index.html`)
- `apple-mobile-web-app-capable`: Permite modo standalone
- `apple-mobile-web-app-status-bar-style`: Estilo de barra de estado
- `apple-touch-icon`: Icono para iOS

### 4. Autenticación Mejorada (`js/auth.js`)
- Mejor manejo de errores
- Logs en consola para debugging
- URL de redirección limpia sin parámetros
- Manejo de eventos de autenticación mejorado

## Testing

Para probar en móvil:

1. **Sube los archivos actualizados a tu hosting**
2. **Abre la URL en tu móvil**
3. **Intenta iniciar sesión con Google**
4. **Intenta instalar la PWA desde el menú del navegador**

Si encuentras problemas, revisa la consola del navegador para ver los mensajes de error detallados.
