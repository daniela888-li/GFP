# Decisiones de la Etapa 06 (HU8 Administrar categorías de movimientos financieros)

Fuentes: HU8 del documento de historias de usuario
`RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en
`trazabilidad.md`, sección «HU8 — criterios de aceptación (Etapa 06)») y su prototipo (cinco
pantallas: lista de categorías, «Nueva categoría», «Editar categoría», nombre duplicado y modal
de eliminación); HU4 y HU5 en lo que consumen el maestro `categories`; el diseño de identidad
(`arquitectura-identidad.md`), la política de nomenclatura (`nomenclatura.md`) y el flujo de
trabajo (`flujo-de-trabajo.md`).

**Estado de todas las decisiones de este documento:** propuestas el 2026-11-02, **pendientes de
aprobación del responsable**. `plan-etapas.md` exige resolver E06-D1 a E06-D5 antes de
implementar. Ninguna propuesta cambia un criterio literal ni una decisión aprobada. Las
discrepancias entre el texto de HU8 y el prototipo se deciden una por una (sin regla general de
precedencia, `plan-etapas.md`).

## E06-D1 — Categorías personalizadas por usuario o globales

- **Requisito:** HU8: «Como usuario autenticado, necesito administrar el catálogo de categorías (crear, editar y eliminar categorías personalizadas)». HU8-CA06: «El usuario solo podrá editar […] las categorías creadas por él mismo». HU8-CA04: no se permite un nombre «que ya exista en la base de datos […] independiente de si es del sistema o personalizada». HU2-CA11 y E02-D4: los datos de cada usuario están aislados en la base compartida.
- **Alternativas:** (a) categorías personalizadas globales, visibles y utilizables por todas las cuentas del dispositivo; (b) categorías personalizadas propias de cada usuario (`user_id`), con las 9 del sistema compartidas.
- **Propuesta:** (b). HU8-CA06 asocia cada categoría a quien la creó, y `arquitectura-identidad.md` (sección 1) ya prevé que «HU8 añadirá sus tablas con `user_id`» y que las categorías del sistema estén «compartidas en una tabla».
- **Consecuencia en HU8-CA04 (discrepancia que se somete a decisión):** leído literalmente, «que ya exista en la base de datos» haría que un usuario no pudiera crear «Mascotas» si otra cuenta del dispositivo ya la tiene, y el mensaje «La categoría ya existe» le revelaría datos de otra cuenta, en contra del aislamiento de HU2-CA11. Se propone comprobar el duplicado contra **las 9 categorías del sistema y las categorías personalizadas del mismo usuario**. Así se cumple la parte del criterio que distingue «del sistema o personalizada» sin cruzar datos entre cuentas.
- **Implementación:** columna `user_id` nula solo en las filas del sistema (`is_system = 1`); índices únicos parciales y un disparador que impide que una categoría personalizada repita el nombre de una del sistema (ver «Propuesta técnica»).

## E06-D2 — Tipo de las categorías del sistema

- **Requisito:** HU8-CA01 enumera las 9 categorías (Alimentación, Transporte, Vivienda, Entretenimiento, Salud, Educación, Compras, Salario y Otros) sin indicar su tipo. El campo «Tipo de categoría» es «Selector (Ingreso o Gasto)».
- **Propuesta:** adoptar los tipos del prototipo (pantalla de lista): **Salario = Ingreso**; las otras 8, incluida **Otros, = Gasto**. El texto no define el tipo y el prototipo es la única fuente que lo hace.
- **Íconos de las categorías del sistema:** los del prototipo (ver E06-D5).

## E06-D3 — Reasignación a «Otros» de una categoría de ingreso

- **Requisito:** HU8-CA07c: al confirmar, los movimientos vinculados «cambian automáticamente su categoría asociada al ID de "Otros"». HU8-CA01 fija una sola categoría «Otros» y E06-D2 la propone de tipo Gasto.
- **Problema:** si se elimina una categoría personalizada de tipo Ingreso (por ejemplo «Freelance»), sus movimientos de ingreso quedan asociados a «Otros», que es de tipo Gasto.
- **Alternativas:** (a) crear una décima categoría «Otros ingresos», lo que contradice la lista literal de 9 categorías de HU8-CA01; (b) bloquear la eliminación de categorías de ingreso con movimientos, lo que contradice HU8-CA07c; (c) reasignar siempre a la única «Otros», conservando el tipo propio de cada movimiento (HU4 registra el «Tipo de movimiento» como campo independiente de la categoría).
- **Propuesta:** (c). El balance y los análisis (HU6, HU9 y HU10) se calculan con el tipo del movimiento, no con el de la categoría, así que la reasignación no altera ingresos ni gastos.
- **Efecto en la Etapa 07 (a coordinar con E07-D1 «filtrado de categorías por tipo»):** si el selector de HU4 filtra las categorías por tipo, «Otros» debe ofrecerse también para los ingresos, o un movimiento de ingreso reasignado no podría editarse sin cambiar su categoría. Se deja como recomendación para E07-D1; E06 no implementa HU4.

## E06-D4 — Acceso a la pantalla «Categorías»

- **Requisito:** HU8 no define desde dónde se abre la pantalla. La barra inferior de HU8 solo tiene «Movimientos», «Análisis» y «Recomendaciones». En el prototipo, la pantalla «Categorías» se muestra con la pestaña «Movimientos» activa.
- **Situación actual:** tras iniciar sesión se abre `movementHistory` (E04-D3), que todavía es la pantalla provisional de G-07, y no existe barra inferior.
- **Propuesta:**
  1. «Categorías» pertenece a la sección «Movimientos» y se abre desde el historial (HU5) con un botón «Categorías».
  2. Mientras HU5 no exista, la pantalla provisional de `movementHistory` muestra ese botón, como único acceso, para poder validar HU8 en el emulador. En la Etapa 08 el botón se traslada a la pantalla real del historial.
  3. La pantalla «Categorías» incluye un control «Volver» que regresa a `movementHistory`.
- **Barra inferior:** es un componente común a HU4, HU5, HU7, HU8, HU9 y HU10, y sus destinos «Análisis» y «Recomendaciones» aún no existen. Se propone **no** implementarla en E06 y decidir en qué etapa se crea como componente compartido (ver E06-D8).

## E06-D5 — Catálogo de íconos

- **Requisito:** «Selector de íconos predefinidos» e «Ícono: Selector de catálogo de iconos disponibles». HU8-CA05: «Múltiples categorías pueden compartir el mismo ícono gráfico sin restricción».
- **Catálogo del prototipo (selector, 12 íconos):** carrito, casa, automóvil, cubiertos, corazón, libro, regalo, huella de mascota, pesa, maletín, avión y «más» (tres puntos). En la lista aparecen además los de las categorías del sistema: control de juego (Entretenimiento), bolsa de compras (Compras) y billetera o sobre (Salario).
- **Propuesta de catálogo** (identificador técnico en inglés, que es lo que se guarda en `categories.icon`):

| Identificador | Ícono | Uso inicial |
|---|---|---|
| `food` | Cubiertos | Alimentación |
| `car` | Automóvil | Transporte |
| `home` | Casa | Vivienda |
| `gamepad` | Control de juego | Entretenimiento |
| `heart` | Corazón | Salud |
| `book` | Libro | Educación |
| `shopping-bag` | Bolsa de compras | Compras |
| `wallet` | Billetera | Salario |
| `more` | Tres puntos | Otros |
| `cart` | Carrito | Selector |
| `gift` | Regalo | Selector |
| `pet` | Huella de mascota | Selector |
| `dumbbell` | Pesa | Selector |
| `briefcase` | Maletín | Selector |
| `plane` | Avión | Selector |

El selector muestra los 15 íconos, de modo que las personalizadas también puedan reutilizar los
de las categorías del sistema (HU8-CA05).

- **Representación gráfica (requiere decisión del responsable):** el proyecto no tiene ninguna biblioteca de íconos (`package.json`).
  - (a) **Emoji o símbolos Unicode**, sin dependencias nuevas. El aspecto difiere del prototipo y varía según la versión de Android.
  - (b) **Una biblioteca de íconos vectoriales** (por ejemplo Material Design Icons). Es fiel al prototipo, pero añade una dependencia nativa con fuentes que hay que justificar y validar en Android 10 y 14.
- **Propuesta:** guardar siempre el **identificador**, nunca el glifo, y resolverlo en un único componente de presentación (`CategoryIcon`). Se implementa primero (a). Cambiar a (b) después solo afecta a ese componente, sin migración de datos.

## E06-D6 — Textos y comportamientos que HU8 no define (discrepancias con el prototipo)

Textos literales que se usan tal cual: «Categorías», «Gestiona tus etiquetas de ingresos y
gastos», «Categorías del sistema», «Nueva categoría», «Nombre de la categoría», «Tipo de
categoría», «Ingreso», «Gasto», «Ícono», «Guardar», «Cancelar», «Confirmar», «Editar»,
«Eliminar», «La categoría ya existe», «¿Está seguro de eliminar esta categoría?» y «Los
movimientos asociados a esta categoría serán reasignados automáticamente a la categoría
'Otros'.».

| Situación | Texto de HU8 | Prototipo | Propuesta |
|---|---|---|---|
| Botón de confirmación al crear | «Guardar» | «Crear categoría» en una pantalla y «Guardar» en otra | «Guardar» (texto literal) |
| Botón de confirmación al editar | «Guardar» | «Guardar cambios» | «Guardar» (texto literal) |
| Título del formulario de edición | No definido | «Editar categoría» | «Editar categoría» |
| Subtítulo del formulario de creación | No definido | «Personaliza tus ingresos y gastos.» (solo en una pantalla) | Se usa en creación y edición |
| Encabezado de la segunda sección | No definido | «Mis categorías» | «Mis categorías» |
| Ejemplo en el campo de nombre | No definido | «Ej: Mascotas» | «Ej: Mascotas» |
| Nombre duplicado (HU8-CA04) | «muestra el mensaje: "La categoría ya existe"» | Mensaje bajo el campo, en rojo, y «Guardar» deshabilitado | Mensaje bajo el campo; se comprueba al guardar y al escribir; «Guardar» deshabilitado mientras haya un error |
| Nombre vacío | No definido | — | «Ingresa el nombre de la categoría.» y «Guardar» deshabilitado |
| Número de categorías del sistema | No definido | Contador «9» junto al encabezado (en una pantalla) | No se muestra |
| Línea «N movimientos serán reasignados» del modal | No definido | Se muestra | E06 no la muestra (aún no existen movimientos); se añade en E07 con el recuento real (E06-D7) |
| Error de base de datos | No definido | — | «No fue posible guardar la categoría. Intenta de nuevo» o «No fue posible eliminar la categoría. Intenta de nuevo», sin detalles internos |

## E06-D7 — Alcance de HU8-CA07c y HU8-CA08 en la Etapa 06

- **HU8-CA07c:** la tabla de movimientos se crea en la Etapa 07 (HU4). En E06 la eliminación borra la categoría dentro de una transacción (`CategoryRepository.deleteOwn`). En E07 se añade a esa misma transacción la reasignación `UPDATE movements SET category_id = 'other' WHERE category_id = ? AND user_id = ?`, previa a la eliminación, junto con el recuento de movimientos del modal. Se recomienda para E07 que `movements.category_id` referencie `categories (id)` **sin** `ON DELETE CASCADE`: así una eliminación sin reasignación previa falla en lugar de borrar movimientos. El identificador de «Otros» se publica como constante (`OTHER_CATEGORY_ID = 'other'`).
- **HU8-CA08:** E06 ofrece la consulta `listActiveCategories(session, type?)`, que lee siempre de la base y no guarda copias en caché, así que una categoría creada o editada aparece en la consulta siguiente. La verificación definitiva queda en E07 (formulario de HU4) y E08 (filtros de HU5), como ya prevé `trazabilidad.md`.

## E06-D8 — Barra de navegación inferior

- **Requisito:** HU4, HU5, HU7, HU8, HU9 y HU10 la incluyen con «Movimientos», «Análisis» y «Recomendaciones».
- **Propuesta:** no implementarla en E06, porque sus destinos «Análisis» (HU9) y «Recomendaciones» (HU10) no existen y la pestaña «Movimientos» lleva al historial, que es provisional. Se propone crearla como componente compartido en la Etapa 08 (primera etapa con su destino principal real), o antes, como `fix/<tema>`, si el responsable lo prefiere.

## E06-D9 — Reglas del nombre de la categoría

| Regla | Propuesta | Motivo |
|---|---|---|
| Espacios | Se eliminan al inicio y al final y los espacios internos repetidos se reducen a uno | «Mascotas» y « Mascotas » no deben ser dos categorías |
| Longitud | Entre 1 y 40 caracteres, después de recortar | La tarjeta del prototipo muestra nombres cortos; HU8 no fija un máximo |
| Caracteres | Cualquier texto, sin saltos de línea | HU8 no restringe |
| Comparación de duplicados | Sin distinguir mayúsculas y minúsculas (`toLocaleLowerCase('es-CO')` y normalización Unicode NFC), guardada en `name_normalized` | HU8-CA04. El `lower()` de SQLite solo convierte letras ASCII, por eso la clave se calcula en TypeScript |
| Tildes | Se distinguen («Alimentacion» ≠ «Alimentación») | HU8-CA04 solo pide no distinguir mayúsculas; ignorar tildes amplía el criterio. Se somete a decisión |
| Orden de «Mis categorías» | Por fecha de creación, de la más antigua a la más reciente | Coincide con el prototipo (Mascotas, Freelance, Gimnasio) |

---

## Propuesta técnica

### Rama y entrega

- Rama: `e06/hu8-categories`, creada desde `main` en `bc824fe` (`flujo-de-trabajo.md`, sección 2).
- Commits en inglés con Conventional Commits (`feat:`, `test:`, `docs:`).
- La entrega al repositorio canónico se hace por el mecanismo que indique el responsable (bundle en `transfer\e06\` o rama en un fork), con el commit padre `bc824fe`.

### Coordinación con las etapas paralelas

- **Número de migración:** la tabla `categories` se propone como **migración 4**. Las migraciones deben ser consecutivas (`migrator.ts`); si la Etapa 05 necesita una migración, hay que acordar el orden antes de integrar, porque dos migraciones 4 distintas son incompatibles.
- **Etapa 07:** consume `categories`, `OTHER_CATEGORY_ID`, `listActiveCategories()` y el punto de extensión de `deleteOwn` (E06-D7).

### Modelo de datos (migración 4 `categories-schema-and-system-seed`)

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 36),
  user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
  is_system INTEGER NOT NULL CHECK (is_system IN (0, 1)),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  name_normalized TEXT NOT NULL CHECK (length(name_normalized) BETWEEN 1 AND 40),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL CHECK (length(icon) BETWEEN 1 AND 30),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK ((is_system = 1 AND user_id IS NULL) OR (is_system = 0 AND user_id IS NOT NULL))
) STRICT;
CREATE UNIQUE INDEX ux_categories_system_name_normalized
  ON categories (name_normalized) WHERE is_system = 1;
CREATE UNIQUE INDEX ux_categories_user_id_name_normalized
  ON categories (user_id, name_normalized) WHERE user_id IS NOT NULL;
CREATE INDEX ix_categories_user_id ON categories (user_id);
```

