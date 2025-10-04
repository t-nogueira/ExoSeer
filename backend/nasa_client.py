import asyncio
import aiohttp
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import quote_plus
import logging
from datetime import datetime, timedelta
import numpy as np
from io import StringIO
import json

logger = logging.getLogger(__name__)

class NASAExoplanetClient:
    """NASA Exoplanet Archive and MAST data client"""
    
    def __init__(self, settings):
        self.settings = settings
        self.tap_url = f"{settings.NASA_TAP_URL}/sync"
        self.mast_url = settings.MAST_BASE_URL
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'ExoSeer/1.0 (Research Application)'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def search_exoplanets(self, target_name: str) -> List[Dict[str, Any]]:
        """Search for exoplanets by target name"""
        
        # Clean and prepare target name for search
        clean_target = target_name.strip().replace("_", " ")
        
        # Try multiple search strategies
        candidates = []
        
        # Strategy 1: Direct name match
        query1 = f"""
        SELECT pl_name, hostname, discoverymethod, disc_year, pl_rade, pl_masse, 
               pl_orbper, pl_orbsmax, pl_tranmid, pl_trandep, pl_trandur,
               st_teff, st_rad, st_mass, ra, dec, sy_dist
        FROM ps 
        WHERE UPPER(pl_name) LIKE UPPER('%{clean_target}%') 
        OR UPPER(hostname) LIKE UPPER('%{clean_target}%')
        AND default_flag = 1
        ORDER BY disc_year DESC
        LIMIT 50
        """
        
        df1 = await self._execute_tap_query(query1)
        if not df1.empty:
            candidates.extend(self._process_planet_data(df1))
        
        # Strategy 2: TIC/TOI/KOI search if looks like an ID
        if any(prefix in target_name.upper() for prefix in ['TIC', 'TOI', 'KOI', 'K2']):
            # Extract numeric part
            import re
            match = re.search(r'(\d+)', target_name)
            if match:
                target_id = match.group(1)
                
                query2 = f"""
                SELECT pl_name, hostname, discoverymethod, disc_year, pl_rade, pl_masse, 
                       pl_orbper, pl_orbsmax, pl_tranmid, pl_trandep, pl_trandur,
                       st_teff, st_rad, st_mass, ra, dec, sy_dist
                FROM ps 
                WHERE pl_name LIKE '%{target_id}%' 
                OR hostname LIKE '%{target_id}%'
                AND default_flag = 1
                ORDER BY disc_year DESC
                LIMIT 20
                """
                
                df2 = await self._execute_tap_query(query2)
                if not df2.empty:
                    new_candidates = self._process_planet_data(df2)
                    # Avoid duplicates
                    existing_names = {c['name'] for c in candidates}
                    candidates.extend([c for c in new_candidates if c['name'] not in existing_names])
        
        # Strategy 3: Nearby stars search if coordinates provided or star name
        if len(candidates) < 5:
            stellar_query = f"""
            SELECT pl_name, hostname, discoverymethod, disc_year, pl_rade, pl_masse, 
                   pl_orbper, pl_orbsmax, pl_tranmid, pl_trandep, pl_trandur,
                   st_teff, st_rad, st_mass, ra, dec, sy_dist
            FROM ps 
            WHERE UPPER(hostname) LIKE UPPER('%{clean_target.split()[0]}%')
            AND default_flag = 1
            ORDER BY disc_year DESC
            LIMIT 10
            """
            
            df3 = await self._execute_tap_query(stellar_query)
            if not df3.empty:
                new_candidates = self._process_planet_data(df3)
                existing_names = {c['name'] for c in candidates}
                candidates.extend([c for c in new_candidates if c['name'] not in existing_names])
        
        return candidates[:20]  # Limit to top 20 results
    
    async def get_planet_details(self, planet_name: str) -> Dict[str, Any]:
        """Get detailed information for a specific planet"""
        
        query = f"""
        SELECT *
        FROM ps
        WHERE pl_name = '{planet_name}' AND default_flag = 1
        """
        
        df = await self._execute_tap_query(query)
        if df.empty:
            raise ValueError(f"Planet {planet_name} not found in NASA Exoplanet Archive")
        
        return self._process_detailed_planet_data(df.iloc[0])
    
    async def search_tess_candidates(self, target: str) -> List[Dict[str, Any]]:
        """Search TESS candidates via MAST API"""
        
        try:
            # Try to extract TIC ID
            import re
            tic_match = re.search(r'TIC\s*(\d+)', target.upper())
            if tic_match:
                tic_id = int(tic_match.group(1))
            else:
                # Try direct numeric conversion
                try:
                    tic_id = int(''.join(filter(str.isdigit, target)))
                except ValueError:
                    return []
            
            # Query MAST for TESS data validation products
            url = f"{self.mast_url}/api/v0.1/dvdata/tess/{tic_id}/info/"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._process_tess_data(data, tic_id)
                else:
                    logger.warning(f"TESS data not found for TIC {tic_id}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error searching TESS candidates: {e}")
            return []
    
    async def get_light_curve_data(
        self, 
        target: str, 
        mission: str = "TESS",
        sector: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Get light curve data for a target"""
        
        try:
            # Use lightkurve library for data access
            import lightkurve as lk
            
            # Search for available data
            if mission.upper() == "TESS":
                search_result = lk.search_lightcurve(target, mission='TESS', sector=sector)
            elif mission.upper() == "KEPLER":
                search_result = lk.search_lightcurve(target, mission='Kepler')
            else:
                return None
            
            if len(search_result) == 0:
                return None
            
            # Download the first available light curve
            lc = search_result[0].download()
            if lc is None:
                return None
            
            # Clean and normalize
            clean_lc = lc.remove_outliers(sigma=3).normalize()
            
            return {
                'time': clean_lc.time.value.tolist(),
                'flux': clean_lc.flux.value.tolist(),
                'flux_err': clean_lc.flux_err.value.tolist() if clean_lc.flux_err is not None else None,
                'mission': mission,
                'target_name': str(lc.targetid),
                'sector': getattr(lc, 'sector', None),
                'quarter': getattr(lc, 'quarter', None),
                'length': len(clean_lc.time),
                'ra': float(lc.ra) if hasattr(lc, 'ra') and lc.ra is not None else None,
                'dec': float(lc.dec) if hasattr(lc, 'dec') and lc.dec is not None else None
            }
            
        except Exception as e:
            logger.error(f"Error getting light curve data: {e}")
            return None
    
    async def _execute_tap_query(self, query: str) -> pd.DataFrame:
        """Execute TAP query with error handling"""
        
        params = {
            'query': query,
            'format': 'csv'
        }
        
        try:
            async with self.session.get(self.tap_url, params=params) as response:
                if response.status == 200:
                    content = await response.text()
                    if content.strip():
                        return pd.read_csv(StringIO(content))
                    else:
                        return pd.DataFrame()
                else:
                    logger.error(f"TAP query failed with status {response.status}")
                    return pd.DataFrame()
                    
        except Exception as e:
            logger.error(f"TAP query failed: {e}")
            return pd.DataFrame()
    
    def _process_planet_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Process planet data from DataFrame"""
        
        candidates = []
        for _, row in df.iterrows():
            try:
                # Calculate confidence score based on available parameters
                confidence = self._calculate_confidence_score(row)
                
                # Determine status
                status = "confirmed" if pd.notna(row.get('pl_rade')) and pd.notna(row.get('pl_orbper')) else "candidate"
                
                candidate = {
                    'name': str(row.get('pl_name', '')),
                    'host_star': str(row.get('hostname', '')),
                    'discovery_method': str(row.get('discoverymethod', '')) if pd.notna(row.get('discoverymethod')) else None,
                    'discovery_year': int(row.get('disc_year')) if pd.notna(row.get('disc_year')) else None,
                    'radius_earth': float(row.get('pl_rade')) if pd.notna(row.get('pl_rade')) else None,
                    'mass_earth': float(row.get('pl_masse')) if pd.notna(row.get('pl_masse')) else None,
                    'orbital_period': float(row.get('pl_orbper')) if pd.notna(row.get('pl_orbper')) else None,
                    'semi_major_axis': float(row.get('pl_orbsmax')) if pd.notna(row.get('pl_orbsmax')) else None,
                    'transit_depth': float(row.get('pl_trandep')) if pd.notna(row.get('pl_trandep')) else None,
                    'star_temperature': float(row.get('st_teff')) if pd.notna(row.get('st_teff')) else None,
                    'star_radius': float(row.get('st_rad')) if pd.notna(row.get('st_rad')) else None,
                    'star_mass': float(row.get('st_mass')) if pd.notna(row.get('st_mass')) else None,
                    'ra': float(row.get('ra')) if pd.notna(row.get('ra')) else None,
                    'dec': float(row.get('dec')) if pd.notna(row.get('dec')) else None,
                    'confidence_score': confidence,
                    'status': status
                }
                
                candidates.append(candidate)
                
            except Exception as e:
                logger.error(f"Error processing planet data: {e}")
                continue
        
        return candidates
    
    def _process_detailed_planet_data(self, row: pd.Series) -> Dict[str, Any]:
        """Process detailed planet data"""
        
        result = {}
        for column in row.index:
            value = row[column]
            if pd.notna(value):
                if isinstance(value, (int, float)):
                    result[column] = float(value) if not isinstance(value, int) else int(value)
                else:
                    result[column] = str(value)
        
        return result
    
    def _process_tess_data(self, data: Dict[str, Any], tic_id: int) -> List[Dict[str, Any]]:
        """Process TESS data validation results"""
        
        candidates = []
        try:
            # Extract planet information from TESS DV results
            if 'DV Data Header' in data:
                header = data['DV Data Header']
                
                candidate = {
                    'name': f"TIC {tic_id}.01",
                    'host_star': f"TIC {tic_id}",
                    'discovery_method': "Transit",
                    'tic_id': tic_id,
                    'radius_earth': header.get('PRADIUS'),
                    'orbital_period': header.get('PPERIOD'),
                    'transit_depth': header.get('PDEPTH'),
                    'confidence_score': 0.8,  # Default for TESS candidates
                    'status': "candidate"
                }
                
                candidates.append(candidate)
        
        except Exception as e:
            logger.error(f"Error processing TESS data: {e}")
        
        return candidates
    
    def _calculate_confidence_score(self, row: pd.Series) -> float:
        """Calculate confidence score based on available parameters"""
        
        score = 0.0
        max_score = 0.0
        
        # Radius measurement
        if pd.notna(row.get('pl_rade')):
            score += 0.2
        max_score += 0.2
        
        # Period measurement  
        if pd.notna(row.get('pl_orbper')):
            score += 0.2
        max_score += 0.2
        
        # Discovery method
        if pd.notna(row.get('discoverymethod')):
            method = str(row.get('discoverymethod')).lower()
            if 'transit' in method:
                score += 0.3
            elif 'radial' in method:
                score += 0.25
            else:
                score += 0.15
        max_score += 0.3
        
        # Stellar parameters
        if pd.notna(row.get('st_teff')) and pd.notna(row.get('st_rad')):
            score += 0.15
        max_score += 0.15
        
        # Recent discovery (higher confidence)
        if pd.notna(row.get('disc_year')):
            year = int(row.get('disc_year'))
            if year >= 2015:
                score += 0.15
            elif year >= 2010:
                score += 0.1
        max_score += 0.15
        
        return min(score / max_score if max_score > 0 else 0.5, 1.0)