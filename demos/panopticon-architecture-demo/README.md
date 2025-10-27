Del Panóptico al Datapoint — Demo de vigilancia por arquitectura (GitHub Pages)

Qué es
Visualización interactiva 100% en el navegador que muestra cómo la arquitectura (topología, RBAC, logging y segmentación de red) altera la capacidad efectiva de observación sobre un dato sensible.

Por qué sirve
Traduce al plano operativo la tesis del paper “Del Panóptico al Datapoint: Vigilancia y control por arquitectura”, permitiendo experimentar con parámetros y observar cómo cambia un índice de vigilancia.

Cómo desplegar en GitHub
1) Crear un repositorio nuevo y subir estos archivos a main.
2) En Settings → Pages, seleccionar “Deploy from a branch” → main / root.
3) Abrir la URL de Pages y usar los controles para explorar.

Parámetros
- Centralización: concentra el poder de observación en unos pocos nodos.
- RBAC: reglas estrictas reducen la visibilidad desde nodos de control.
- Logging/Observabilidad: más logging aumenta la inspección indirecta.
- Segmentación de red: reduce las rutas posibles hacia el dato.

Índice de vigilancia
Valor en [0,1] que sintetiza rutas efectivas y poder de control. Es un modelo didáctico para ilustrar el concepto de “control por diseño”.

Créditos y licencia
MIT. Demostración client-side (D3.js) sin backend.