Disparadores (defensa en profundidad, además de la validación del servicio):

| Disparador | Efecto | Criterio |
|---|---|---|
| `tr_categories_system_update` | `BEFORE UPDATE` de una fila con `OLD.is_system = 1` → `RAISE(ABORT, 'system_category_protected')` | HU8-CA02 |
| `tr_categories_system_delete` | `BEFORE DELETE` de una fila con `OLD.is_system = 1` → `RAISE(ABORT, 'system_category_protected')` | HU8-CA02, CA07a |
| `tr_categories_system_name_insert` y `_update` | Una categoría personalizada con el `name_normalized` de una del sistema → `RAISE(ABORT, 'category_name_taken')` | HU8-CA04 |

Carga inicial (HU8-CA01): la misma migración inserta las 9 categorías con identificadores fijos
(`food`, `transport`, `housing`, `entertainment`, `health`, `education`, `shopping`, `salary`,
`other`), `is_system = 1`, `user_id` nulo, `sort_order` de 1 a 9 y `created_at = updated_at = 0`
(la migración debe ser determinista para su suma SHA-256). La migración solo se aplica una vez y
se aplica sobre la tabla recién creada, por lo tanto vacía; esto cumple «si la tabla categories
está vacía». Las categorías personalizadas usan UUID v4 (`randomUuid`).

