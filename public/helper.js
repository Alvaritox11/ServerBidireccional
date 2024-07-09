// Creacion de elementos a partir de funcion. Para mas simplicidad
// Se utilizan dentro del client.js para crear elementos HTML dentro de los div principales
const createElement = (e, a, i) => {
    if (!e) return false;
    if (!i) i = "";
    let el = document.createElement(e);
    if (a) {
            for (const [k, v] of Object.entries(a)) {
                    el.setAttribute(k, v);
            }
    }
    if (!Array.isArray(i)) i = [i];
    for (const item of i) {
            if (item.tagName) {
                    el.appendChild(item);
            } else {
                    el.appendChild(document.createTextNode(item));
            }
    }
    return el;
};


// CAPTURA DE AUDIO PARA ORDENES DE VOZ
// Se captura el audio del microfono y se envia al servidor
// Utiliza el protocolo WebRTC para capturar el audio
let constraintObj = { audio : true }

navigator.mediaDevices.getUserMedia(constraintObj)
.then(function(mediaStreamObj) {

    let can_record = false;
    let is_recording = false;

    let mic_button = document.querySelector('#mic');
    let mediaRecorder = new MediaRecorder(mediaStreamObj);
    let chunks = [];

    // Evento del boton de grabacion
    mic_button.addEventListener('click', (ev)=> {
            if (!can_record) return;
            is_recording = !is_recording;

            if (is_recording) {
                    mediaRecorder.start();
                    console.log(mediaRecorder.state);
            } else {
                    mediaRecorder.stop();
                    console.log(mediaRecorder.state);
            }
    })

    // Eventos del mediaRecorder
    mediaRecorder.ondataavailable = function(ev) {
            chunks.push(ev.data);
    }

    // Evento de finalizacion de grabacion
    mediaRecorder.onstop = (ev)=>{
            let blob = new Blob(chunks, { 'type' : 'audio/mp3;' });
            // Envio al servidor
            ws.send(blob);
            chunks = [];
    }

    can_record = true;
})
.catch(function(err) { 
    console.log(err.name, err.message); 
});


//FUNCIONES PARA REFRESCAR LA PAGINA EN CASO DE ERROR CON LAS CAMARAS
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.arrow-buttons button');

    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            button.classList.add('active');
        });

        button.addEventListener('touchend', function() {
            button.classList.remove('active');
        });

        button.addEventListener('touchcancel', function() {
            button.classList.remove('active');
        });
    });
});

// FUNCIONES PARA REFRESCAR LA PAGINA (este es mas para la visualizacion de la rotacion del boton)
function rotateButton() {
    const button = document.getElementById('restart_connection');
    button.classList.add('rotate');

    setTimeout(() => {
        button.classList.remove('rotate');
    }, 1000); 

    setTimeout(() => {
        location.reload();
    }, 1000);
}

// BOTONES SELECTOR (sin uso porque se utiliza algo mas simple dentro del css)
function selectCamera(selectedId) {
    const buttons = document.querySelectorAll('.select-button');
    buttons.forEach(button => {
            if (button.id === selectedId) {
                    button.classList.add('selected-button');
            } else {
                    button.classList.remove('selected-button');
            }
    });
}

// FUNCIONES PAGINA INICIO
function activarTodosLosDivs() {
document.querySelectorAll('.camera-div').forEach(function(div) {
    div.classList.add('active');
});
document.querySelectorAll('.select-button').forEach(function(div) {
    div.classList.add('active');
});
document.querySelectorAll('.change_cam').forEach(function(div) {
    div.classList.add('active');
});
}

function hideFirstScreen() {
document.getElementById('first_screen').style.display = 'none';
document.getElementById('main_explain').style.display = 'none';
document.getElementById('main-wrapper').style.display = 'flex';
}

function showFirstScreen() {
document.getElementById('first_screen').style.display = 'flex';
document.getElementById('main_explain').style.display = 'none';
}

function showSecondScreen() {
document.getElementById('main_explain').style.display = 'flex';
document.getElementById('first_screen').style.display = 'none';
document.getElementById('main-wrapper').style.display = 'none';
}


// MOVIMIENTO DE LOS BOTONES CUANDO SE SELECCIONA UN DISPOSITIVO
document.addEventListener('DOMContentLoaded', function() {
    const buttons_move = document.querySelectorAll('.move-toggle');
    buttons_move.forEach(button => {
            button.addEventListener('click', function() {
                    console.log(button.id);

                    buttons_move.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
            });
    });
});
