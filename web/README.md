# AgroDB Web · Макоцево (MVP)

Static, browser-only web application for reviewing **historical hourly ERA5-Land reanalysis** and comparing a selected crop development stage against documented temperature references.

## Run locally

Open with a simple HTTP server:

```bash
python3 -m http.server 8000 -d web
```

Then visit `http://localhost:8000`.

Alternatively publish the `/web` directory through GitHub Pages using a GitHub Actions workflow or a deployment branch. **GitHub Pages is not configured by this commit.**

## Functions

- Editable coordinates (initially approximate location: 42.6916, 23.8108) and historical year.
- Retrieve hourly reanalysis from Open-Meteo archive API with `models=era5_land`.
- Hourly chart with min/max envelope downsampling and full-resolution CSV export.
- Monthly summaries: average, min, max, frost-hour and heat-hour counts, precipitation.
- Metrics for hourly temperatures, precipitation, incoming solar radiation.
- Tomato / Bobcat F1 stage selector; reference-stage temperature screening and transparent unknowns.
- No estimated yields, no simulated precise frost dates or fabricated site observations.

## Important limitations

1. ERA5-Land is reanalysis for grid cells of roughly 9–11 km, not a sensor on this parcel.
2. Actual frost pockets, shading, slope, soil texture, drainage, soil pH and soil moisture require on-site observations.
3. The model checks **temperature only** against selected stage thresholds. No validated multivariate suitability or phenology simulation exists yet.
4. The stage start month and duration are entered manually, and stages may overlap.
5. The currently included tomato reference boundaries are literature-level approximations. They are not confirmed cultivar-specific values for Bobcat F1.
6. API availability, policies and model update lag depend on Open-Meteo. Users should check Open-Meteo licensing for their use case.
7. No telemetry is uploaded to this repository; archive API calls go directly from the browser to Open-Meteo.
8. Data source attribution: [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api), [ERA5-Land](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land).

## Follow-on engineering milestones

- JSON Schema validation and parse species / cultivar YAML through a build step (no duplicate catalog in JavaScript).
- Historical climate normals (15–30 years) with percentile distributions, spring/fall frost risk and GDD.
- On-site sensors and station bias characterization.
- Plot map, sun exposure and DEM-based slope/aspect.
- Sowing/transplant timeline with phase overlaps and hourly threshold risk.
- Soil lab measurements, amendments and mulch trial datasets.
- Provenance for every numeric plant requirement and dataset version.

## Soil depth profiles

ERA5-Land hourly soil temperature (°C) and soil volumetric moisture (m³/m³) are loaded for 0–7 cm, 7–28 cm, 28–100 cm, and 100–255 cm. Each is a **model-layer average**, not a point thermometer at its midpoint. The UI provides variable selection, monthly depth comparison graphs, and all eight variables in CSV export. Soil water estimates do not replace on-site measurements, particularly for clay, irrigation and local drainage.
