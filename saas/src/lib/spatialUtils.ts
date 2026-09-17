import { GeoJsonFeature } from "@/types/geospatial";

/**
 * Approximate spherical polygon area in hectares (ha)
 */
export function calculatePolygonAreaHa(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  
  const earthRadius = 6378137; // meters
  let area = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    
    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const lonDiff = ((p2[0] - p1[0]) * Math.PI) / 180;
    
    area += lonDiff * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * earthRadius * earthRadius) / 4.0;
  return Math.round((area / 10000.0) * 100) / 100; // Convert to Hectares
}

/**
 * Calculate [minX, minY, maxX, maxY] bounding box
 */
export function getGeoJsonBbox(feature: GeoJsonFeature): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const extractCoords = (coords: any): void => {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      minX = Math.min(minX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxX = Math.max(maxX, coords[0]);
      maxY = Math.max(maxY, coords[1]);
    } else if (Array.isArray(coords)) {
      coords.forEach(extractCoords);
    }
  };

  extractCoords(feature.geometry.coordinates);

  if (minX === Infinity) return [-46.438, -15.635, -46.415, -15.615]; // Fallback to Buritis
  return [minX, minY, maxX, maxY];
}

/**
 * Centroid calculation for camera targeting
 */
export function getCentroid(feature: GeoJsonFeature): [number, number] {
  const [minX, minY, maxX, maxY] = getGeoJsonBbox(feature);
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}
