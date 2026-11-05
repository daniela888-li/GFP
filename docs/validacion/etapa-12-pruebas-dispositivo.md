# Validación de la Etapa 12 — HU10 Consultar recomendaciones financieras automáticas

Procedimiento para validar la etapa en Windows y en los emuladores del estándar del proyecto:
Android 10 (API 29, AVD `Pixel_4_Android_10`) y Android 14 (API 34, AVD `Pixel_4`).

**Estado (2026-11-04):** Jest 34 suites y 492 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama `e12/hu10-recomendaciones`. La validación en esos emuladores está pendiente. La integrante
del equipo abrió la app en `Medium_Phone_API_37.0`, sin ejecutar este procedimiento completo.

## Evidencias

Van a `GFP-evidencias\e12\` (G-10), fuera del repositorio, con cuentas sintéticas y sin
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

Resultado esperado: sin errores, 492 pruebas aprobadas y app instalada.

## 2. Pruebas manuales

Ejecutar cada caso en ambos emuladores y anotar el resultado.

| Caso | Procedimiento y resultado esperado | Estado |
|---|---|---|
| C01 | Con gastos mayores a ingresos en el mes: Regla 1 (CA02a). | Pendiente |
| C02 | Una categoría con más del 50 %: Regla 2 (CA02b). | Pendiente |
| C03 | Una categoría que sube más de 30 %: Regla 3 (CA02c). | Pendiente |
| C04 | Cada tarjeta muestra título, descripción, datos de origen e ícono (CA03). | Pendiente |
| C05 | Sin reglas activas: mensaje literal (CA04). | Pendiente |
| C06 | «Ver movimientos asociados» abre el historial filtrado (CA05). | Pendiente |
| C07 | La leyenda legal siempre está visible (CA06). | Pendiente |
| C08 | Sin red, las recomendaciones funcionan igual (CA01). | Pendiente |
