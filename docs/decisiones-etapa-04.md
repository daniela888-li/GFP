# Decisiones — Etapa 04 (HU2 Iniciar sesion)

## Decisiones tomadas

| ID | Decision | Fecha | Origen |
|---|---|---|---|
| E04-D1 | El bloqueo por intentos fallidos se aplica por usuario (scope `login`, subject = userId). Se usa LOGIN_THROTTLE_POLICY: 3 intentos, bloqueo de 15 minutos, sin escalado. El bloqueo persiste en la tabla `auth_throttles` de SQLCipher. | 2026-10-27 | plan-etapas.md, attemptThrottle.ts |
| E04-D2 | El campo identificador acepta correo (contiene `@`), documento (normalizado a mayusculas) o telefono (solo digitos). La distincion sigue la logica de `findUserIdByIdentifier` de la Etapa 02. El telefono sin codigo de pais solo se acepta si es univoco (A-ID2). | 2026-10-27 | identityRepository.ts, A-ID2 |
| E04-D3 | Tras iniciar sesion correctamente, el usuario navega a una pantalla principal provisional (HomeScreen) que muestra confirmacion y boton de cerrar sesion. Las pantallas financieras se implementan en etapas posteriores. | 2026-10-27 | plan-etapas.md |
| E04-D4 | La sesion se mantiene en memoria (SessionManager) y no tiene duracion maxima definida. Se cierra con el boton "Cerrar sesion" o al cerrar la aplicacion. La persistencia de sesion entre reinicios queda fuera del alcance de esta etapa. | 2026-10-27 | sessionManager.ts |
| E04-D5 | La contrasena se valida con `isVerifiableCandidate` antes de derivar PBKDF2. Si no cumple el formato minimo, se registra como intento fallido sin derivar. | 2026-10-27 | passwordPolicy.ts |
| E04-D6 | Los enlaces "Crear cuenta" y "Recuperar contrasena" navegan a pantallas provisionales (PendingScreen) que indican la etapa y HU donde se implementaran. | 2026-10-27 | G-07 |

## Decisiones pendientes

| ID | Pregunta | Afecta |
|---|---|---|
| P-E04-D1 | Persistencia de sesion entre reinicios de la app (token en Keystore) | E04-D4, HU2-CA10, HU2-CA11 |
| P-E04-D2 | Duracion maxima de la sesion (timeout de inactividad) | E04-D4 |
