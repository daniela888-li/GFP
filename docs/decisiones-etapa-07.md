# Decisiones de la Etapa 07 (HU4 Registrar y editar movimiento financiero)

Fuentes:

- HU4 del documento de historias de usuario
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en
  `trazabilidad.md`, sección «HU4 — criterios de aceptación (Etapa 07)»);
- su prototipo: «Registro de movimiento», «¡Operación exitosa!» y «Editar movimiento», páginas 18
  a 20 de la copia PDF revisada;
- E06-D3, E06-D4 y E06-D7 de `decisiones-etapa-06.md`.

**Estado:** propuesta. Ninguna decisión está aprobada por el responsable. Las marcadas «Fuentes»
salen directamente de los documentos; las marcadas «Propuesta» necesitan su aprobación.

## Resumen

| Decisión | Asunto | Resolución | Origen |
|---|---|---|---|
| E07-D1 | Categorías por tipo | Cada tipo muestra sus categorías; «Otros» también en Ingreso | Propuesta, exigida por E06-D3 |
| E07-D2 | Nombre de los botones | «Guardar movimiento» y «Actualizar» | Prototipo |
| E07-D3 | Destino de Cancelar y acceso al formulario | Cancelar vuelve al historial; acceso con «+ Nuevo movimiento» | Propuesta |
| E07-D4 | Limpiar formulario frente a «¡Operación exitosa!» | Pantalla de confirmación; el formulario abre limpio al volver | Propuesta |
| E07-D5 | Monto, fecha y mensajes | Centavos, 2 decimales, 12 dígitos enteros | Propuesta |
| E07-D6 | Calendario | Hecho con componentes de React Native, sin dependencia nativa | Propuesta |
| E07-D7 | Barra inferior | Se crea en E07, en las pantallas autenticadas excepto Categorías | Propuesta |
| E07-D8 | Longitud de la descripción | 250 caracteres | HU4-CA06 |

## E07-D1 — Categorías por tipo

Gasto muestra las categorías de gasto y las personalizadas de gasto. Ingreso muestra las de ingreso
y «Otros», que es de tipo Gasto pero debe aceptarse para que un movimiento reasignado pueda
editarse (E06-D3). «Otros» aparece al final. El prototipo muestra una lista sin filtrar con
Salario y Compras juntas; se propone filtrar para evitar combinaciones como «Ingreso / Salud».

Un movimiento conserva su categoría al editarse aunque esta haya cambiado de tipo después.

## E07-D2 — Nombre de los botones

HU4-CA07 dice «Registrar» y el prototipo dice «Guardar movimiento». Se usa el prototipo, que además
evita el término «Registrar», no aceptado por el profesor del curso. Edición: «Actualizar».

**Punto por revisar:** el título «Registro de movimiento» y el mensaje «El movimiento fue
registrado exitosamente» son literales de HU4 y se conservan. Si el profesor también los objeta,
se cambian solo en `movementTexts.ts`.

## E07-D3 — Destino de Cancelar y acceso al formulario

HU4-CA12 permite «la vista principal o el historial». La vista principal tras iniciar sesión es el
historial (E04-D3), así que Cancelar y el botón Atrás de Android vuelven a él. Hasta la Etapa 08,
el acceso es el botón «+ Nuevo movimiento» de la pantalla provisional.

## E07-D4 — Confirmación

HU4-CA09 pide limpiar los campos; el prototipo muestra «¡Operación exitosa!» con «Volver al
historial». Se muestra esa pantalla: el formulario se cierra y al volver a abrirlo está limpio, lo
que cumple ambos. La fila «Comercio» del prototipo se reemplaza por «Categoría», porque HU4 no
tiene ese campo. En edición se sigue el prototipo: mensaje verde en el mismo formulario.

## E07-D5 — Monto, fecha y mensajes

- El monto se guarda como entero en centavos (`amount_cents`), para evitar errores de redondeo.
- Se admiten hasta 12 dígitos enteros y 2 decimales, con punto o coma. Los separadores de miles no
  se admiten: «1.200» se rechaza para no confundir mil doscientos con 1,2.
- La fecha se guarda como `AAAA-MM-DD` en la zona horaria del dispositivo y se muestra como
  `DD/MM/AAAA`. Los años anteriores a 1900 se rechazan.
- Mensajes propuestos, porque HU4 no los define: «Ingrese una fecha válida», «Seleccione una
  fecha», «Seleccione una categoría» y «La descripción admite máximo 250 caracteres».

## E07-D6 — Calendario

El campo Fecha admite escritura manual y un calendario propio. No se añade una librería nativa,
para no recompilar ni sumar otra dependencia. Los días futuros quedan deshabilitados.

## E07-D7 — Barra inferior

HU4 la pide y E06-D4 dejó abierta la etapa en que se crea. Se crea en E07 con Movimientos, Análisis
y Recomendaciones, usando texto sin íconos. Análisis y Recomendaciones se implementan en las
Etapas 11 y 12. E13-D2 agrega después ambas barras a Categorías.

## E07-D8 — Longitud de la descripción

HU4-CA06 fija 250 caracteres; el prototipo muestra un contador «24 / 100». Prevalece el criterio.

## Modelo de datos

Migración 5, tabla `movements`, con `user_id` y `category_id`. La clave foránea hacia `categories`
no borra en cascada (E06-D7). Dos disparadores impiden usar la categoría de otro usuario y uno
impide cambiar el propietario.

## Pendiente para E08

- HU4-CA10: el formulario ya abre en modo edición con `movementId`, pero su punto de entrada es el
  botón «Editar» del historial (HU5).
- Las variantes de edición de HU4-CA07, CA08 y CA12 se verifican de forma integrada en E08.
