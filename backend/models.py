from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import uuid

class TargetSearchRequest(BaseModel):
    target_name: str = Field(..., description="Planet name, TIC ID, or star name")
    search_type: str = Field(default="auto", description="Search type: planet, star, or auto")

class ExoplanetCandidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    host_star: str
    discovery_method: Optional[str] = None
    discovery_year: Optional[int] = None
    radius_earth: Optional[float] = None
    mass_earth: Optional[float] = None
    orbital_period: Optional[float] = None
    semi_major_axis: Optional[float] = None
    transit_depth: Optional[float] = None
    star_temperature: Optional[float] = None
    star_radius: Optional[float] = None
    star_mass: Optional[float] = None
    ra: Optional[float] = None
    dec: Optional[float] = None
    confidence_score: Optional[float] = None
    status: str = Field(default="candidate")  # "candidate" or "confirmed"
    tic_id: Optional[int] = None
    toi_id: Optional[str] = None
    kepler_id: Optional[str] = None

class LightCurveData(BaseModel):
    time: List[float]
    flux: List[float]
    flux_err: Optional[List[float]] = None
    quality: Optional[List[int]] = None
    mission: str
    sector: Optional[int] = None
    quarter: Optional[int] = None
    target_name: str
    length: int

class TransitAnalysis(BaseModel):
    period: float
    period_uncertainty: Optional[float] = None
    depth: float
    depth_uncertainty: Optional[float] = None
    duration: float
    duration_uncertainty: Optional[float] = None
    snr: float
    chi_squared: Optional[float] = None
    fitted_parameters: Optional[Dict[str, Any]] = None

class CentroidMotionAnalysis(BaseModel):
    offset_mas: float
    offset_uncertainty: Optional[float] = None
    snr_ratio: float
    motion_correlation: float
    centroid_shift_significance: float
    raw_offset_x: Optional[float] = None
    raw_offset_y: Optional[float] = None

class UncertaintyQuantification(BaseModel):
    parameter_uncertainties: Dict[str, float]
    reliability_flags: List[str]
    confidence_intervals: Dict[str, Dict[str, float]]
    validation_score: float

class PhysicsInformedAnalysis(BaseModel):
    transit_fit: TransitAnalysis
    stellar_parameters: Dict[str, float]
    planet_parameters: Dict[str, float]
    physics_constraints: Dict[str, Any]
    model_comparison: Dict[str, float]

class AnalysisResult(BaseModel):
    candidate: ExoplanetCandidate
    light_curve: Optional[LightCurveData] = None
    transit_analysis: Optional[TransitAnalysis] = None
    centroid_analysis: Optional[CentroidMotionAnalysis] = None
    uncertainty_analysis: Optional[UncertaintyQuantification] = None
    physics_analysis: Optional[PhysicsInformedAnalysis] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnalysisRequest(BaseModel):
    target_name: str
    analysis_types: List[str] = Field(default=["light_curve", "transit", "centroid", "uncertainty"])
    user_mode: str = Field(default="scientist", description="novice or scientist")
    custom_parameters: Optional[Dict[str, Any]] = None

class ExportRequest(BaseModel):
    analysis_id: str
    export_type: str = Field(..., description="pdf, csv, or json")
    include_plots: bool = Field(default=True)

class UploadLightCurveRequest(BaseModel):
    target_name: str
    time_column: str = Field(default="time")
    flux_column: str = Field(default="flux")
    error_column: Optional[str] = None
    csv_data: str