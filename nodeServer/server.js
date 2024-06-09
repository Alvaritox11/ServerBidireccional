// Importacion de librerias/APIs necesarias
const path = require('path');
const WebSocket = require('ws');
const Jimp = require('jimp');
const fs = require('fs');
const express = require('express');
const app = express();

// Importacion de sensores, funciones de clasificacion de comandos y para subir fotos al cloud storage
const sensors = require('./sensors.json');
const { clasificarComando, clasificarComando2, uploadImageToBucket } = require('./utils.js');

// Importacion de las credenciales de Google Cloud y creacion de los clientes
const { SpeechClient } = require('@google-cloud/speech');
const speechClient = new SpeechClient({
        keyFilename:'/path/to/credentials/xxxx.json'
});

const { ImageAnnotatorClient } = require("@google-cloud/vision");
const visionClient = new ImageAnnotatorClient({
        keyFilename:'/path/to/credentials/xxxx.json'
});

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
        keyFilename:'/path/to/credentials/xxxx.json'
});


// Configuracion de la aplicacion
app.use('/static', express.static(path.join(__dirname, 'public')));

// Variables de configuracion. Actualmente en estado local
const HTTP_PORT = 8000; //80 para remoto
const WS_PORT = 8888; //65080 para remoto

// Conexion de los clientes al servidor
let connectedClients = [];

// Variable comando que se ira actualizando y se consumira cuando se envie a las ESP32
// Se instancian cuando llega una orden desde el cliente
let commando = null;

// wss
const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS Server is listening at ${WS_PORT}`));

// Conexion de los clientes al servidor. Aqui se reciben los mensajes del cliente. Este apartado es de entrada
wsServer.on('connection', ws => {
    ws.on('message', async message => {
        if (ws.readyState !== ws.OPEN) return;
        connectedClients.push(ws);
        
        // Procesamiento de los mensajes por voz
        if (message instanceof Buffer && message.length > 1000) {
            let transMinus = null;
            try {
                const audioBytes = message.toString('base64');
                const audio = { content: audioBytes };
                const config = { encoding: 'MP3', sampleRateHertz: 16000, languageCode: 'en-US' };
                const request = { audio: audio, config: config };

                // Detecta el texto del audio
                const [response] = await speechClient.recognize(request);
                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                resultado = clasificarComando(transcription); // usa la funcion de clasificacion de comandos
                console.log('Transcripción del audio:', transcription);

                // Si no se ha encontrado ningun comando, no se muestra nada
                if (resultado != null) {
                    commando = 'move' + '=' + resultado.valor; // instanciacion del comando
                    console.log('move = ' + resultado.comando);
                }
            } catch (error) {
                console.error('Error al transcribir el audio:', error);
            }
        }
        else {
            // recibir ordenes del cliente a traves de botones
            try {
                data = JSON.parse(message);
                if(data.operation === 'function') { // para el caso de seleccionar un boton de select
                    if(sensors[data.command.recipient])
                        // si el boton esta activado, se envia un 1, si no, un 0
                        sensors[data.command.recipient].selected = data.command.message.value;
                }
                else if (data.operation === 'order') { // para el caso de enviar una orden de movimiento
                    commando = 'move' + '=' + data.command.message.value; // instanciacion del comando
                    let aux = clasificarComando2(data.command.message.value);                    
                    console.log('move = ' + aux);
                }
            } catch (error) {}
        }
    });
});


// Conexion del servidor hacia los sensores y el cliente. Esto apartado es de salida
Object.entries(sensors).forEach(([sensorKey]) => {
    const connection = sensors[sensorKey];  

    // Para cada uno de los devices dentro de sensors.json, se crea un servidor WS con su puerto adecuado
    new WebSocket.Server({port: connection.port}, () => console.log(`WS Server is listening at ${connection.port}`)).on('connection',(ws) => {
        ws.on('message', async (data) => {
            if (ws.readyState !== ws.OPEN) return;
            
            // Apartado de envio de datos a las ESP32
            // Para las esp32 que no sean camara. Es decir, los que controlan el robot
            if (connection.class == 'module-instance') {
                if (commando) { 
                    // Envio de la orden a la ESP32 en caso de estar seleccionada
                    if (connection.selected === 1) {
                        console.log('sending');
                        ws.send(commando);
                    }
                    commando = null; // consume 
                }
            } else { // Apartado para envio al cliente
                if (typeof data === 'object') {
                    // Cuando la esp32 envia datos de imagen, se convierten a base64 y se procesan
                    let img = Buffer.from(Uint8Array.from(data)).toString('base64');
                    
                    // Subida de imagenes a Google Cloud Storage para despues hacer informes
                    if (connection.counter == connection.frequency) {
                        uploadImageToBucket(img,connection.iteration,connection.number);
                        connection.iteration++;
                        connection.counter = 0;
                    }
                    connection.counter++;

                    // Cloud Vision API
                    const imgBase64 = data.toString("base64");
                    const request = {
                        image: {content: imgBase64},
                        };
 
                    // Deteccion unicamente si la confianza es mayor al 65%
                    const [response] = await visionClient.objectLocalization(request);
                    const objects = response.localizedObjectAnnotations.filter(object => object.score >= 0.65);
                    // objects.forEach(object => {
                    //     console.log(`Name: ${object.name}`);
                    //     console.log(`Confidence: ${object.score}`);
                    //     const vertices = object.boundingPoly.normalizedVertices;
                    //     vertices.forEach(v => console.log(`x: ${v.x}, y:${v.y}`));
                    // });  
                    
                    // En caso de encontrar un objeto, se dibuja su BBox alrededor
                    if (objects.length > 0) {
                        const imageEtiquetada = await Jimp.read(Buffer.from(img, 'base64'));
                        for (const object of objects) {
                            const vertices = object.boundingPoly.normalizedVertices.map(vertex => {
                                const x = Math.floor(vertex.x * imageEtiquetada.bitmap.width);
                                const y = Math.floor(vertex.y * imageEtiquetada.bitmap.height);
                                return { x, y };
                            });
                    
                            const color = 0xFF0000FF; 
                            for (let i = vertices[0].x; i <= vertices[1].x; i++) {
                                imageEtiquetada.setPixelColor(color, i, vertices[0].y); // Línea superior
                                imageEtiquetada.setPixelColor(color, i, vertices[3].y); // Línea inferior
                            }
                            for (let j = vertices[0].y; j <= vertices[3].y; j++) {
                                imageEtiquetada.setPixelColor(color, vertices[0].x, j); // Línea izquierda
                                imageEtiquetada.setPixelColor(color, vertices[1].x, j); // Línea derecha
                            }
                        }

                        // Seteo de la imagen del dispositivo en su atributo image con la imagen labelizada
                        imageEtiquetada.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
                            if (err) throw new Error(err);
                            const imgBase64 = buffer.toString('base64');
                            connection.image = imgBase64;
                            });
                    } else { connection.image = img;} // En caso de no encotrar ningun objeto, se muestra la imagen original
                    // connection.image = img;
                } 
            }
            
            // Pasamos al cliente los datos de los sensores actualizados (actualizaciones en imagen basicamente)
            connectedClients.forEach(client => {
                client.send(JSON.stringify({ devices: sensors }));
            });
        });
    });
});

// Configuracion del servidor HTTP
app.get('/client', (req, res)=> {res.sendFile(path.resolve(__dirname, './public/client.html')); });
app.listen(HTTP_PORT, () => { console.log(`HTTP Server is listening on ${HTTP_PORT}`); });