import re

for file in ['src/components/auth/LoginScreen.tsx', 'src/components/auth/AuthModal.tsx']:
    with open(file, 'r') as f:
        content = f.read()

    search = "showToast(err.message === 'Google Sign-In is not supported in the Android preview yet. Please use your Email and Password.' ? 'El inicio con Google no está soportado en la app Android por ahora. Por favor usa tu correo.' : 'No se pudo abrir el popup de Google. Por favor ingresa con tu correo.', '⚠️');"
    replace = "showToast('Error al iniciar sesión con Google: ' + err.message, '⚠️');"
    
    content = content.replace(search, replace)
    
    with open(file, 'w') as f:
        f.write(content)
