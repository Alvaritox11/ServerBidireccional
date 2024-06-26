#include "esp_camera.h"
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <stdio.h>

#define CAMERA_MODEL_AI_THINKER // Has PSRAM
#include "camera_pins.h"

// WIFI
const char* ssid = "XXXX";
const char* password = "XXXX";

// PUERTO E IP LOCAL O REMOTO
/* LOCAL */
const char* websocket_server_host = "192.168.X.X";
const uint16_t websocket_server_port = 8001;

/* GOOGLE */
// const char* websocket_server_host = "34.X.X.X";
// const uint16_t websocket_server_port = 65081;

using namespace websockets;
WebsocketsClient client;

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // CONFIGURACION PINES CAMARA
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;


  config.xclk_freq_hz = 10000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_SVGA;
  config.jpeg_quality = 40;
  config.fb_count = 2;
  
  // camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  sensor_t * s = esp_camera_sensor_get();
  s->set_contrast(s, 0);   
  s->set_raw_gma(s, 1);
  /* PARA REMOTO */
  if (websocket_server_port == 65082 || websocket_server_port == 65083) {
    s->set_vflip(s, 1);
  }
  /* PARA LOCAL */
  // if (websocket_server_port == 8002 || websocket_server_port == 8003) {
  //   s->set_vflip(s, 1);
  // }
 
  // CONEXION WIFI Y WEBSOCKET
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");

  Serial.print("Camera Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  Serial.println("' to connect");

  while(!client.connect(websocket_server_host, websocket_server_port, "/")){
    delay(500);
    Serial.print(".");
  }
  Serial.println("Websocket Connected!");
}

void loop() {
    /* PARA ENVIAR IMAGEN */
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("Camera capture failed");
        esp_camera_fb_return(fb);
        return;
    }

    if (fb->format != PIXFORMAT_JPEG) {
        Serial.println("Non-JPEG data not implemented");
        return;
    }

    client.sendBinary((const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
}
