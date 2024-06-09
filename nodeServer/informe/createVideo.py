from google.cloud import storage
import os
import cv2

# Credenciales de Google Cloud
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/path/to/credentials/xxxx.json'

# Función para listar los blobs en un bucket con un prefijo dado
def list_blobs_with_prefix(bucket_name, prefix, delimiter=None):
    storage_client = storage.Client()
    blobs = storage_client.list_blobs(bucket_name, prefix=prefix, delimiter=delimiter)
    return blobs

# Función para descargar un blob de un bucket
def download_blob(bucket_name, source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)
    print(f"Blob {source_blob_name} downloaded to {destination_file_name}.")

def create_video_from_images(bucket_name, output_video_name, prefix):
    # Lista todos los blobs en el bucket con el prefijo dado
    blobs = list_blobs_with_prefix(bucket_name, prefix)
    # Ordena los blobs por nombre
    sorted_blobs = sorted(blobs, key=lambda x: x.name)
    
    # Define las dimensiones del video y el codec
    first_blob = sorted_blobs[0]
    download_blob(bucket_name, first_blob.name, first_blob.name)
    frame = cv2.imread(first_blob.name)
    height, width, layers = frame.shape
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video = cv2.VideoWriter(output_video_name, fourcc, 1, (width, height))  # 1 FPS, ajustar según sea necesario
    
    # Añade cada imagen al video
    for blob in sorted_blobs:
        filename = blob.name
        download_blob(bucket_name, filename, filename)
        frame = cv2.imread(filename)
        video.write(frame)
        os.remove(filename)  # Elimina el archivo después de añadirlo al video
    
    # Libera el objeto VideoWriter
    video.release()
    print(f"Video {output_video_name} creado con éxito.")


output_video_name = 'output_video.mp4'
# Nombre del bucket, nombre del video de salida y prefijo de los blobs
create_video_from_images('omniseekers', output_video_name, 'robot1/frame-')

# Para evitar posibles errores crear tambien la carpeta de robot1 en caso de que no este.