from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import asyncio
import json
import pandas as pd
from io import StringIO
import numpy as np

# Import our modules
from models import *
from nasa_client import NASAExoplanetClient
from ai_analysis import AIExoplanetAnalyzer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="ExoSeer - Advanced Exoplanet Detection API",
    description="AI-powered exoplanet detection and vetting system with NASA data integration",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=getattr(logging, os.environ.get('LOG_LEVEL', 'INFO')))
logger = logging.getLogger(__name__)

# Global clients (will be initialized on startup)
nasa_client = None
ai_analyzer = None

class Settings:
    EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
    NASA_API_BASE_URL = os.environ.get('NASA_API_BASE_URL', 'https://exoplanetarchive.ipac.caltech.edu')
    NASA_TAP_URL = os.environ.get('NASA_TAP_URL', 'https://exoplanetarchive.ipac.caltech.edu/TAP')
    MAST_BASE_URL = os.environ.get('MAST_BASE_URL', 'https://exo.mast.stsci.edu')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    CACHE_TIMEOUT = int(os.environ.get('CACHE_TIMEOUT', '3600'))

settings = Settings()

@app.on_event("startup")
async def startup_event():
    """Initialize clients on startup"""
    global nasa_client, ai_analyzer
    logger.info("Initializing ExoSeer application...")
    
    # Initialize AI analyzer (don't need to create instance for each request)
    ai_analyzer = AIExoplanetAnalyzer(settings)
    
    logger.info("ExoSeer application initialized successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Root endpoints
@api_router.get("/")
async def root():
    return {
        "message": "ExoSeer - Advanced Exoplanet Detection API",
        "version": "1.0.0",
        "status": "operational"
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "nasa_apis": "operational",
            "ai_analysis": "operational",
            "database": "operational"
        }
    }

