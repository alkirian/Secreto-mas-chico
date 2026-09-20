# El secreto más chiquito

Aventura de plataformas 2.5D en español, con Three.js, voces grabadas, música y viento ambiental. Compatible con teclado, controles táctiles y mandos estándar reconocidos por el navegador.

## Desarrollo y pruebas

Requiere Node.js 22 o posterior.

```sh
npm ci
npm run build
npm run test:3d
npm start
```

Abrir http://127.0.0.1:4187. También se puede abrir `dist/index.html` directamente para jugar sin conexión.

`src/` contiene el renderizador 3D y el reproductor de voces. `dist/game.js`, `dist/index.html` y `dist/style.css` son archivos fuente del juego: no borrar `dist/` antes de compilar. La compilación actualiza `dist/world3d.js`, empaqueta las voces en `dist/number-audio.js` y copia música y viento desde `sfx/`.

`npm run test:3d` ejecuta las verificaciones de la versión 3D y los sistemas compartidos: mecánicas, recorridos, menú, cinemáticas y audio. Es la validación usada para publicar en Vercel. `npm test` incluye además la vista 2D opcional, fuera del alcance de esta publicación. El build falla si falta un recurso, su nombre no coincide en mayúsculas/minúsculas o las voces empaquetadas no corresponden a sus originales.

## Publicación en Vercel

Importar `alkirian/Secreto-mas-chico`, elegir la rama `main` y dejar el directorio raíz del repositorio. `vercel.json` configura instalación, compilación, pruebas y salida estática `dist/`. No requiere variables de entorno, servidor, base de datos ni servicios externos para jugar.

Las voces de introducción y nombre están en `dist/audio-intro.mp3` y `dist/audio-coti.mp3`; las de edad en `dist/audio/`; los seis números, la voz de cooperación, música y viento en `sfx/`. Todos los recursos necesarios y la fuente del menú están incluidos. Las tomas originales de la raíz y los paquetes de respaldo locales no se publican.

## Controles

- Flechas o A/D: moverse; espacio, W o flecha arriba: saltar. Volver a pulsar en el aire para el doble salto.
- Enter: interactuar y activar la palanca (E también funciona). Las luces numéricas se encienden al tocarlas.
- Escape: pausa; F: pantalla completa.
- Mando: palanca/cruceta, botón inferior para saltar, izquierdo para acción y Start para pausa.
- Sonido: se inicia al pulsar **Jugar**, según las restricciones de reproducción del navegador.

Ver [LEEME.md](LEEME.md) para más detalles. Las pruebas automáticas no sustituyen una prueba con mando físico.

## Televisores y equipos lentos

### Jugar desde el celular y duplicar a un Smart TV

Abrí el juego en el celular y ponelo horizontal. Los botones permiten moverse y saltar con varios dedos a la vez, con un botón de pausa visible. La vista respeta las zonas seguras del teléfono y conserva todo el encuadre 16:9. **Pantalla completa** intenta orientar la pantalla en horizontal; si el navegador no lo admite, podés girarla manualmente. Durante la partida se solicita mantener la pantalla encendida cuando el navegador lo permite. Al salir de la aplicación se pausa y se limpian los controles; al volver, tocá **Continuar**.

En celulares, **Automáticos** comienza en **3D móvil**: 1280×720, sin sombras dinámicas, manteniendo personajes, escenarios y vegetación. Si hay lentitud sostenida, primero baja la resolución a 1120×630 y 960×540; recién después usa el modo liviano 3D. **Detallados** mantiene 1600×900 con sombras y no se reduce automáticamente. Las opciones manuales se respetan. Podés seleccionar **3D móvil** directamente o abrir `/?quality=balanced`.

**Ver en Smart TV**, disponible en el menú y la pausa, abre una guía. La duplicación se activa desde el sistema del celular, con ambos equipos en la misma red Wi-Fi:

- Android y TV con Google Cast/Chromecast: Google Home → dispositivo → transmitir pantalla.
- Galaxy y TV compatible: ajustes rápidos → Smart View → televisor.
- iPhone y TV con AirPlay: Centro de control → Duplicar pantalla → televisor.

El celular sigue ejecutando el juego, incluyendo audio y gráficos 3D. El televisor muestra la pantalla duplicada, también los botones; podés conectar un joystick al celular. El botón de ayuda no busca televisores ni inicia una conexión por sí solo. La disponibilidad y el retraso dependen del celular, la TV y la red. Una conexión HDMI requiere salida de video compatible en el teléfono y un adaptador apropiado.

Ayuda oficial: [Google](https://support.google.com/chromecast/answer/6059461?hl=es-419), [Samsung](https://www.samsung.com/us/support/answer/ANS10001896/), [Apple](https://support.apple.com/es-lamr/102661). `node verify-mobile.cjs` verifica entrada multitáctil, cancelación, pausa, bloqueo de pantalla, fallback de pantalla completa y adaptación gráfica. La duplicación real requiere probar los dispositivos físicos.

En el menú y la pausa se puede elegir **Livianos (TV)** o **2D (máxima fluidez)** sin reiniciar la partida. El modo automático comienza liviano en navegadores de TV reconocidos y reduce el detalle si detecta una frecuencia de cuadros baja. El modo liviano usa 800×450, desactiva sombras y reduce vegetación y partículas. También se puede abrir `/?quality=low` o `/?quality=2d`.

Conectar el joystick y presionar un botón con la página abierta: el menú muestra si el navegador lo entrega al juego. Se consultan mandos estándar, botones numéricos antiguos y la API prefijada cuando está disponible. Algunos navegadores de TV no ofrecen acceso a un mando aunque la TV lo reconozca; en ese caso hace falta un navegador/dispositivo compatible. Se admiten también las flechas y OK que algunos dispositivos entregan como teclas. `node verify-tv.cjs` comprueba estas rutas con mandos simulados; la compatibilidad física depende de la TV y el mando.

Las licencias de Three.js y Amatic SC se incluyen en `dist/THREE-LICENSE.txt` y `dist/fonts/OFL.txt`. Este repositorio no otorga una licencia adicional sobre el juego ni sus grabaciones.
