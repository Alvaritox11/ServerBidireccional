#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <stdio.h>
#define FLASH_PIN 4
int flashlight = 0;

// WIFI
const char* ssid = "xxxx";
const char* password = "xxxx";

// PUERTO E IP LOCAL O REMOTO
/* LOCAL */
const char* websocket_server_host = "X.X.X.X"; // 192.168.X.X
const uint16_t websocket_server_port = 8001;

/* GOOGLE */
// const char* websocket_server_host = "X.X.X.X"; // 34.X.X.X
// const uint16_t websocket_server_port = 65081; // 65XXX

using namespace websockets;
WebsocketsClient client;

// CONEXION CON WEBSOCKETS PARA RECIBIR ORDENES
void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connection Opened");
    } else if(event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connection Closed");
        ESP.restart();
    }
}

// FUNCION PARA TRATAR ORDENES
// los case cambiarian de codigo a movimientos si tuvieramos el robot
void onMessageCallback(WebsocketsMessage message) {
    String data = message.data();
    int index = data.indexOf("=");
    if(index != -1) {
        String key = data.substring(0, index);
        String value = data.substring(index + 1);
        if (key == "move") {
          switch (value.toInt()) {
            case 0:
              flashlight = 0;
              digitalWrite(FLASH_PIN, LOW);
              break;
            case 1:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            case 2:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            case 3:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            case 4:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            case 5:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            case 6:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            case 7:
              flashlight = 1;
              digitalWrite(FLASH_PIN, HIGH);
              break;
            default:
              break;
          }
        }
        Serial.print("Key: ");
        Serial.println(key);
        Serial.print("Value: ");
        Serial.println(value);
    }
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
 
  // CONEXION WIFI Y WEBSOCKET
  WiFi.begin(ssid, password);
  // WiFi.begin(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");

  Serial.print("Camera Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");

  // FUNCIONES PARA RECIBIR OREDENES
  pinMode(FLASH_PIN, OUTPUT);
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);

  while(!client.connect(websocket_server_host, websocket_server_port, "/")){
    delay(500);
    Serial.print(".");
  }
  Serial.println("Websocket Connected!");
}

void loop() {
    // /* PARA RECIBIR ÓRDENES */
    const char zero = 0;
    client.sendBinary(&zero, sizeof(zero));
    client.poll();

}
