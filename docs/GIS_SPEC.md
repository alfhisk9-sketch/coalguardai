# GIS_SPEC.md

## Approach
Plain `latitude`/`longitude` (`double precision`) columns on: `mines`, `inspections`, `inspection_observations`, `incidents`, `safety_observations`, `environmental_monitoring_points`, `worker_attendance`. No PostGIS extension enabled in the prototype — avoids extension/config risk on a demo timeline. Upgrade path (PostGIS + `geography` columns + spatial indexes) documented below but not built now.

## API Contract for Map Rendering
`GET /api/mines?includeLocations=true`, `GET /api/inspections?mineId=&hasLocation=true`, etc. — all location-bearing endpoints return `{ latitude, longitude }` alongside the entity; no separate "locations" endpoint needed for MVP. A convenience aggregate endpoint `GET /api/dashboard/map?mineId=` returns a merged feature list (mines, open incidents, recent inspections, risk zones if defined) for a single map render call.

## Risk Zones
`risk_zones` table (polygon as `jsonb` array of `{lat, lng}` points for MVP, not PostGIS `geometry`) — simple enough for Leaflet's `Polygon` component to consume directly without a GIS library on the client.

## Frontend Expectations (for Account 2)
- Use React-Leaflet + OpenStreetMap tiles (no API key required, no cost).
- Cluster markers client-side for mines with many inspections/incidents (e.g. `react-leaflet-cluster`) — not a backend concern.

## Future Upgrade Path (documented, not implemented)
If precise geofencing/spatial queries (e.g., "incidents within 500m of a risk zone") are needed post-prototype: enable PostGIS, migrate lat/lng columns to `geography(Point,4326)`, add GIST indexes, rewrite proximity queries using `ST_DWithin`.
