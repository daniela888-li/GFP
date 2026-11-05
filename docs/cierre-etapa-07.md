# Cierre de la Etapa 07 — HU4 Registrar y editar movimiento financiero

**Veredicto: etapa pendiente de cierre.** HU4 está implementada sobre la tabla `movements` y funciona en Jest. HU4-CA10 queda parcial hasta tener su punto de entrada en la Etapa 08. La etapa también completa HU8-CA07c, pendiente desde E06: al eliminar una categoría sus movimientos pasan a «Otros» dentro de la misma transacción.

**Rama de trabajo:** `e07/hu4-movimientos`  
**Fecha del informe:** 2026-11-04

Este informe no aprueba la etapa ni autoriza su integración en `main`: esa decisión es del
responsable.

## Objetivo y alcance

Implementar HU4 Registrar y editar movimiento financiero según sus 13 criterios literales (`trazabilidad.md`).

- Formulario con tipo, monto, fecha, categoría y descripción, con los mensajes literales de la historia.
- Calendario propio y fecha escrita a mano; los días futuros no se pueden elegir.
- Pantalla «¡Operación exitosa!» al crear y mensaje en el formulario al actualizar.
- Barra inferior con Movimientos, Análisis y Recomendaciones.
- Recuento de movimientos en el modal de eliminación de categorías.

Fuera del alcance: el listado de movimientos (HU5), el resumen de totales (HU6) y la carga desde una foto (HU7).

## Decisiones de la etapa

Texto completo en `decisiones-etapa-07.md`. Ninguna está ratificada.

| Decisión | Asunto | Estado |
|---|---|---|
| E07-D1 | Categorías por tipo | Propuesta |
| E07-D2 | Nombre de los botones | Propuesta |
| E07-D3 | Destino de Cancelar y acceso al formulario | Propuesta |
| E07-D4 | Limpiar formulario frente a «¡Operación exitosa!» | Propuesta |
| E07-D5 | Monto, fecha y mensajes | Propuesta |
| E07-D6 | Calendario | Propuesta |
| E07-D7 | Barra inferior | Propuesta |
| E07-D8 | Longitud de la descripción | Propuesta |

## Cambios principales

| Archivo | Cambio |
|---|---|
| `migrations.ts` | Migración 5: tabla `movements`, monto en centavos y disparadores que impiden usar categorías de otro usuario |
| `movementRepository.ts` | Consultas filtradas por el usuario de la sesión |
| `movementRules.ts`, `movementManagement.ts` | Validación y servicio de movimientos |
| `categoryManagement.ts` | Reasignación a «Otros» antes de borrar la categoría |
| `MovementFormScreen.tsx`, `DateField.tsx`, `MovementSuccessScreen.tsx`, `BottomTabs.tsx` | Interfaz de la historia |

## Validación

Jest 28 suites y 419 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e07/hu4-movimientos`.

Esos resultados corresponden a un entorno Linux de desarrollo. Falta repetirlos en el repositorio
canónico.
Los casos manuales de `validacion/etapa-07-pruebas-dispositivo.md` están pendientes en Android 10 y
Android 14.

## Reservas y pendientes

- HU4-CA10 y las variantes de edición dependen del historial.
- HU8-CA07c no se ha ejecutado en emulador.
- El título y el mensaje conservan «registro» y «registrado» por ser literales de HU4; el profesor objetó ese término en los botones.
- La barra inferior usa texto, sin los íconos del prototipo.

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
  `etapa-07-aprobada`.
