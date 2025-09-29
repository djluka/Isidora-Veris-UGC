from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import subprocess
import asyncio
from pathlib import Path
import shutil
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Optimizer API", description="API for lossless video optimization")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Store job statuses in memory (use Redis or database for production)
job_statuses = {}

def cleanup_old_files():
    """Clean up files older than 1 hour"""
    import time
    current_time = time.time()
    
    for directory in [UPLOAD_DIR, OUTPUT_DIR]:
        for file_path in directory.glob("*"):
            if file_path.is_file() and current_time - file_path.stat().st_mtime > 3600:  # 1 hour
                try:
                    file_path.unlink()
                    logger.info(f"Cleaned up old file: {file_path}")
                except Exception as e:
                    logger.error(f"Error cleaning up {file_path}: {e}")

async def optimize_video(input_path: Path, output_path: Path, job_id: str, output_format: str = "original"):
    """Optimize video using FFmpeg with aggressive compression"""
    try:
        job_statuses[job_id] = {"status": "processing", "progress": 0}
        
        # Get video info first
        info_cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams",
            str(input_path)
        ]
        
        result = subprocess.run(info_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception("Failed to get video information")
        
        # Build FFmpeg command based on output format
        if output_format == "mp4":
            # MP4 with H.264 (AVC) - Optimized for small size and web compatibility
            cmd = [
                "ffmpeg", "-i", str(input_path),
                "-c:v", "libx264",           # H.264/AVC codec
                "-preset", "slow",           # Better compression (slower encoding)
                "-crf", "26",                # Aggressive compression for smaller files
                "-maxrate", "1.5M",          # Lower bitrate cap for smaller files
                "-bufsize", "3M",            # Buffer size for bitrate control
                "-c:a", "aac",               # AAC audio codec (standard for MP4)
                "-b:a", "96k",               # Lower audio bitrate for smaller files
                "-ac", "2",                  # Stereo audio
                "-movflags", "+faststart",   # Optimize for web streaming
                "-pix_fmt", "yuv420p",       # Ensure compatibility
                "-profile:v", "high",        # H.264 High Profile for better compression
                "-level", "4.0",             # H.264 level for wide compatibility
                "-tune", "film",             # Optimize encoding for film content
                "-f", "mp4",                 # Force MP4 container format
                "-y",                        # Overwrite output file
                str(output_path)
            ]
        else:
            # Original format optimization with aggressive compression
            cmd = [
                "ffmpeg", "-i", str(input_path),
                "-c:v", "libx264",           # Use H.264 codec
                "-preset", "slow",           # Better compression (slower encoding)
                "-crf", "25",                # Higher compression (lower quality but much smaller files)
                "-maxrate", "2M",            # Maximum bitrate cap for web
                "-bufsize", "4M",            # Buffer size for consistent bitrate
                "-c:a", "aac",               # AAC audio codec
                "-b:a", "96k",               # Lower audio bitrate for smaller files
                "-ac", "2",                  # Stereo audio only
                "-movflags", "+faststart",   # Optimize for web streaming
                "-pix_fmt", "yuv420p",       # Ensure compatibility
                "-tune", "film",             # Optimize for film content
                "-profile:v", "high",        # Use high profile for better compression
                "-level", "4.0",             # H.264 level for compatibility
                "-y",                        # Overwrite output file
                str(output_path)
            ]
        
        # Run FFmpeg
        process = subprocess.Popen(cmd, stderr=subprocess.PIPE, universal_newlines=True)
        
        # Monitor progress (simplified - just mark as processing)
        job_statuses[job_id] = {"status": "processing", "progress": 50}
        
        # Wait for completion
        _, stderr = process.communicate()
        
        if process.returncode == 0:
            job_statuses[job_id] = {"status": "completed", "progress": 100, "output_file": output_path.name}
            logger.info(f"Video optimization completed for job {job_id}")
        else:
            job_statuses[job_id] = {"status": "failed", "error": stderr}
            logger.error(f"FFmpeg error for job {job_id}: {stderr}")
            
    except Exception as e:
        job_statuses[job_id] = {"status": "failed", "error": str(e)}
        logger.error(f"Error optimizing video for job {job_id}: {e}")

@app.on_event("startup")
async def startup_event():
    """Check if FFmpeg is available"""
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        subprocess.run(["ffprobe", "-version"], capture_output=True, check=True)
        logger.info("FFmpeg is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("FFmpeg is not available. Please install FFmpeg.")
        raise Exception("FFmpeg is required but not found")

@app.get("/")
async def root():
    return {"message": "Video Optimizer API", "status": "running"}

@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    output_format: str = Form("original")
):
    """Upload a video file for optimization"""
    logger.info(f"Upload request received - filename: {file.filename}, format: {output_format}")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Validate output format
    supported_formats = ["original", "mp4"]
    if output_format not in supported_formats:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Choose from: {supported_formats}")
    
    logger.info(f"Processing with format: {output_format}")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_extension = Path(file.filename).suffix if file.filename else ".mp4"
    input_filename = f"{job_id}_input{file_extension}"
    
    # Determine output extension based on format choice
    if output_format == "mp4":
        output_extension = ".mp4"
    else:
        output_extension = file_extension  # Keep original format
    
    output_filename = f"{job_id}_output{output_extension}"
    
    input_path = UPLOAD_DIR / input_filename
    output_path = OUTPUT_DIR / output_filename
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Initialize job status
        job_statuses[job_id] = {"status": "uploaded", "progress": 0}
        
        # Start optimization in background
        background_tasks.add_task(optimize_video, input_path, output_path, job_id, output_format)
        background_tasks.add_task(cleanup_old_files)
        
        return {"job_id": job_id, "message": "File uploaded successfully, optimization started"}
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Error uploading file")

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a video optimization job"""
    if job_id not in job_statuses:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job_statuses[job_id]

@app.get("/download/{job_id}")
async def download_optimized_video(job_id: str):
    """Download the optimized video"""
    if job_id not in job_statuses:
        logger.error(f"Job {job_id} not found in statuses")
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_status = job_statuses[job_id]
    logger.info(f"Download request for job {job_id}, status: {job_status['status']}")
    
    if job_status["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Job not completed yet. Current status: {job_status['status']}")
    
    output_file = job_status.get("output_file")
    if not output_file:
        logger.error(f"No output file in job status for {job_id}")
        raise HTTPException(status_code=500, detail="Output file not found in job status")
    
    output_path = OUTPUT_DIR / output_file
    logger.info(f"Looking for output file at: {output_path}")
    
    if not output_path.exists():
        logger.error(f"Output file does not exist on disk: {output_path}")
        # List files in output directory for debugging
        output_files = list(OUTPUT_DIR.glob("*"))
        logger.info(f"Files in output directory: {[f.name for f in output_files]}")
        raise HTTPException(status_code=404, detail="Output file not found on disk")
    
    file_size = output_path.stat().st_size
    logger.info(f"Serving file {output_path} (size: {file_size} bytes)")
    
    # Determine appropriate media type based on file extension
    file_extension = output_path.suffix.lower()
    media_type_map = {
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
    }
    media_type = media_type_map.get(file_extension, 'video/mp4')
    
    return FileResponse(
        path=str(output_path),
        filename=f"optimized_{output_path.stem}{output_path.suffix}",
        media_type=media_type,
        headers={"Content-Length": str(file_size)}
    )

@app.delete("/cleanup/{job_id}")
async def cleanup_job_files(job_id: str):
    """Clean up files for a specific job"""
    if job_id not in job_statuses:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Remove files
    for directory in [UPLOAD_DIR, OUTPUT_DIR]:
        for pattern in [f"{job_id}_input*", f"{job_id}_output*"]:
            for file_path in directory.glob(pattern):
                try:
                    file_path.unlink()
                    logger.info(f"Cleaned up file: {file_path}")
                except Exception as e:
                    logger.error(f"Error cleaning up {file_path}: {e}")
    
    # Remove job status
    del job_statuses[job_id]
    
    return {"message": "Job files cleaned up successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
