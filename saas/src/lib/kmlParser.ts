import { kml } from "@tmcw/togeojson";
import { GeoJsonFeature } from "@/types/geospatial";

export async function parseKmlToGeoJson(kmlText: string): Promise<GeoJsonFeature | null> {
  try {
    let doc: Document;
    if (typeof window !== "undefined" && window.DOMParser) {
      const parser = new window.DOMParser();
      doc = parser.parseFromString(kmlText, "text/xml");
    } else {
      // Fallback or server-side DOM parser
      const { DOMParser } = await import("@xmldom/xmldom").catch(() => ({
        DOMParser: class {
          parseFromString(s: string) {
            throw new Error("No DOMParser available");
          }
        },
      }));
      doc = new DOMParser().parseFromString(kmlText, "text/xml") as unknown as Document;
    }

    const converted = kml(doc);
    if (!converted || !converted.features || converted.features.length === 0) {
      return null;
    }

    // Find the first polygon feature or merge polygons
    const polygonFeature = converted.features.find(
      (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
    );

    if (polygonFeature) {
      return {
        type: "Feature",
        properties: {
          name: polygonFeature.properties?.name || "Propriedade Importada (KML)",
          category: "parcel",
          ...polygonFeature.properties,
        },
        geometry: polygonFeature.geometry as any,
      };
    }

    return null;
  } catch (err) {
    console.error("Error parsing KML:", err);
    return null;
  }
}
