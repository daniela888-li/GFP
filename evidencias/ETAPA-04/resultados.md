# Resultados de validacion — Etapa 04 (HU2 Iniciar sesion)

Fecha: 2026-10-26
Dispositivo: Android Emulator — Medium_Phone_API_37.0:5554
Plataforma: Android API 37

## Compilacion

- `npx react-native run-android` ejecutado desde `GFPP\app`
- Build exitoso, app instalada y abierta en emulador

## Verificacion de criterios HU2

| Paso | Criterio | Accion | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | HU2-CA01 | Campos vacios + Iniciar sesion | Mensaje "Ingrese su identificador y contrasena" | Verificado |
| 2 | HU2-CA03 | Correo inexistente + contrasena | Mensaje "Credenciales incorrectas" | Verificado |
| 3 | HU2-CA07 | Tocar "Ver" en campo contrasena | Contrasena visible/oculta alterna | Verificado |
| 4 | HU2-CA08 | Tocar "Crear cuenta" | Navega a pantalla provisional de registro | Verificado |
| 5 | HU2-CA09 | Tocar "Recuperar contrasena" | Navega a pantalla provisional de recuperacion | Verificado |

## Tests automatizados

- `__tests__/services/login/loginService.test.ts`: 10 tests pasados
- `__tests__/services/bootstrap/appServices.test.ts`: 2 tests pasados
- Total: 12 tests, 0 fallos

## Evidencias

Capturas de pantalla del emulador guardadas en esta carpeta.
