# Cierre de la Etapa 04 — HU2 Iniciar sesion

**Veredicto: pendiente de validacion.**

## Alcance implementado

Historia de usuario HU2 (Iniciar sesion), criterios CA01 a CA11 segun
`trazabilidad.md`.

### Archivos creados

#### Capa de servicios

| Archivo | Descripcion |
|---|---|
| `services/bootstrap/appServices.ts` | Tipo AppServices (database, engine, sessions) |
| `services/bootstrap/openNativeAppServices.ts` | Apertura de BD encriptada, motor PBKDF2 y SessionManager |
| `services/login/loginService.ts` | Orquestacion del login: busqueda de usuario, throttle, verificacion PBKDF2, sesion |

#### Capa de presentacion

| Archivo | Descripcion |
|---|---|
| `presentation/theme.ts` | Constantes de colores, espaciado, radio y tipografia |
| `presentation/AppServicesContext.tsx` | React Context para inyeccion de AppServices |
| `presentation/navigation/routes.ts` | Registro de rutas con titulo, historia y etapa |
| `presentation/navigation/Navigator.tsx` | Navegador con manejo de autenticacion y rutas |
| `presentation/components/Button.tsx` | Componente boton con variantes primary/secondary y loading |
| `presentation/components/FormField.tsx` | Campo de formulario con label, error y toggle de visibilidad |
| `presentation/components/Dialog.tsx` | Dialogo modal informativo |
| `presentation/screens/StatusScreen.tsx` | Pantalla de estado para carga y error de arranque |
| `presentation/screens/PendingScreen.tsx` | Pantalla provisional para funcionalidades de etapas futuras |
| `presentation/screens/HomeScreen.tsx` | Pantalla principal provisional post-login |
| `presentation/screens/login/LoginScreen.tsx` | Pantalla de inicio de sesion |

#### Archivo modificado

| Archivo | Descripcion |
|---|---|
| `App.tsx` | Arranque con boot state, inyeccion de servicios y navegador |

### Criterios de aceptacion

| ID | Criterio | Estado |
|---|---|---|
| HU2-CA01 | Identificador + contrasena requeridos | Implementado |
| HU2-CA02 | Validar credenciales contra BD | Implementado |
| HU2-CA03 | Mensaje "Credenciales incorrectas" | Implementado |
| HU2-CA04 | Bloqueo tras 3 intentos (15 min) | Implementado |
| HU2-CA05 | Mensaje de bloqueo con tiempo restante | Implementado |
| HU2-CA06 | Login exitoso navega a pantalla principal | Implementado |
| HU2-CA07 | Contrasena oculta con toggle | Implementado |
| HU2-CA08 | Boton "Crear cuenta" navega a registro | Implementado |
| HU2-CA09 | Link "Recuperar contrasena" | Parcial (pantalla provisional hasta E05) |
| HU2-CA10 | Rutas autenticadas inaccesibles sin sesion | Parcial (verificacion completa en E13) |
| HU2-CA11 | Sesion asociada a unico usuario | Parcial (aislamiento verificado en E13) |

### Decisiones

Resueltas: E04-D1 a E04-D6 en `decisiones-etapa-04.md`.
Pendientes: P-E04-D1 (persistencia de sesion), P-E04-D2 (timeout de sesion).

## Pendiente para cierre

1. Validacion en emulador Android segun `validacion/ETAPA-04.md`
2. Pruebas automatizadas ejecutadas con resultados reales
3. Evidencias en `evidencias/ETAPA-04/`
4. Regresion de etapas anteriores sin fallos
