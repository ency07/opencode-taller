# Contrato de diversidad y saturación — P5

Estado: eje estructural identificado y separado semánticamente; integración en el generador pendiente.

## 1. Ejes independientes

### Diversidad estructural
Valores actuales: `HEAVY`, `SOFT`, `MODERN`.

Controla densidad visual, peso de masas, geometría, espacio negativo y presencia estructural. No representa un estilo artístico.

### Diversidad de estilos visuales
Valores: estilos del catálogo activo del mercado/producto (por ejemplo, Anime/Manga, Brutalist, Risograph). El motor de estilos ya mantiene selección sin repetición dentro del set e historial reciente.

No volver a aplicar P5 sobre estilos hasta demostrar que no duplica ni contradice `resolveEstilos()`.

### Tratamientos gráficos, técnicas y composición
Son ejes diferentes. No se redistribuyen mediante la cuota HEAVY/SOFT/MODERN.

## 2. Contrato de la función

Toda redistribución recibe explícitamente:
- `axis`: `structuralProfile` o `visualStyle`;
- `values`: valores actuales;
- `allowedValues`: alternativas válidas para el contexto;
- `threshold`: proporción máxima permitida.

Invariantes:
- no inventar alternativas;
- no alterar longitud ni orden de las tarjetas;
- no sustituir valores fuera de `allowedValues`;
- si no existe solución completa, devolver copia intacta;
- no cruzar datos entre mercados o productos;
- respetar locks manuales;
- mantener historial separado por eje, mercado, región y producto.

## 3. Implementación actual

`js/diversidad-saturacion.js` expone funciones explícitas para perfiles estructurales y estilos visuales, además de aliases históricos. Los aliases son compatibilidad, no autorización para mezclar ejes.

La distribución heredada HEAVY/SOFT/MODERN se denomina ahora `STRUCTURAL_PROFILE_DISTRIBUTION`. No se conecta a estilos artísticos.

## 4. Activación en runtime

La conexión a `buildCandidate()` requiere:
1. declarar eje y catálogo permitido por contexto;
2. tratar locks como restricciones duras;
3. ejecutar diversidad después de resolver valores candidatos y antes de aceptar el set;
4. probar casos viables, imposibles, locks y aislamiento de mercado/producto;
5. medir que no duplica la lógica anti-repetición ya presente en `resolveEstilos()`.

No declarar P5 completo solo por exponer las funciones.