### Archivos

| Capa (C4) | Archivo | Contenido | Criterios |
|---|---|---|---|
| Infraestructura | `app/src/infrastructure/database/categoryCatalogs.ts` (nuevo) | 9 categorías del sistema, catálogo de 15 íconos, `OTHER_CATEGORY_ID` | CA01, CA05 |
| Infraestructura | `app/src/infrastructure/database/migrations.ts` (migración 4) | Tabla, índices, disparadores y carga inicial | CA01, CA02, CA04 |
| Infraestructura | `app/src/infrastructure/database/repositories/categoryRepository.ts` (nuevo) | `extends OwnedRepository`: `listForOwner`, `createOwn`, `updateOwn`, `deleteOwn`; ninguna operación recibe un `userId` | CA03, CA06, CA07a, CA08 |
| Lógica de negocio | `app/src/business/categories/categoryRules.ts` (nuevo) | Normalización y validación del nombre, tipo e ícono | CA03, CA04, CA05 |
| Lógica de negocio | `app/src/business/categories/categoryManagement.ts` (nuevo) | `CategoryGateway` y `CategoryManagementService`, con resultados tipados (`created`, `invalid_input`, `duplicate_name`, `not_found`, `protected`, `failed`) | CA02 a CA07a |
| Servicios | `app/src/services/appServices.ts` y `nativeAppServices.ts` | Se añade `categories: CategoryGateway` | — |
| Presentación | `app/src/presentation/categories/CategoriesScreen.tsx` (nuevo) | Cabecera, «+ Nueva categoría», secciones «Categorías del sistema» (candado) y «Mis categorías» (Editar y Eliminar) | CA02, CA06, CA07a |
| Presentación | `app/src/presentation/categories/CategoryFormSheet.tsx` (nuevo) | Formulario de creación y edición: nombre, selector Ingreso/Gasto e íconos | CA03 a CA06 |
| Presentación | `app/src/presentation/categories/CategoryIcon.tsx` e `IconPicker.tsx` (nuevos) | Identificador del catálogo → glifo (E06-D5) | CA05 |
| Presentación | `app/src/presentation/categories/categoryTexts.ts` (nuevo) | Textos literales y propuestos (E06-D6) | CA04, CA07b |
| Presentación | `app/src/presentation/components/MessageDialog.tsx` | Se reutiliza para el modal de eliminación (título, advertencia, «Cancelar», «Confirmar») | CA07b |
| Navegación | `routes.ts` (`categories.implemented = true`), `AppNavigator.tsx` y `ProvisionalScreen.tsx` (botón «Categorías» solo en `movementHistory`) | Acceso de E06-D4 con sesión obligatoria | HU2-CA10 |

