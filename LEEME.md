# El secreto más chiquito

Juego de plataformas 2.5D con Three.js para teclado y joystick. Las colisiones siguen en un plano lateral; el mundo, el protagonista, el compañero y los enemigos se dibujan en 3D con iluminación y sombras. No necesita instalación ni conexión para jugar: abrir `dist/index.html` en Chrome o Edge. Three.js está incluido en la copia local. Para una vista local servida, ejecutar `node server.cjs` y abrir http://127.0.0.1:4187.

Las losas comparten piedra modular y un borde claro de aterrizaje. Las plataformas móviles tienen metal, guías y luz turquesa; las paredes escalables tienen franjas turquesas. La profundidad del escenario queda detrás del plano de colisión. Si no hay WebGL disponible, el juego muestra la vista 2D de respaldo.

## Desarrollo

El motor visual está en `src/world3d.js`. Después de cambiarlo, ejecutar `npm run build` para actualizar `dist/world3d.js`. La física y narrativa están en `dist/game.js`. Las versiones de Three.js y esbuild quedan fijadas en `package-lock.json`.

## Controles

- Flechas o A/D: moverse.
- Espacio, W o flecha arriba: saltar. Mantener para ganar altura; pulsar otra vez en el aire para el doble salto.
- Contra una pared marcada: saltar para impulsarse y volver a la pared para seguir trepando. La caída junto a la pared es más lenta.
- E / botón izquierdo del mando junto al extremo de una soga: agarrarse. Izquierda/derecha para balancearse y salto para soltarse. Se puede hacer doble salto después de soltarse.
- Saltar sobre un enemigo lo derrota y produce un rebote. El contacto lateral devuelve al checkpoint, sin vidas ni Game Over.
- E: activar mecanismos y elegir la placa numérica sobre la que está el personaje.
- Escape: pausa.
- F: pantalla completa.
- Joystick estándar: palanca/cruceta, botón inferior para saltar, botón izquierdo para acción y Start para pausa.

La pantalla final permanece visible. Reiniciar recargando la página, o desde la pausa durante el juego. Hay sonido sintetizado y ambiente musical; no hay narración grabada.

Para la reunión: abrir el juego en la computadora conectada por HDMI, conectar el mando antes de empezar y comprobar volumen y pantalla completa. El soporte depende de que el navegador reconozca el mando como gamepad estándar.

## Verificación

`node verify.cjs` verifica doble salto, límite de saltos, paredes, sogas, enemigos, checkpoints, acertijo, narrativa y reinicio. También simula 17 trayectorias de salto, dos escaladas completas y los dos cruces de soga. No reemplaza una prueba con un mando físico. El recorrido ampliado tiene dos torres, dos sogas y nueve enemigos.
