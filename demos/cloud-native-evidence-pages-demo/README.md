Cloud‑Native Evidence Demo (GitHub Pages)

Qué es
Prototipo 100% en el navegador que aplica ideas de evidencia digital en entornos cloud‑native: registra consentimiento, ingesta eventos, encadena un log por hash y permite descargar un paquete de evidencia con checksums.

Por qué sirve
Muestra cadena de custodia mínima y verificable sin backend. Se puede publicar solo con GitHub Pages y funciona offline (LocalStorage).

Cómo desplegar en GitHub
1) Crear repo y subir estos archivos a la rama main.
2) Settings → Pages → Source: Deploy from a branch → main / root.
3) Esperar a que GitHub publique la página. Abrir la URL de Pages.

Cómo usar
1) Completar Consentimiento o Ingesta y enviar.
2) Ver el log encadenado y el hash raíz.
3) Descargar evidencia (evidence_bundle.zip) con audit_log.jsonl, manifest.json y chain_root.txt.

Notas técnicas
- Hash: SHA‑256 con WebCrypto.
- Almacenamiento local: LocalStorage (persistente por navegador).
- Descarga zip: JSZip + FileSaver desde CDN.
- Sin servidores ni Actions necesarias. Opcionalmente se puede agregar un workflow para publicar automáticamente.

Licencia
MIT.
