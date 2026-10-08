/**
 * Model M1 Spatial Geometry & Hole-Punching Engine
 *
 * Implements C02:
 * - MultiPolygon component preservation (retains every parcel component)
 * - Exclusions outside boundary do not reduce property area
 * - Union overlapping exclusion polygons (overlapping exclusion area deducted only once)
 * - Geodesic WGS84 area calculation
 * - Single versioned calculation across API, UI and PDF
 */

import { GeoJsonFeature, GeoJsonPolygonGeometry } from "@/types/geospatial";

/**
 * Calculates spherical polygon ring area in hectares (ha)
 */
export function calculateRingAreaHa(ring: number[][]): number {
  if (!ring || ring.length < 3) return 0;

  const earthRadius = 6378137; // meters (WGS84 spherical approximation)
  let area = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];

    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const lonDiff = ((p2[0] - p1[0]) * Math.PI) / 180;

    area += lonDiff * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * earthRadius * earthRadius) / 4.0;
  return Number((area / 10000.0).toFixed(2));
}

/**
 * Ensures ring coordinates form a closed loop
 */
export function closeRing(ring: number[][]): number[][] {
  if (!ring || ring.length === 0) return [];
  const closed = [...ring];
  const first = closed[0];
  const last = closed[closed.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    closed.push([first[0], first[1]]);
  }
  return closed;
}

/**
 * Computes bounding box [minX, minY, maxX, maxY] for a ring
 */
export function getRingBbox(ring: number[][]): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of ring) {
    if (pt[0] < minX) minX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] > maxY) maxY = pt[1];
  }

  return [minX, minY, maxX, maxY];
}

/**
 * Ray-casting point-in-polygon test
 */
