from flask import Flask, request, jsonify
from flask_cors import CORS
from rembg import remove
from PIL import Image
import base64
import io
import os

app = Flask(__name__)
CORS(app)

@app.route('/remove-background', methods=['POST'])
def remove_background():
    try:
        input_image = None
        
        # Check if request contains files (FormData)
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                input_image = Image.open(file.stream)
                print(f"[OK] Processing uploaded file: {file.filename}")
        
        # Check if request contains JSON data (base64)
        elif request.is_json:
            data = request.get_json()
            if data and 'image' in data:
                image_data = data['image']
                if image_data.startswith('data:image'):
                    # Remove data URL prefix
                    image_data = image_data.split(',')[1]
                
                # Convert base64 to PIL Image
                image_bytes = base64.b64decode(image_data)
                input_image = Image.open(io.BytesIO(image_bytes))
                print("[OK] Processing base64 image data")
        
        if not input_image:
            return jsonify({'error': 'No image data provided'}), 400
        
        print(f"[INFO] Image size: {input_image.size}, mode: {input_image.mode}")
        
        # Remove background using rembg
        output_image = remove(input_image)
        print("[OK] Background removed successfully")
        
        # Convert result back to bytes for direct response
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        output_buffer.seek(0)
        
        # Return the processed image directly as PNG
        from flask import Response
        return Response(
            output_buffer.getvalue(),
            mimetype='image/png',
            headers={
                'Content-Disposition': 'attachment; filename=processed_image.png',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        print(f"[ERROR] Error in background removal: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Background removal failed: {str(e)}'}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'status': 'OK', 
        'service': 'rembg-background-removal',
        'message': 'Rembg Background Removal Service is running!',
        'endpoints': {
            'health': '/health',
            'remove_background': '/remove-background'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'service': 'rembg-background-removal'})

if __name__ == '__main__':
    print("Starting Rembg Background Removal Service...")
    print("Installing required models...")
    
    # Download default model on startup
    try:
        from rembg import new_session
        session = new_session()
        print("Rembg models ready!")
    except Exception as e:
        print(f"Warning: Could not load rembg models: {e}")
    
    app.run(host='0.0.0.0', port=5001, debug=False, load_dotenv=False)
