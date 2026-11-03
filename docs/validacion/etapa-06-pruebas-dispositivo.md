# Validación de la Etapa 06 — HU8 Administrar categorías de movimientos financieros

Registro de las comprobaciones de HU8 en el emulador. A diferencia de la Etapa 04, esta
validación es **manual**: los recorridos se hicieron en la interfaz y cada uno tiene una captura
de pantalla. Las evidencias se guardan fuera del repositorio (G-10, `flujo-de-trabajo.md`) y no
contienen secretos.

## Entorno

| Elemento | Valor |
|---|---|
| Fecha | 2026-11-02 |
| Rama | `e06/hu8-categories` |
| Commits | `350c184` (decisiones y trazabilidad) y `76d5821` (migración 4); la pantalla y el servicio estaban aplicados en el árbol de trabajo, pendientes de commit |
| Dispositivo | Emulador `Medium_Phone_API_37` (`emulator-5554`), compilación de depuración con `npm run android` |
| Pruebas automatizadas previas | `npm test` en Windows: 284/284 con la migración 4; en el entorno de desarrollo, 330/330 con la pantalla y el servicio, además de `typecheck`, `lint` y `format:check` sin errores |
| Carpeta de evidencias | `Documents\imagenes sreen\e06\` (OneDrive del Tecnológico de Antioquia), fuera del repositorio |

## Comprobaciones en dispositivo

| ID | Criterio | Recorrido | Resultado esperado | Evidencia | Resultado |
|---|---|---|---|---|---|
| `HU8-CA01` | HU8-CA01 | Inicio de sesión → «Categorías» (botón de la pantalla provisional del historial, E06-D4) | Las 9 categorías del sistema en el orden de HU8-CA01; Salario «Ingreso» y las demás «Gasto» (E06-D2) | `1. La lista con las 9 categorías y los candados 🔒.png` | PASS |
| `HU8-CA02` | HU8-CA02 | Misma pantalla | Las 9 filas del sistema muestran el candado y no tienen botones de acción | `1. La lista con las 9 categorías y los candados 🔒.png` | PASS |
| `HU8-CA03` | HU8-CA03 | «+ Nueva categoría» → nombre «Salidas», tipo «Gasto», ícono automóvil → «Guardar» | El formulario muestra nombre, tipo e ícono; la categoría aparece en «Mis categorías» con «Editar» y «Eliminar» | `2. El formulario «Nueva categoría» con «Salidas» escrito.png`, `3. «Nada» y «Salidas» en «Mis categorías».png` | PASS |
| `HU8-CA04` | HU8-CA04 | «+ Nueva categoría» → nombre «Salidas», ya existente | Mensaje «La categoría ya existe» bajo el campo y «Guardar» deshabilitado | `4.El error rojo «La categoría ya existe».png` | PASS |
| `HU8-CA05` | HU8-CA05 | Categorías «Varios», «Salidas» y «Salida» con el mismo ícono (automóvil), que también usa «Transporte» | Varias categorías comparten el ícono sin restricción | `6. La lista con «Nada» ya cambiada a «Varios» 1.png`, `7. ¿Está seguro de eliminar esta categoría».png` | PASS |
| `HU8-CA06` | HU8-CA06 | Lápiz de «Nada» → «Editar categoría» → nombre «Varios» e ícono automóvil → «Guardar» | El formulario carga los datos actuales; la lista muestra «Varios» en lugar de «Nada» | `5. La lista con «Nada» ya cambiada a «Varios».png`, `6. La lista con «Nada» ya cambiada a «Varios» 1.png` | PASS |
| `HU8-CA07b` | HU8-CA07b | Caneca de «Nada» | Modal con «¿Está seguro de eliminar esta categoría?», la categoría afectada y la advertencia literal de reasignación a «Otros»; botones «Cancelar» y «Confirmar» | `7. ¿Está seguro de eliminar esta categoría».png` | PASS |
| `HU8-CA07a` | HU8-CA07a | Caneca de «Salidas» → «Confirmar» | La categoría desaparece de «Mis categorías»; las del sistema no cambian | `8. categoria eliminada nueva lista.png` | PASS (ver observación 1) |
| `ISO-E06` | HU8-CA06, E06-D1 | Segunda cuenta → «Categorías» | «Mis categorías» vacía: la segunda cuenta no ve las categorías de la primera | — | NOT RUN (cubierto en Jest: `userIsolation.test.ts`) |

## Observaciones

1. La captura del modal (`7.`) corresponde a «Nada», que después se editó a «Varios» y no se
   eliminó; la categoría eliminada fue «Salidas», cuyo modal no se capturó. Ambas capturas
   muestran por separado el modal (HU8-CA07b) y el resultado de «Confirmar» (HU8-CA07a). Se
   puede repetir el recorrido sobre una misma categoría si el responsable lo exige.
2. «Salida» y «Salidas» se aceptaron como categorías distintas, como corresponde: HU8-CA04 solo
   rechaza nombres iguales sin distinguir mayúsculas y minúsculas.
3. La barra superior del emulador mostró «Fast Refresh disconnected» al detenerse Metro. Es un
   aviso del modo de desarrollo y no afecta el funcionamiento de la app.

## Pendiente

| Comprobación | Motivo |
|---|---|
| `ISO-E06` en el emulador | Falta la captura con una segunda cuenta |
| Android 10 (API 29) y Android 14 (API 34) | El estándar del proyecto (`plan-etapas.md`, criterio común 4) exige la API 29 o superior; esta ejecución usó solo la API 37 |
| HU8-CA07c y HU8-CA08 | Parciales previstos: se verifican en las Etapas 07 y 08 (`trazabilidad.md`) |