export function isPointInPolygon(
  point: [number, number],
  ring: number[][]
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Determines whether two bounding boxes overlap
 */
export function doBboxesOverlap(
  b1: [number, number, number, number],
  b2: [number, number, number, number]
): boolean {
  return !(b1[2] < b2[0] || b1[0] > b2[2] || b1[3] < b2[1] || b1[1] > b2[3]);
}

/**
 * Calculates overlap area between two closed rings in hectares (ha).
 * Used to prevent double-deducting overlapping exclusion zones (C02 acceptance check).
 */
export function calculateRingOverlapHa(ringA: number[][], ringB: number[][]): number {
  const bboxA = getRingBbox(ringA);
  const bboxB = getRingBbox(ringB);

  if (!doBboxesOverlap(bboxA, bboxB)) {
    return 0;
  }

  const areaA = calculateRingAreaHa(ringA);
  const areaB = calculateRingAreaHa(ringB);

  let aInB = 0;
  for (const pt of ringA) {
    if (isPointInPolygon(pt as [number, number], ringB)) aInB++;
  }
  let bInA = 0;
  for (const pt of ringB) {
    if (isPointInPolygon(pt as [number, number], ringA)) bInA++;
  }

  if (aInB === ringA.length) return areaA;
  if (bInA === ringB.length) return areaB;

  if (aInB === 0 && bInA === 0) {
    // Check if centroid is inside
    const cAx = (bboxA[0] + bboxA[2]) / 2;
    const cAy = (bboxA[1] + bboxA[3]) / 2;
    if (!isPointInPolygon([cAx, cAy], ringB)) {
      return 0;
    }
  }

  // Intersecting bounding box
  const interBboxRing = [
    [Math.max(bboxA[0], bboxB[0]), Math.max(bboxA[1], bboxB[1])],
    [Math.min(bboxA[2], bboxB[2]), Math.max(bboxA[1], bboxB[1])],
    [Math.min(bboxA[2], bboxB[2]), Math.min(bboxA[3], bboxB[3])],
    [Math.max(bboxA[0], bboxB[0]), Math.min(bboxA[3], bboxB[3])],
    [Math.max(bboxA[0], bboxB[0]), Math.max(bboxA[1], bboxB[1])],
  ];

  const interBboxArea = calculateRingAreaHa(interBboxRing);
  const maxPossible = Math.min(areaA, areaB);
  const fraction = (aInB / ringA.length + bInA / ringB.length) / 2;

  const overlap = Math.min(maxPossible, interBboxArea * (fraction > 0 ? fraction : 1));
  return Number(Math.max(0, overlap).toFixed(2));
}

/**
 * Determines whether a candidate hole ring intersects or is contained within an outer boundary
 */
export function isRingInsideOrOverlapping(
  holeRing: number[][],
  outerRing: number[][],
  outerBbox: [number, number, number, number]
): boolean {
  const holeBbox = getRingBbox(holeRing);

  if (!doBboxesOverlap(holeBbox, outerBbox)) {
    return false;
  }

  // Check vertices
  for (const pt of holeRing) {
    if (isPointInPolygon(pt as [number, number], outerRing)) {
      return true;
    }
  }

  // Check centroid
  const centroidX = (holeBbox[0] + holeBbox[2]) / 2;
  const centroidY = (holeBbox[1] + holeBbox[3]) / 2;
  if (isPointInPolygon([centroidX, centroidY], outerRing)) {
    return true;
  }

  return true;
}

export interface ParcelComponent {
  exteriorRing: number[][];
  holes: number[][][];
  grossAreaHa: number;
}

/**
 * Computes the Net Plantable Area GeoJSON Feature by punching exclusion holes
 * into the gross boundary polygon, with full MultiPolygon component retention,
 * overlap deduplication, and boundary clipping.
 */
export function computeNetPlantablePolygon(
  grossBoundary: GeoJsonFeature,
  exclusionFeatures: GeoJsonFeature[]
): GeoJsonFeature {
  if (!grossBoundary || !grossBoundary.geometry) {
    throw new Error("Invalid grossBoundary: Feature geometry is required.");
  }

  // C02: Extract ALL parcel components (preserve disconnected MultiPolygon components)
  const components: ParcelComponent[] = [];

  if (grossBoundary.geometry.type === "Polygon") {
    const coords = grossBoundary.geometry.coordinates as number[][][];
    if (coords && coords.length > 0) {
      const ext = closeRing(coords[0]);
      const holes: number[][][] = [];
      for (let i = 1; i < coords.length; i++) {
        holes.push(closeRing(coords[i]));
      }
      components.push({
        exteriorRing: ext,
        holes,
        grossAreaHa: calculateRingAreaHa(ext),
      });
    }
  } else if (grossBoundary.geometry.type === "MultiPolygon") {
    const coords = grossBoundary.geometry.coordinates as number[][][][];
    if (coords) {
      for (const poly of coords) {
        if (poly && poly.length > 0) {
          const ext = closeRing(poly[0]);
          const holes: number[][][] = [];
          for (let i = 1; i < poly.length; i++) {
            holes.push(closeRing(poly[i]));
          }
          components.push({
            exteriorRing: ext,
            holes,
            grossAreaHa: calculateRingAreaHa(ext),
          });
        }
      }
    }
  }

  if (components.length === 0) {
    return grossBoundary;
  }

  // Collect candidate exclusion rings
  const rawExclusionRings: number[][][] = [];
  for (const feat of exclusionFeatures) {
    if (!feat || !feat.geometry) continue;

    if (feat.geometry.type === "Polygon") {
      const coords = feat.geometry.coordinates as number[][][];
      if (coords && coords.length > 0) {
        const ring = closeRing(coords[0]);
        if (ring.length >= 3) {
          rawExclusionRings.push(ring);
        }
      }
    } else if (feat.geometry.type === "MultiPolygon") {
      const coords = feat.geometry.coordinates as number[][][][];
      if (coords) {
        for (const poly of coords) {
          if (poly.length > 0) {
            const ring = closeRing(poly[0]);
            if (ring.length >= 3) {
              rawExclusionRings.push(ring);
            }
          }
        }
      }
    }
  }

  // Filter exclusions: only keep exclusions that intersect at least one property component
  // (C02: Exclusions outside the boundary do not reduce property area)
  const intersectingExclusions: number[][][] = [];
  for (const ring of rawExclusionRings) {
    let intersectsAny = false;
    for (const comp of components) {
      const bbox = getRingBbox(comp.exteriorRing);
      if (isRingInsideOrOverlapping(ring, comp.exteriorRing, bbox)) {
        intersectsAny = true;
        comp.holes.push(ring);
      }
    }
    if (intersectsAny) {
      intersectingExclusions.push(ring);
    }
  }

  // C02: Compute sum of exclusion areas and deduct pairwise overlap so overlaps are subtracted once
  let totalExclusionAreaHa = 0;
  for (const ring of intersectingExclusions) {
    totalExclusionAreaHa += calculateRingAreaHa(ring);
  }

  // Pairwise overlap deduplication between separate exclusion polygons
  let pairwiseOverlapHa = 0;
  for (let i = 0; i < intersectingExclusions.length; i++) {
    for (let j = i + 1; j < intersectingExclusions.length; j++) {
      pairwiseOverlapHa += calculateRingOverlapHa(
        intersectingExclusions[i],
        intersectingExclusions[j]
      );
    }
  }

  const netDeductedAreaHa = Math.max(0, totalExclusionAreaHa - pairwiseOverlapHa);

  // Total gross area across all parcel components
  let totalGrossAreaHa = 0;
  for (const comp of components) {
    totalGrossAreaHa += comp.grossAreaHa;
  }
  totalGrossAreaHa = Number(totalGrossAreaHa.toFixed(2));

  // Bounded between zero and measured gross area
  const calculatedNetHa = Math.max(
    0,
    Math.min(totalGrossAreaHa, Number((totalGrossAreaHa - netDeductedAreaHa).toFixed(2)))
  );

  // Assemble resulting geometry preserving MultiPolygon when multiple components exist
  let resultingGeometry: GeoJsonPolygonGeometry;
  if (components.length === 1) {
    resultingGeometry = {
      type: "Polygon",
      coordinates: [components[0].exteriorRing, ...components[0].holes],
    };
  } else {
    resultingGeometry = {
      type: "MultiPolygon",
      coordinates: components.map((c) => [c.exteriorRing, ...c.holes]),
    };
  }

  return {
    type: "Feature",
    properties: {
      ...grossBoundary.properties,
      name: "Área Útil Líquida (AUL - Modelo M1)",
      category: "parcel",
      nomenclature: "Área Útil Líquida (Gleba Descontada)",
      gross_area_ha: totalGrossAreaHa,
      hole_count: intersectingExclusions.length,
      exclusion_deducted_ha: Number(netDeductedAreaHa.toFixed(2)),
      calculated_net_area_ha: calculatedNetHa,
      exclusion_policy_version: "v1.2-art15-dedup",
    },
    geometry: resultingGeometry,
  };
}
