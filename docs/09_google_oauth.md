# Configuración de Google OAuth

El código ya incluye el botón **Continuar con Google** y el callback `/auth/callback`. Para que funcione fuera del entorno local, todavía hay que registrar credenciales en Google Cloud y habilitar el proveedor Google en Supabase.

## Ruta rápida

1. En Google Cloud, crea/configura el proyecto OAuth y define la pantalla de consentimiento.
2. Crea credenciales OAuth de tipo **Web application**.
3. En Google, registra como redirect URI autorizado el callback que muestra Supabase para Google.
4. En Supabase Auth, habilita Google y pega el Client ID + Client Secret.
5. En Supabase Auth > URL Configuration, permite las URLs de retorno de la app, por ejemplo:
   - `http://localhost:3000/auth/callback`
   - la URL real de producción con `/auth/callback`

## Comportamiento en la app

- El login llama a Google mediante Supabase OAuth y vuelve a `/auth/callback`.
- Si el correo de Google coincide con una cuenta ya creada, Supabase puede vincular automáticamente esa identidad.
- Si el usuario autenticado no tiene perfil en `public.perfiles`, la app cierra sesión y devuelve un mensaje de acceso no habilitado.

## Nota de operación

Para que un usuario pueda entrar con Google, primero debe existir su cuenta/perfil en el sistema o debe quedar vinculado a una cuenta existente con el mismo correo institucional.
