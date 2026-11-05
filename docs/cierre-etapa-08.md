# Cierre de la Etapa 08 — HU5 Consultar historia de movimientos financieros

**Veredicto: etapa pendiente de cierre.** HU5 reemplaza la pantalla provisional que se abría tras iniciar sesión. Los siete criterios tienen pruebas en Jest, y el botón «Editar» completa el punto de entrada de HU4-CA10.

**Rama de trabajo:** `e08/hu5-historial`  
**Fecha del informe:** 2026-11-04

Este informe no aprueba la etapa ni autoriza su integración en `main`: esa decisión es del
responsable.

## Objetivo y alcance

Implementar HU5 Consultar historia de movimientos financieros según sus 7 criterios literales (`trazabilidad.md`).

- Lista del movimiento más reciente al más antiguo, con ícono de categoría, monto, descripción y fecha.
- Filtros por rango de fechas, tipo y categoría, aplicados a la vez.
- Estado vacío inicial y estado vacío de filtros, con sus textos literales.
- Eliminación con modal y mensaje de confirmación.
- Accesos a Nuevo movimiento, Movimiento con foto y Categorías.

Fuera del alcance: los totales (HU6) y la pantalla de foto (HU7).

## Decisiones de la etapa

Texto completo en `decisiones-etapa-08.md`. Ninguna está ratificada.

| Decisión | Asunto | Estado |
|---|---|---|
| E08-D1 | Borrado físico o lógico | Propuesta |
| E08-D2 | Botón de foto | Propuesta |
| E08-D3 | Rango de fechas | Propuesta |
| E08-D4 | Filtro inicial | Propuesta |
| E08-D5 | Fecha de las tarjetas | Propuesta |
| E08-D6 | Título de la tarjeta | Propuesta |
| E08-D7 | Filtro de categorías | Propuesta |
| E08-D8 | Navegación Atrás | Propuesta |
| E08-D9 | Acceso a Categorías | Propuesta |

## Cambios principales

| Archivo | Cambio |
|---|---|
| `MovementHistoryScreen.tsx` | Pantalla nueva |
| `movementRepository.ts` | `listOwn` con filtros y `deleteOwn`, con borrado físico |
| `AppNavigator.tsx` | El historial real sustituye a la pantalla provisional; Atrás de Android vuelve al historial desde las provisionales |
| `DateField.tsx` | Etiqueta e identificador configurables para reutilizarlo en los filtros |

## Validación

Jest 29 suites y 433 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e08/hu5-historial`.

Esos resultados corresponden a un entorno Linux de desarrollo. Falta repetirlos en el repositorio
canónico.
Los casos manuales de `validacion/etapa-08-pruebas-dispositivo.md` están pendientes en Android 10 y
Android 14.

## Reservas y pendientes

- El prototipo abre con «Últimos 30 días» y la app sin filtro, porque «Limpiar filtros» debe mostrar todo (E08-D4).
- Las tarjetas muestran Hoy, Ayer o la fecha, sin hora, porque HU4 no la captura.
- Los filtros se reinician al salir del historial.

## Criterio común de cierre (`plan-etapas.md`)

| Punto | Estado |
|---|---|
| 1. Criterios en `trazabilidad.md` con estado y evidencia | Parcial: falta la evidencia en emulador |
| 2. Criterios parciales listados | Cumplido |
| 3. Pruebas automatizadas ejecutadas | Cumplido en Linux |
| 4. Compilación e instalación en Android 10 o superior | Pendiente |
| 5. Regresión de etapas anteriores | Solo en Jest |
| 6. Decisiones resueltas | Pendiente del responsable |
| 7. Informe de cierre | Este documento, sin aprobar |

## Pendiente del responsable

- Revisar la rama y ratificar o cambiar las decisiones.
- Ejecutar la validación en Windows y en los emuladores.
- Autorizar la integración con `git merge --no-ff`, la publicación y la etiqueta
  `etapa-08-aprobada`.
