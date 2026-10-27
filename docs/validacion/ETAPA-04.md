# Guia de validacion Android — Etapa 04

Ejecutor: Daniela, en Windows. La validacion en emulador confirma que el login
funciona sobre los fundamentos de la Etapa 02.

## Requisitos

- JDK 17 configurado
- Android SDK con build-tools y NDK
- Emulador con API 29 o superior (o dispositivo fisico)
- Node.js y npm instalados
- Dependencias instaladas (`npm ci` en `app/`)

## Paso 1 — Compilar y ejecutar

En PowerShell, desde la carpeta `app/`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm ci
npx react-native start
```

En otra terminal:

```powershell
npx react-native run-android
```

Si Metro no conecta con el emulador:

```powershell
adb reverse tcp:8081 tcp:8081
```

## Paso 2 — Verificacion de criterios HU2

| Paso | Accion | Resultado esperado | CA |
|---|---|---|---|
| 1 | Abrir la app | Pantalla de login con campos identificador y contrasena | CA01 |
| 2 | Dejar campos vacios y presionar "Iniciar sesion" | Mensaje "Ingrese su identificador y contrasena" | CA01 |
| 3 | Ingresar correo valido + contrasena correcta | Navega a pantalla principal con "Sesion iniciada correctamente" | CA02, CA06 |
| 4 | Cerrar sesion e ingresar credenciales incorrectas | Mensaje "Credenciales incorrectas" | CA03 |
| 5 | Repetir credenciales incorrectas 3 veces | Dialogo "Cuenta bloqueada" con tiempo restante | CA04, CA05 |
| 6 | Verificar campo contrasena | Texto oculto por defecto; boton "Ver" lo muestra; "Ocultar" lo oculta | CA07 |
| 7 | Presionar "Crear cuenta" | Pantalla provisional indicando HU1, Etapa 03 | CA08 |
| 8 | Presionar "Recuperar contrasena" | Pantalla provisional indicando HU3, Etapa 05 | CA09 |

## Paso 3 — Pruebas automatizadas

```powershell
cd app
npm test
```

Resultado esperado: todos los tests pasan (exit code 0).

## Paso 4 — Verificacion de calidad de codigo

```powershell
npm run typecheck
npm run lint
npm run format:check
```

Los tres deben pasar sin errores.

## Registro de evidencias

Guardar capturas de pantalla y logs en `evidencias/ETAPA-04/<fecha-hora>/`:
- `captura-login.png` — pantalla de login
- `captura-error.png` — mensaje de credenciales incorrectas
- `captura-bloqueo.png` — dialogo de cuenta bloqueada
- `captura-home.png` — pantalla principal tras login exitoso
- `captura-pending.png` — pantalla provisional
- `jest.log` — salida de pruebas
- `typecheck.log` — salida de verificacion de tipos
- `lint.log` — salida de ESLint
- `format.log` — salida de Prettier
