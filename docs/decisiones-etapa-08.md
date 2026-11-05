# Decisiones de la Etapa 08 (HU5 Consultar historia de movimientos financieros)

Fuentes: HU5 del documento de historias de usuario y su prototipo (páginas 24 y 25 de la copia PDF
revisada). Criterios literales en `trazabilidad.md`.

**Estado:** propuesta. Ninguna decisión está aprobada por el responsable.

| Decisión | Asunto | Resolución propuesta |
|---|---|---|
| E08-D1 | Borrado físico o lógico | Físico: HU5-CA06 dice «se elimina de la base» y el modal lo declara irreversible |
| E08-D2 | Botón de foto | «Movimiento con foto», como el prototipo; abre la pantalla de HU7 (Etapa 10) |
| E08-D3 | Rango de fechas | Dos campos, Fecha inicio y Fecha fin, opcionales e inclusivos; inicio posterior a fin muestra «La fecha inicio no puede ser posterior a la fecha fin» y conserva la lista |
| E08-D4 | Filtro inicial | Sin filtro. El prototipo muestra «Últimos 30 días», pero «Limpiar filtros» debe mostrar todo el historial |
| E08-D5 | Fecha de las tarjetas | «Hoy», «Ayer» o DD/MM/AAAA, sin hora, porque HU4 no captura hora |
| E08-D6 | Título de la tarjeta | La descripción, si existe; la categoría va en la cabecera con su ícono |
| E08-D7 | Filtro de categorías | Lista completa, sin depender del tipo elegido, porque un movimiento de ingreso puede estar en «Otros» |
| E08-D8 | Navegación Atrás | En pantallas provisionales, Atrás vuelve al historial. En el historial conserva el comportamiento del sistema y no regresa al inicio de sesión |
| E08-D9 | Acceso a Categorías | Se conserva como botón en el historial (E06-D4), aunque el prototipo no lo muestra |

## Fuera de alcance

- El resumen de Ingresos, Gastos y Balance se implementa en HU6 (Etapa 09).
- Los filtros se reinician al volver de otra pantalla.
