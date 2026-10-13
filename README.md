# Turnia · Atención por turnos

Aplicación web ligera para gestionar la fila de atención, emitir turnos desde un kiosco y mostrar el turno llamado en una pantalla pública. La demo funciona sin servidor y guarda su estado en el navegador (`localStorage`). Su interfaz usa una identidad visual propia para el panel, el kiosco y la pantalla de sala.

## Ejecutar localmente

Abre `index.html` en un navegador o sirve esta carpeta con cualquier servidor estático. No requiere instalación de dependencias.

## Vistas

- Panel de operación: `/`
- Kiosco para solicitar turno: `/?vista=kiosco`
- Pantalla de sala: `/?vista=pantalla`

Los avisos de voz en español cubren el llamado y la finalización de turnos desde el panel y desde los puestos de atención. Al llamar, se anuncian el nombre, el número y el puesto; al finalizar, se confirma que el puesto quedó libre y, si hay otro turno llamado, se anuncia quién sigue. La pantalla de sala también puede anunciar los cambios cuando se activa el audio, y el kiosco dice el número al emitir un turno.

Las vistas comparten datos entre pestañas del mismo navegador. La persistencia local es apropiada para una demostración o uso en un solo dispositivo; una operación multiusuario real requiere una base de datos y sincronización compartida.

## Publicar en Vercel desde Git

Importa este repositorio en Vercel y conserva la raíz del proyecto. Vercel detecta el sitio estático; no necesita comando de build ni variables de entorno. Habilita Git deployments para que cada push genere un preview y el push a la rama de producción actualice el sitio.

El proyecto incluye `vercel.json` y está preparado para el despliegue estático de Vercel. Después de vincular el repositorio y el proyecto de Vercel, los siguientes cambios publicados en Git se desplegarán automáticamente.

