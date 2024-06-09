# README.txt
Explicacion general de todo el proyecto para el correcto lanzamiento del servidor. Enfocado a lanzamiento LOCAL.

El servidor utiliza el gestor de paquetes 'npm'. En un principio los modulos ya estan instalados pero en caso de 
algun error con algun paquete ejecutar el comando `npm install`. Las dependencias a instalar se especifican dentro
del fichero 'package.json'. El resultado de ejecutar `npm install` son los archivos 'package-lock.json' y 'node_modules'.

Antes de ejecutar el servidor hay que tener en cuenta las direccions IP y los puertos utilizados segun se quiera lanzar 
en remoto o local. La IP se cambia en 'public/client.js' y los puertos que utiliza el servidor en 'server.js' y 'sensors.json'. 
En este ultimo se cambian por los puertos 65081, 65082, 65083, etc, en caso de que se quiera remoto. En el resto de documentos
se especifica donde cambiarlo y por cual exactamente.

En 'sensors.json' se especifican todos los modulos que se conectaran al servidor y sus atributos. Actualizarlo segun 
se quieran conectar mas o menos dispositivos. En caso de no conectarse ninguno (se detecta esto mismo dentro del server.js),
se mostrara una imagen de error de ningun dispositivo conectado en la pagina web. Si hay alguno conectado pero no
todos, se mostrara unicamente el conectado y el resto se hara ver que no estan disponibles.

El script principal es el 'server.js'. Es el script ejecutado cuando se lanza el servidor ejecutando el comando 
`npm run start`. Controla el flujo de informacion entre dispositivos y cliente y se encarga del procedimiento de 
los datos.

En la carpeta 'keys' se tiene que guardar las credenciales de Google Cloud.

En la carpeta 'informe' se ubican los scripts para ejecutar el analisis mas especifico del video del recorrido de los robots.
Primero se ejecuta `python3 createVideo.py` que crea un video. Despues se ejecuta `python3 videoAnalysis.py` para obtener el 
informe.txt. 

Los archivos principales son: 'server.js', 'sensors.json', 'public/client.js' e 'informe/*'. El resto de ficheros son auxiliares
que tienen funciones especificas para el archivo al que acompaña (especificado en el mismo fichero).

Comando para lanzar el servidor: `npm run start`. <- PARA EJECUTAR EL SERVIDOR!!!
Para visualizar la pagina web poner: 34.X.X.X:80/client (REMOTO) o 192.X.X.X:8000/client (LOCAL) en el navegador.

CONSIDERACION IMPORTANTE: cuando se lanza en remoto el servidor, el uso del microfono a partir del media del usuario no es posible 
con el protocolo http. Deberia ser con el https. Para evitar ese problema poner dentro del navegador lo siguiente:
chrome://flags/#unsafely-treat-insecure-origin-as-secure -> dentro del espacio poner el link de la pagina web del servidor y hacer relaunch
del navegador.