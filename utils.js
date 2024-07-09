// Archivo donde se definen funciones para clasificar comandos

// Funcion que clasifica los comandos de voz
// Los pone en minuscula y mira dentro del objeto comandos si se encuentra alguno
// Si se encuentra, devuelve el valor del comando y el comando en si
function clasificarComando(transcripcion) {
    const comandos = {
        'stop': 0,
        'forward': 1,
        'backward': 2,
        'left': 3,
        'right': 4,
        'spin left': 5,
        'spin right': 6,
        'flash': 7
    };

    const transMinus = transcripcion.toLowerCase();

    for (const [comando, valor] of Object.entries(comandos)) {
        if (transMinus.includes(comando)) {
            return {valor, comando};
        }
    }

    return null;
}

// Funcion a la inversa que solo sirve para hacer mas visual las ordenes a traves de la consola de comandos
// Devuelve unicamente el movimiento sin codificar que se ha ordenado
function clasificarComando2(numero) {
        const comandos = {
            0: "stop",
            1: "forward",
            2: "backward",
            3: "left",
            4: "right",
            5: "spin left",
            6: "spin right",
            7: "flash"
        };

        return comandos[numero];
}

// Funcion para subir imagenes a Google Cloud Storage
async function uploadImageToBucket(imgBase64, frameNumber, robotNumber) {
    const fileName = `robot${robotNumber}/frame-${frameNumber}.png`;
    const bucket = storage.bucket('omniseekers');
    const file = bucket.file(fileName);
    const buffer = Buffer.from(imgBase64, 'base64');

    await file.save(buffer, {
        metadata: { contentType: 'image/png' },
    });
    console.log(`Imagen ${fileName} subida con éxito.`);
}

module.exports = { clasificarComando, clasificarComando2, uploadImageToBucket };