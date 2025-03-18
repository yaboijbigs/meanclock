import time
import requests
from flask import Flask, render_template, request, jsonify, Response
from google.cloud import secretmanager, storage
from google.oauth2 import service_account
from dotenv import load_dotenv
import json
import tempfile
import os
import logging
import datetime

load_dotenv()

# Replace hardcoded values with environment variables
recaptcha_secret_key = os.getenv('RECAPTCHA_SECRET_KEY')
neets_api_key = os.getenv('NEETS_API_KEY')

def access_secret_version(secret_name):
    client = secretmanager.SecretManagerServiceClient()
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

# Replace hardcoded secret name
service_account_info_json = os.getenv('SERVICE_ACCOUNT_INFO') 
if service_account_info_json:
    service_account_info = json.loads(service_account_info_json)
else:
    # Fallback for development or provide clear error
    logging.error("SERVICE_ACCOUNT_INFO environment variable not set")
    service_account_info = {}  # Or handle appropriately

# Load the service account credentials from Google Secret Manager
credentials = service_account.Credentials.from_service_account_info(service_account_info)

# Replace hardcoded bucket name
bucket_name = os.getenv('GCS_BUCKET_NAME', 'your-bucket-name')

def upload_to_gcs(bucket_name, source_file_name):
    """Uploads a file to the bucket using the service account key."""
    try:
        logging.info("Creating Google Cloud Storage client.")
        storage_client = storage.Client(credentials=credentials)
        
        logging.info(f"Accessing bucket: {bucket_name}")
        bucket = storage_client.bucket(bucket_name)
        
        logging.info(f"Creating blob for file: {source_file_name}")
        blob = bucket.blob(source_file_name)
        
        logging.info(f"Uploading file to GCS: {source_file_name}")
        blob.upload_from_filename(source_file_name)
        
        logging.info(f"File {source_file_name} uploaded to {bucket_name}.")
    except Exception as e:
        logging.error(f"Failed to upload file to GCS: {str(e)}")
        raise  # Re-raise the exception after logging it

app = Flask(__name__, 
            static_url_path='/static',
            static_folder='static')

@app.route('/')
def meanclock():
    celebrities = [
        {'name': 'Gilbert Gottfried', 'image': 'gilbert_gottfried.png'},
        {'name': 'Mike Tyson', 'image': 'mike_tyson.png'},
        {'name': 'Kermit', 'image': 'kermit.png'},
        {'name': 'Donald Trump', 'image': 'donald_trump.png'},
        {'name': 'Joe Biden', 'image': 'joe_biden.png'},
        {'name': 'Andrew Tate', 'image': 'andrew_tate.png'},
        {'name': 'Kanye West', 'image': 'kanye_west.png'},
        {'name': 'Snoop Dogg', 'image': 'snoop_dogg.png'},
        {'name': 'Elon Musk', 'image': 'elon_musk.png'},
        {'name': 'Lil Wayne', 'image': 'lil_wayne.png'},
    ]
    return render_template('meanclock.html', celebrities=celebrities, neets_api_key=neets_api_key)

@app.route('/submit-audio', methods=['POST'])
def submit_audio():
    if 'audio' not in request.files:
        return jsonify({'status': 'error', 'message': 'No audio file uploaded.'}), 400
    
    audio = request.files['audio']
    celebrity = request.form.get('celebrity', 'unknown')

    # Create a timestamped file name
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"{celebrity}_{timestamp}.wav")
    
    try:
        # Save the audio file to the temporary location
        audio.save(file_path)
        logging.info(f"Audio file saved at {file_path}")
        
        # Upload the audio file to Google Cloud Storage
        upload_to_gcs(bucket_name, file_path)
        return jsonify({'status': 'success'})
    except Exception as e:
        logging.error(f"Error uploading audio file: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to upload audio file.'}), 500
    finally:
        # Clean up: remove the temporary file after upload
        if os.path.exists(file_path):
            os.remove(file_path)


@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    celebrity = data['celebrity']
    message = data['message']
    captcha_response = data.get('captcha')

    if not validate_captcha(captcha_response):
        return jsonify({'status': 'error', 'message': 'CAPTCHA failed'}), 400

    voice_id_map = {
        'Gilbert Gottfried': 'gilbert-gottfried',
        'Mike Tyson': 'mike_tyson_voice_id',
        'Kermit': 'kermit_voice_id',
        'Donald Trump': 'donald_trump_voice_id',
        'Joe Biden': 'joe_biden_voice_id',
        'Andrew Tate': 'andrew_tate_voice_id',
        'Kanye West': 'kanye_west_voice_id',
        'Snoop Dogg': 'snoop_dogg_voice_id',
        'Elon Musk': 'elon_musk_voice_id',
        'Lil Wayne': 'lil_wayne_voice_id',
    }
    voice_id = voice_id_map.get(celebrity)

    api_url = "https://api.neets.ai/v1/tts"
    headers = {
        'accept': 'audio/wav',
        'content-type': 'application/json',
        'x-api-key': neets_api_key
    }
    payload = {
        'text': message,
        'voice_id': voice_id,
        'fmt': 'mp3',
        'params': {'alpha': 0.3, 'beta': 0.7, 'diffusion_steps': 10, 'embedding_scale': 1}
    }
    
    response = requests.post(api_url, headers=headers, json=payload)

    if response.status_code == 200:
        destination_blob_name = f"{celebrity}_{int(time.time())}.wav"
        download_mp3(response.content, destination_blob_name)
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'error', 'message': 'MP3 generation failed'}), 500

def validate_captcha(captcha_response):
    secret_key = recaptcha_secret_key
    url = f"https://www.google.com/recaptcha/api/siteverify?secret={secret_key}&response={captcha_response}"
    response = requests.post(url)
    result = response.json()
    return result.get('success', False)

def download_mp3(mp3_content, destination_blob_name):
    file_path = tempfile.mktemp(suffix=".wav")
    with open(file_path, 'wb') as f:
        f.write(mp3_content)
    upload_to_gcs(bucket_name, file_path)
    os.remove(file_path)

@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    data = request.get_json()
    
    # Validate captcha
    if not validate_captcha(data.get('captcha')):
        return jsonify({'error': 'CAPTCHA validation failed'}), 400
    
    # Call Neets.ai API using your server-side API key
    headers = {
        'accept': 'audio/wav',
        'content-type': 'application/json',
        'x-api-key': neets_api_key
    }
    
    payload = {
        'text': data.get('text'),
        'voice_id': data.get('voice_id'),
        'fmt': 'mp3',
        'params': { 'model': 'ar-diff-50k' }
    }
    
    response = requests.post('https://api.neets.ai/v1/tts', 
                            headers=headers, 
                            json=payload)
    
    if response.status_code == 200:
        return Response(response.content, 
                       mimetype='audio/wav')
    else:
        return jsonify({'error': 'Failed to generate audio'}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True)
