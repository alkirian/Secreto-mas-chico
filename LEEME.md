# El secreto más chiquito

Juego web 2D para teclado y joystick. No necesita instalación ni conexión para jugar: abrir `dist/index.html` en Chrome o Edge. Para una vista local servida, ejecutar `node server.cjs` y abrir http://127.0.0.1:4187.

## Controles

- Flechas o A/D: moverse.
- Espacio, W o flecha arriba: saltar. Mantener para ganar altura.
- E: activar mecanismos y elegir la placa numérica sobre la que está el personaje.
- Escape: pausa.
- F: pantalla completa.
- Joystick estándar: palanca/cruceta, botón inferior para saltar, botón izquierdo para acción y Start para pausa.

La pantalla final permanece visible. Reiniciar recargando la página, o desde la pausa durante el juego. Hay sonido sintetizado y ambiente musical; no hay narración grabada.

Para la reunión: abrir el juego en la computadora conectada por HDMI, conectar el mando antes de empezar y comprobar volumen y pantalla completa. El soporte depende de que el navegador reconozca el mando como gamepad estándar.

## Verificación

`node verify.cjs` verifica física básica, reaparición, respuesta incorrecta/correcta, interruptor, diálogo de calma, final y reinicio con un entorno simulado. No reemplaza una prueba con un mando físico.
