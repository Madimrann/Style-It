# Rembg Background Removal Service

This Python service provides free background removal using the [rembg](https://github.com/danielgatis/rembg) library, replacing the limited Remove.bg API.

## Features

- ✅ **Free & Unlimited**: No API tokens or rate limits
- ✅ **High Quality**: Uses state-of-the-art AI models
- ✅ **Local Processing**: Runs entirely on your machine
- ✅ **Multiple Models**: Supports various specialized models
- ✅ **Easy Integration**: Simple REST API

## Requirements

- Python 3.7+
- pip (Python package manager)

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the service:**
   ```bash
   python rembg_service.py
   ```

The service will start on `http://localhost:5001`

## API Endpoints

### Remove Background
- **URL**: `POST /remove-background`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "image": "base64_encoded_image_data"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "processed_image": "data:image/png;base64,processed_image_data"
  }
  ```

### Health Check
- **URL**: `GET /health`
- **Response**:
  ```json
  {
    "status": "OK",
    "service": "rembg-background-removal"
  }
  ```

## Available Models

The service automatically downloads models on first use. Available models include:

- **u2net**: General purpose (default)
- **u2netp**: Lightweight version
- **u2net_human_seg**: Human segmentation
- **u2net_cloth_seg**: Clothing segmentation
- **silueta**: Reduced size model
- **isnet-general-use**: High accuracy general use
- **isnet-anime**: Anime character segmentation
- **sam**: Segment Anything Model
- **birefnet-general**: General purpose (newer)
- **birefnet-portrait**: Human portraits

## Usage Examples

### Using curl
```bash
# Remove background from base64 image
curl -X POST http://localhost:5001/remove-background \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."}'
```

### Using JavaScript
```javascript
const response = await fetch('http://localhost:5001/remove-background', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: base64ImageData
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Processed image:', result.processed_image);
}
```

## Integration with StyleIt

The service integrates seamlessly with the StyleIt application:

1. **Start the service**: Run `python rembg_service.py`
2. **Start StyleIt**: Run `npm run start:rembg` or `npm run start:full`
3. **Upload images**: Background removal happens automatically

## Troubleshooting

### Service won't start
- Ensure Python 3.7+ is installed
- Check if port 5001 is available
- Install dependencies: `pip install -r requirements.txt`

### Slow processing
- First run downloads models (~100MB)
- Subsequent runs are faster
- Consider using lighter models for speed

### Memory issues
- Use `u2netp` or `silueta` models for lower memory usage
- Close other applications to free up RAM

## Performance

- **First run**: ~10-30 seconds (model download)
- **Subsequent runs**: ~2-5 seconds per image
- **Memory usage**: ~1-2GB RAM
- **Supported formats**: JPEG, PNG, WebP, BMP

## License

This service uses the [rembg](https://github.com/danielgatis/rembg) library, which is licensed under the MIT License.