### Pruebas

| Archivo | Tipo | Comprueba |
|---|---|---|
| `__tests__/infrastructure/categoryMigration.test.ts` | I | La migración 4 crea las 9 categorías con tipos e íconos; se aplica una sola vez; suma SHA-256 estable; las migraciones 1 a 3 no cambian |
| `__tests__/infrastructure/categoryRepository.test.ts` | I | Los disparadores impiden editar o eliminar las categorías del sistema incluso con SQL directo; los índices únicos; la cascada al eliminar un usuario |
| `__tests__/business/categoryRules.test.ts` | U | Recorte, longitud, mayúsculas y minúsculas, NFC, tildes, tipo e ícono válidos |
| `__tests__/business/categoryManagement.test.ts` | U, I | Crear, editar y eliminar; duplicados frente al sistema y frente a las propias («alimentación», «MASCOTAS»); íconos repetidos; categoría ajena → `not_found`; categoría del sistema → `protected`; nada se escribe sin sesión |
| `__tests__/services/session/userIsolation.test.ts` (ampliación) | I | Dos usuarios: no ven, no editan ni eliminan las categorías del otro; el mismo nombre está permitido en cuentas distintas (E06-D1); sesión anterior rechazada |
| `__tests__/presentation/CategoriesScreen.test.tsx` | C | Textos literales; candado sin botones en las 9 filas del sistema; formulario; mensaje «La categoría ya existe»; modal con su texto literal; «Cancelar» no elimina; «Confirmar» elimina y refresca la lista |
| `__tests__/App.test.tsx` (ampliación) | C | `categories` exige sesión; se abre desde el historial provisional; regresión de HU1 y HU2 |

