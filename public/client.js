// La IP externa de la VM se cambia aqui para la version remota. Poner IPv4 en caso de ser local
const ws = new WebSocket('ws://192.168.1.243:8888'); //ir modificando porque cambia cada vez que se inicia la VM

// Envia estado del cliente al servidor
ws.addEventListener('open', (event) => {
        ws.send(JSON.stringify({
                'client': '8888', // Cambiar a 65080 en caso de ser la version remota
                'operation': 'connecting',
                'data': {}
        }));
});

// CREACION DE ELEMENTOS HTML DE LOS DATOS QUE SE ENVIAN DESDE EL SERVIDOR
// Durante el proceso de creacion tambien se envian mensajes como las ordenes de los botones o el microfono
ws.onmessage = message => {
        let md = JSON.parse(message.data);

        // Para cada device dentro del .json que se envia desde el servidor, se crean sus elementos correspondientes
        for (const device in md.devices) {
                let name_device = "robot" + md.devices[device].number;
                if (!document.querySelector('#' + name_device)) {
                        document.getElementById('closed_cams').style.display = 'none';
                        if (md.devices[device].class == "cam-instance") {
                                document.querySelector('#cams')
                                        .appendChild(createElement('div',{ id: name_device, class: 'robot-instance item' }))
                                        .appendChild(createElement('h2',{ id: name_device + '-header', class: 'robot-header' }, md.devices[device].display));
                                document.querySelector('#'+name_device) 
                                        .appendChild(createElement('div',{ id:'wrap-' + name_device + '-image', class: 'image-wrapper' }))
                                        .appendChild(createElement('img',{ id:'img-' + name_device }));
                                document.querySelector('#'+name_device)
                                        .appendChild(createElement('div',{ id:'wrap-' + name_device + '-commands', class:'commands-wrapper'}));
                        }
                }

                // Si el dispositivo tiene una imagen, se muestra
                if (md.devices[device].image && md.devices[device].class == "cam-instance") {
                        var imageWrapper = document.getElementById('wrap-' + name_device + '-image');
                        if (imageWrapper) {
                                var image = document.getElementById('img-' + name_device);
                                image.style.height = 'auto';
                                image.style.border = '2px solid black';
                                imageWrapper.style.backgroundImage = 'none'; // Remove any existing background image
                                imageWrapper.style.backgroundColor = 'transparent'; // Set the background color to transparent
                        }
                        document.querySelector('#img-' + name_device).src = "data:image/jpeg;base64," + md.devices[device].image;
                }

                // Creacion de boton Select que envia ordenes mensajes al servidor cada vez que se pulsa
                // El mensaje solo envia el estado del boton, si esta activado o no para poder tratarlo en el servidor
                if (md.devices[device].class == "module-instance") {
                        md.devices[device].commands.forEach((command) => {
                                if (command !== undefined && !document.querySelector('#' + name_device + '-' + command.id)) {

                                        document.querySelector('#wrap-' + name_device + '-commands')
                                                .appendChild(createElement('div', { id: name_device + '-' + command.id, class: 'select-button'}, 'Select'))
                                                .appendChild(createElement('div',{ id: name_device + '-' + command.id + '-state', class: command.class }));

                                        document.querySelector('#' + name_device + '-' + command.id).addEventListener('click', function(e) {
                                                // Cambiar color al boton
                                                let button = document.querySelector('#' + name_device + '-' + command.id);
                                                button.classList.toggle('active');

                                                // Enviar informacion
                                                let val = document.querySelector('#' + name_device + '-' + command.id + '-state').dataset.state;
                                                ws.send(JSON.stringify({
                                                        'client' : '8888', // Cambiar a 65080 en caso de ser la version remota
                                                        'operation' : 'function',
                                                        'command': {'recipient' : device, 'message' : { key: 'selected', value: md.devices[device].selected == 1 ? 0 : 1 }} 
                                                }));
                                                md.devices[device].selected = md.devices[device].selected == 1 ? 0 : 1;
                                        });

                                }
                        });
                }
        }

}

// Funcion para mandar ordenes a traves de los botones de movimiento
// El mensaje enviado envia directamente la orden de movimiento al servidor para que este lo procese
// A diferencia del boton select, el procedimiento es mas directo
document.addEventListener('DOMContentLoaded', function() {

    const buttons_move = document.querySelectorAll('.move-toggle');
        let first = false;
    buttons_move.forEach(button => {
        button.addEventListener('click', function() {
            buttons_move.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
                        first = true;
        });
    });

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.move-toggle')) {
            buttons_move.forEach(btn => btn.classList.remove('active'));
        }
    });

    function logActiveButton() {
                if (!first) return;
        const activeButton = document.querySelector('.move-toggle.active');
                if (activeButton) {
                        console.log('Active button:', activeButton.id);
                        ws.send(JSON.stringify({
                                'client' : '8888', // Cambiar a 65080 en caso de ser la version remota
                                'operation' : 'order',
                                'command': {'message' : { key: 'move', value: activeButton.id }} 
                        }));
                        first = false;
                } else {
                        // console.log('No active button');
                }
    }

    // Mirar botons direccio
    setInterval(logActiveButton, 0);
});