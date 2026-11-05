# Validación de la Etapa 07 — HU4 Registrar y editar movimiento financiero

Procedimiento para validar la etapa en Windows y en los emuladores del estándar del proyecto:
Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest 28 suites y 419 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e07/hu4-movimientos`. La validación en esos emuladores está pendiente. La integrante
del equipo abrió la app en `Medium_Phone_API_37.0`, sin ejecutar este procedimiento completo.

## Evidencias

Van a `GFP-evidencias\e07\` (G-10), fuera del repositorio, con cuentas sintéticas y sin
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

Resultado esperado: sin errores, 419 pruebas aprobadas y app instalada.

## 2. Pruebas manuales

Ejecutar cada caso en ambos emuladores y anotar el resultado.

| Caso | Procedimiento y resultado esperado | Estado |
|---|---|---|
| C01 | Crear un gasto y un ingreso válidos; aparece «¡Operación exitosa!» y el botón «Volver al historial» (CA07, CA08). | Pendiente |
| C02 | Guardar con campos vacíos: «Error en los campos ingresados» (CA01, CA13). | Pendiente |
| C03 | Monto 0 o con letras: «Ingrese un monto válido» (CA05). | Pendiente |
| C04 | Fecha de mañana: «La fecha no puede ser futura»; el calendario no permite elegir días futuros (CA04). | Pendiente |
| C05 | Abrir el formulario: la fecha es la de hoy (CA03). | Pendiente |
| C06 | Cambiar a Ingreso: solo Salario, categorías propias de ingreso y Otros (CA02, E07-D1). | Pendiente |
| C07 | Descripción de 251 caracteres: no se admite (CA06). | Pendiente |
| C08 | Limpiar y Cancelar (CA11, CA12). | Pendiente |
| C09 | Eliminar una categoría con movimientos: el modal indica cuántos se reasignan y pasan a Otros conservando su tipo (HU8-CA07c). | Pendiente |