Además: `npm run typecheck`, `npm run lint`, `npm run format:check` y `npm test` sin fallos, y
recorrido en el emulador de Android 10 (API 29) y Android 14 (API 34), con evidencias en
`GFP-evidencias\e06\` (cuentas sintéticas, sin secretos).

### Recorridos previstos en el dispositivo

| ID | Recorrido |
|---|---|
| `HU8-CA01` | Instalación limpia → registro → inicio de sesión → «Categorías»: 9 categorías del sistema con su tipo |
| `HU8-CA02` | Las filas del sistema muestran el candado y no tienen botones de acción |
| `HU8-CA03` | Crear «Mascotas», Gasto, huella; aparece en «Mis categorías» |
| `HU8-CA04` | Crear «alimentación» y «MASCOTAS» → «La categoría ya existe»; editar otra categoría con un nombre existente → mismo mensaje |
| `HU8-CA05` | Crear «Gimnasio» con el mismo ícono que otra categoría |
| `HU8-CA06` | Editar el nombre, el tipo y el ícono de una categoría propia; reiniciar la app y comprobar que persiste |
| `HU8-CA07a/b` | «Eliminar» → modal con el texto literal; «Cancelar» la conserva; «Confirmar» la elimina |
| `ISO-E06` | Una segunda cuenta en el mismo dispositivo no ve las categorías de la primera |

### Riesgos

| Riesgo | Mitigación |
|---|---|
| Colisión de migraciones con la Etapa 05 o la 07 | Acordar la numeración antes de integrar (ver «Coordinación») |
| La Etapa 07 elimina movimientos al borrar una categoría | Recomendación de E06-D7: clave foránea sin cascada y reasignación en la misma transacción |
| Los íconos con emoji difieren del prototipo | E06-D5: identificador estable y un único componente que se sustituye |
| Interpretación de HU8-CA04 entre cuentas | E06-D1, sometida a decisión |

### Pendiente del responsable

1. Aprobar o ajustar E06-D1 a E06-D9.
2. Elegir la representación de los íconos (E06-D5 (a) o (b)).
3. Confirmar la numeración de la migración frente a la Etapa 05.
4. Indicar el mecanismo de entrega (bundle o fork).
