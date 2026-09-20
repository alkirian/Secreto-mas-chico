# El secreto más chiquito

Aventura de plataformas 2.5D en español, con Three.js, voces grabadas, música y viento ambiental. Compatible con teclado, controles táctiles y mandos estándar reconocidos por el navegador.

## Desarrollo y pruebas

Requiere Node.js 22 o posterior.

```sh
npm ci
npm run build
npm test
npm start
```

Abrir http://127.0.0.1:4187. También se puede abrir `dist/index.html` directamente para jugar sin conexión.

`src/` contiene el renderizador 3D y el reproductor de voces. `dist/game.js`, `dist/index.html` y `dist/style.css` son archivos fuente del juego: no borrar `dist/` antes de compilar. La compilación actualiza `dist/world3d.js`, empaqueta las voces en `dist/number-audio.js` y copia música y viento desde `sfx/`.

`npm test` ejecuta todas las verificaciones de mecánicas, recorridos, menú, cinemáticas y audio. El build falla si falta un recurso, su nombre no coincide en mayúsculas/minúsculas o las voces empaquetadas no corresponden a sus originales.

## Publicación en Vercel

Importar `alkirian/Secreto-mas-chico`, elegir la rama `main` y dejar el directorio raíz del repositorio. `vercel.json` configura instalación, compilación, pruebas y salida estática `dist/`. No requiere variables de entorno, servidor, base de datos ni servicios externos para jugar.

Las voces de introducción y nombre están en `dist/audio-intro.mp3` y `dist/audio-coti.mp3`; las de edad en `dist/audio/`; los seis números, la voz de cooperación, música y viento en `sfx/`. Todos los recursos necesarios y la fuente del menú están incluidos. Las tomas originales de la raíz y los paquetes de respaldo locales no se publican.

## Controles

- Flechas o A/D: moverse; espacio, W o flecha arriba: salto y doble salto.
- E: interactuar, agarrarse a sogas y activar las luces.
- Escape: pausa; F: pantalla completa.
- Mando: palanca/cruceta, botón inferior para saltar, izquierdo para acción y Start para pausa.
- Sonido: se inicia al pulsar **Jugar**, según las restricciones de reproducción del navegador.

Ver [LEEME.md](LEEME.md) para más detalles. Las pruebas automáticas no sustituyen una prueba con mando físico.

## Televisores y equipos lentos

En el menú y la pausa se puede elegir **Livianos (TV)** o **2D (máxima fluidez)** sin reiniciar la partida. El modo automático comienza liviano en navegadores de TV reconocidos y reduce el detalle si detecta una frecuencia de cuadros baja. El modo liviano usa 800×450, desactiva sombras y reduce vegetación y partículas. También se puede abrir `/?quality=low` o `/?quality=2d`.

Conectar el joystick y presionar un botón con la página abierta: el menú muestra si el navegador lo entrega al juego. Se consultan mandos estándar, botones numéricos antiguos y la API prefijada cuando está disponible. Algunos navegadores de TV no ofrecen acceso a un mando aunque la TV lo reconozca; en ese caso hace falta un navegador/dispositivo compatible. Se admiten también las flechas y OK que algunos dispositivos entregan como teclas. `node verify-tv.cjs` comprueba estas rutas con mandos simulados; la compatibilidad física depende de la TV y el mando.

Las licencias de Three.js y Amatic SC se incluyen en `dist/THREE-LICENSE.txt` y `dist/fonts/OFL.txt`. Este repositorio no otorga una licencia adicional sobre el juego ni sus grabaciones.
