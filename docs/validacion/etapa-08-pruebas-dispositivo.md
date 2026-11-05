# Validación de la Etapa 08 — HU5 Consultar historia de movimientos financieros

Procedimiento para validar la etapa en Windows y en los emuladores del estándar del proyecto:
Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest 29 suites y 433 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e08/hu5-historial`. La validación en esos emuladores está pendiente. La integrante
del equipo abrió la app en `Medium_Phone_API_37.0`, sin ejecutar este procedimiento completo.

## Evidencias

Van a `GFP-evidencias\e08\` (G-10), fuera del repositorio, con cuentas sintéticas y sin
contraseñas ni datos personales.

## 1. Windows: controles y compilación

Desde `app/`, con JDK 17:

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run android
```

Resultado esperado: sin errores, 433 pruebas aprobadas y app instalada.

## 2. Pruebas manuales

Ejecutar cada caso en ambos emuladores y anotar el resultado.

| Caso | Procedimiento y resultado esperado | Estado |
|---|---|---|
| C01 | Sin movimientos: «No hay movimientos registrados». | Pendiente |
| C02 | Con varios movimientos: orden del más reciente al más antiguo (CA01). | Pendiente |
| C03 | El filtro Categoría ofrece el maestro (CA02). | Pendiente |
| C04 | Combinar fechas, tipo y categoría (CA03). | Pendiente |
| C05 | Filtro sin resultados: título y subtítulo literales (CA04). | Pendiente |
| C06 | Fecha inicio posterior a fecha fin: mensaje de E08-D3. | Pendiente |
| C07 | Eliminar: Cancelar conserva; Confirmar borra y muestra «Movimiento eliminado correctamente» (CA05, CA06). | Pendiente |
| C08 | Editar carga los datos, guarda y muestra el mensaje de actualización (CA07, HU4-CA10). | Pendiente |
