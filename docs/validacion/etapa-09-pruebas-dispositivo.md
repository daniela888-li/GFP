# Validación de la Etapa 09 — HU6 Visualizar balance financiero

Procedimiento para validar la etapa en Windows y en los emuladores del estándar del proyecto:
Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest 29 suites y 435 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e09/hu6-balance`. La validación en esos emuladores está pendiente. La integrante
del equipo abrió la app en `Medium_Phone_API_37.0`, sin ejecutar este procedimiento completo.

## Evidencias

Van a `GFP-evidencias\e09\` (G-10), fuera del repositorio, con cuentas sintéticas y sin
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

Resultado esperado: sin errores, 435 pruebas aprobadas y app instalada.

## 2. Pruebas manuales

Ejecutar cada caso en ambos emuladores y anotar el resultado.

| Caso | Procedimiento y resultado esperado | Estado |
|---|---|---|
| C01 | Crear ingresos y gastos: los totales se calculan bien (CA01). | Pendiente |
| C02 | Formato `$1.250.000,00` (CA02). | Pendiente |
| C03 | Balance negativo en rojo (CA03). | Pendiente |
| C04 | Crear, editar y eliminar actualizan los totales (CA04). | Pendiente |
| C05 | Filtrar el historial no cambia los totales (E09-D1). | Pendiente |
