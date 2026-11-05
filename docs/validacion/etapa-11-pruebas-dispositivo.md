# Validación de la Etapa 11 — HU9 Consultar análisis financiero

Procedimiento para validar la etapa en Windows y en los emuladores del estándar del proyecto:
Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest 33 suites y 483 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e11/hu9-analisis`. La validación en esos emuladores está pendiente. La integrante
del equipo abrió la app en `Medium_Phone_API_37.0`, sin ejecutar este procedimiento completo.

## Evidencias

Van a `GFP-evidencias\e11\` (G-10), fuera del repositorio, con cuentas sintéticas y sin
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

Resultado esperado: sin errores, 483 pruebas aprobadas y app instalada.

## 2. Pruebas manuales

Ejecutar cada caso en ambos emuladores y anotar el resultado.

| Caso | Procedimiento y resultado esperado | Estado |
|---|---|---|
| C01 | Revisar totales por período: mes, 3 meses, año y rango (CA01). | Pendiente |
| C02 | La dona muestra porcentajes; tocar una categoría muestra su monto y abre el historial filtrado (CA02). | Pendiente |
| C03 | Evolución por semana y por mes (CA03). | Pendiente |
| C04 | Cambios en HU4, HU5 y HU7 se reflejan al volver (CA04). | Pendiente |
| C05 | Formato monetario (CA05). | Pendiente |
| C06 | Período sin datos: mensaje literal y sin gráficos (CA06). | Pendiente |
