# Video Optimizer

A web application for optimizing video files with lossless compression, built with FastAPI backend and React frontend, containerized with Docker.

## Features

- **Web-based interface** for easy video upload and download
- **Lossless video optimization** using FFmpeg with H.264 codec and CRF 18 settings
- **Real-time progress tracking** of video processing jobs
- **Automatic cleanup** of files after 1 hour
- **Docker containerization** for easy deployment
- **Modern UI** with drag-and-drop upload interface
- **Support for multiple video formats**: MP4, AVI, MOV, MKV, WMV, FLV, WebM
- **File size limit**: 500MB per file
- **Web-optimized output** with fast-start settings for streaming

## Architecture

- **Backend**: FastAPI with Python
- **Frontend**: React with Tailwind CSS
- **Video Processing**: FFmpeg
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (for frontend)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed on your system

### Running with Docker

1. Clone or download this project
2. Navigate to the project directory
3. Build and run the containers:

```bash
docker-compose up --build
```

4. Open your browser and navigate to `http://localhost:3000`

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000` (accessible through frontend proxy)

### Development Setup

#### Backend Development

```bash
cd backend
pip install -r requirements.txt
# Install FFmpeg on your system
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Development

```bash
cd frontend
npm install
npm start
```

## Usage

1. **Upload a video**: Drag and drop a video file or click to select one
2. **Monitor progress**: Watch the real-time progress of your video optimization
3. **Download optimized video**: Once processing is complete, download your optimized file
4. **Cleanup**: Files are automatically cleaned up after 1 hour, or you can manually remove them

## Video Optimization Settings

The tool uses the following FFmpeg settings for lossless optimization:

- **Video codec**: H.264 (libx264)
- **Quality**: CRF 18 (visually lossless)
- **Preset**: Slow (better compression)
- **Audio codec**: AAC at 128k bitrate
- **Web optimization**: Fast-start enabled for streaming
- **Pixel format**: yuv420p for maximum compatibility

## API Endpoints

- `POST /upload` - Upload a video file for processing
- `GET /status/{job_id}` - Get processing status of a job
- `GET /download/{job_id}` - Download the optimized video
- `DELETE /cleanup/{job_id}` - Clean up job files

## File Structure

```
video-optimizer/
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI application
│   ├── Dockerfile           # Backend Docker configuration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.js          # Main application component
│   │   └── index.js        # Application entry point
│   ├── public/
│   ├── Dockerfile          # Frontend Docker configuration
│   ├── nginx.conf          # Nginx configuration
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## Configuration

### Environment Variables

- `REACT_APP_API_BASE`: Base URL for API calls (default: empty for proxy)

### Docker Compose Customization

You can modify the `docker-compose.yml` file to:
- Change port mappings
- Add environment variables
- Configure volume mounts
- Set resource limits

## Production Considerations

For production deployment, consider:

1. **Security**: Configure CORS properly, add authentication
2. **Storage**: Use external storage for videos (AWS S3, etc.)
3. **Scaling**: Add load balancing and multiple backend instances
4. **Monitoring**: Add logging and monitoring solutions
5. **SSL**: Configure HTTPS with proper certificates
6. **Resource limits**: Set appropriate CPU/memory limits in Docker

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed in the container
2. **Upload fails**: Check file size limits and supported formats
3. **Processing stuck**: Check backend logs for FFmpeg errors
4. **Port conflicts**: Change port mappings in docker-compose.yml

### Viewing Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

## License

This project is open source and available under the MIT License.