# Target search endpoints
@api_router.post("/targets/search", response_model=Dict[str, Any])
async def search_targets(request: TargetSearchRequest):
    """Search for exoplanet targets using NASA APIs"""
    
    try:
        async with NASAExoplanetClient(settings) as client:
            # Search exoplanets
            exoplanet_candidates = await client.search_exoplanets(request.target_name)
            
            # Also search TESS candidates if looks like TIC ID
            tess_candidates = []
            if 'TIC' in request.target_name.upper() or request.target_name.isdigit():
                tess_candidates = await client.search_tess_candidates(request.target_name)
            
            # Combine and deduplicate results
            all_candidates = exoplanet_candidates + tess_candidates
            
            # Remove duplicates by name
            seen_names = set()
            unique_candidates = []
            for candidate in all_candidates:
                if candidate['name'] not in seen_names:
                    seen_names.add(candidate['name'])
                    unique_candidates.append(candidate)
            
            return {
                "target_name": request.target_name,
                "candidates": unique_candidates[:20],  # Limit to 20 results
                "total_found": len(unique_candidates),
                "search_type": request.search_type,
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Target search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@api_router.get("/targets/{target_name}/details")
async def get_target_details(target_name: str):
    """Get detailed information for a specific target"""
    
    try:
        async with NASAExoplanetClient(settings) as client:
            details = await client.get_planet_details(target_name)
            return {
                "target_name": target_name,
                "details": details,
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get target details: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve target details")

# Light curve data endpoints
@api_router.get("/lightcurves/{target_name}")
async def get_light_curve_data(
    target_name: str,
    mission: str = "TESS",
    sector: Optional[int] = None
):
    """Get light curve data for a target"""
    
    try:
        async with NASAExoplanetClient(settings) as client:
            light_curve_data = await client.get_light_curve_data(target_name, mission, sector)
            
            if not light_curve_data:
                raise HTTPException(status_code=404, detail="No light curve data found")
            
            return {
                "target_name": target_name,
                "mission": mission,
                "sector": sector,
                "light_curve": light_curve_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get light curve data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve light curve data")

@api_router.post("/lightcurves/upload")
async def upload_light_curve(request: UploadLightCurveRequest):
    """Upload custom light curve data"""
    
    try:
        # Parse CSV data
        df = pd.read_csv(StringIO(request.csv_data))
        
        # Validate required columns
        if request.time_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Time column '{request.time_column}' not found")
        
        if request.flux_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Flux column '{request.flux_column}' not found")
        
        # Extract data
        time_data = df[request.time_column].tolist()
        flux_data = df[request.flux_column].tolist()
        flux_err_data = None
        
        if request.error_column and request.error_column in df.columns:
            flux_err_data = df[request.error_column].tolist()
        
        light_curve = {
            'time': time_data,
            'flux': flux_data,
            'flux_err': flux_err_data,
            'mission': 'User Upload',
            'target_name': request.target_name,
            'length': len(time_data)
        }
        
        return {
            "message": "Light curve uploaded successfully",
            "target_name": request.target_name,
            "light_curve": light_curve,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except Exception as e:
        logger.error(f"Light curve upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

# Analysis endpoints
@api_router.post("/analyze/complete", response_model=Dict[str, Any])
async def run_complete_analysis(request: AnalysisRequest):
    """Run complete exoplanet analysis pipeline"""
    
    try:
        # Initialize result structure
        result = {
            "target_name": request.target_name,
            "user_mode": request.user_mode,
            "analysis_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "analyses": {}
        }
        
        # Get candidate information
        async with NASAExoplanetClient(settings) as nasa_client:
            try:
                candidates = await nasa_client.search_exoplanets(request.target_name)
                if not candidates:
                    raise HTTPException(status_code=404, detail="No candidates found for target")
                
                primary_candidate = candidates[0]
                result["candidate"] = primary_candidate
                
                # Get light curve data if requested
                light_curve_data = None
                if "light_curve" in request.analysis_types:
                    light_curve_data = await nasa_client.get_light_curve_data(request.target_name)
                    if light_curve_data:
                        result["analyses"]["light_curve"] = light_curve_data
                
                # Run AI analyses
                if light_curve_data and ai_analyzer:
                    
                    # Transit analysis
                    if "transit" in request.analysis_types:
                        transit_analysis = await ai_analyzer.analyze_transit_physics(
                            light_curve_data, primary_candidate
                        )
                        result["analyses"]["transit_analysis"] = transit_analysis
                    
                    # Centroid motion analysis
                    if "centroid" in request.analysis_types:
                        transit_params = result["analyses"].get("transit_analysis", {})
                        centroid_analysis = await ai_analyzer.analyze_centroid_motion(
                            light_curve_data, transit_params
                        )
                        result["analyses"]["centroid_analysis"] = centroid_analysis
                    
                    # Uncertainty quantification
                    if "uncertainty" in request.analysis_types:
                        transit_analysis = result["analyses"].get("transit_analysis", {})
                        centroid_analysis = result["analyses"].get("centroid_analysis", {})
                        
                        uncertainty_analysis = await ai_analyzer.quantify_uncertainties(
                            transit_analysis, centroid_analysis, primary_candidate
                        )
                        result["analyses"]["uncertainty_analysis"] = uncertainty_analysis
                    
                    # Ensemble predictions
                    ensemble_analysis = await ai_analyzer.generate_ensemble_predictions(
                        result["analyses"], primary_candidate
                    )
                    result["analyses"]["ensemble_predictions"] = ensemble_analysis
                
                # Store result in database
                analysis_doc = {
                    "_id": result["analysis_id"],
                    "target_name": request.target_name,
                    "result": result,
                    "created_at": datetime.utcnow()
                }
                
                await db.analyses.insert_one(analysis_doc)
                
                return result
                
            except Exception as e:
                logger.error(f"Analysis failed for {request.target_name}: {e}")
                raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Complete analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis pipeline failed")

@api_router.get("/analyze/{analysis_id}")
async def get_analysis_result(analysis_id: str):
    """Get stored analysis result"""
    
    try:
        analysis_doc = await db.analyses.find_one({"_id": analysis_id})
        
        if not analysis_doc:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return analysis_doc["result"]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analysis")

@api_router.post("/analyze/transit")
async def analyze_transit_only(
    target_name: str,
    light_curve_data: Dict[str, Any],
    candidate_params: Optional[Dict[str, Any]] = None
):
    """Run only transit analysis"""
    
    if not ai_analyzer:
        raise HTTPException(status_code=503, detail="AI analyzer not available")
    
    try:
        if not candidate_params:
            candidate_params = {}
        
        transit_analysis = await ai_analyzer.analyze_transit_physics(
            light_curve_data, candidate_params
        )
        
        return {
            "target_name": target_name,
            "transit_analysis": transit_analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Transit analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transit analysis failed: {str(e)}")

# Export endpoints
@api_router.post("/export/pdf/{analysis_id}")
async def export_analysis_pdf(analysis_id: str, request: ExportRequest):
    """Export analysis results as PDF"""
    
    try:
        analysis_doc = await db.analyses.find_one({"_id": analysis_id})
        
        if not analysis_doc:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # For now, return JSON (PDF generation would require additional libraries)
        return JSONResponse({
            "message": "PDF export not yet implemented",
            "analysis_id": analysis_id,
            "data": analysis_doc["result"],
            "export_type": request.export_type
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        raise HTTPException(status_code=500, detail="Export failed")

@api_router.get("/export/csv/{analysis_id}")
async def export_analysis_csv(analysis_id: str):
    """Export analysis results as CSV"""
    
    try:
        analysis_doc = await db.analyses.find_one({"_id": analysis_id})
        
        if not analysis_doc:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        result = analysis_doc["result"]
        
        # Create CSV data from light curve if available
        if "light_curve" in result.get("analyses", {}):
            lc_data = result["analyses"]["light_curve"]
            
            df = pd.DataFrame({
                'time': lc_data.get('time', []),
                'flux': lc_data.get('flux', []),
                'flux_err': lc_data.get('flux_err', []) or [None] * len(lc_data.get('time', []))
            })
            
            csv_data = df.to_csv(index=False)
            
            return JSONResponse({
                "csv_data": csv_data,
                "filename": f"exoseer_analysis_{analysis_id}.csv"
            })
        else:
            raise HTTPException(status_code=404, detail="No light curve data to export")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV export failed: {e}")
        raise HTTPException(status_code=500, detail="Export failed")

# Utility endpoints
@api_router.get("/candidates/recent")
async def get_recent_candidates(limit: int = 10):
    """Get recently analyzed candidates"""
    
    try:
        cursor = db.analyses.find().sort("created_at", -1).limit(limit)
        recent_analyses = await cursor.to_list(length=limit)
        
        candidates = []
        for analysis in recent_analyses:
            result = analysis.get("result", {})
            candidate = result.get("candidate", {})
            if candidate:
                candidates.append({
                    "analysis_id": analysis["_id"],
                    "target_name": result.get("target_name"),
                    "candidate": candidate,
                    "created_at": analysis.get("created_at", "").isoformat() if analysis.get("created_at") else ""
                })
        
        return {
            "recent_candidates": candidates,
            "count": len(candidates)
        }
        
    except Exception as e:
        logger.error(f"Failed to get recent candidates: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recent candidates")

@api_router.get("/stats/summary")
async def get_analysis_stats():
    """Get analysis statistics"""
    
    try:
        total_analyses = await db.analyses.count_documents({})
        
        # Count by status (this would require analysis results to have status field)
        confirmed_count = await db.analyses.count_documents({"result.candidate.status": "confirmed"})
        candidate_count = await db.analyses.count_documents({"result.candidate.status": "candidate"})
        
        return {
            "total_analyses": total_analyses,
            "confirmed_planets": confirmed_count,
            "planet_candidates": candidate_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)