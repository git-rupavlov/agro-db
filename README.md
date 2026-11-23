# Plant Traits Database

Structured, evidence-aware YAML records for plant species and cultivars.

## Stage-specific environmental requirements

Conditions are modeled by **phenological stage**, not just by a single lifetime minimum/maximum. Stages are event-triggered and can overlap on a single plant.

The cultivar points to a species-level environment profile and only adds **confirmed cultivar-specific overrides**. An empty override means unknown, not absence of a requirement.

For each stage the model supports air / substrate / root temperatures, PPFD and DLI, photoperiod and UV, RH/VPD/CO2/airflow, soil moisture and irrigation, EC/pH and nutrient concentration, transition markers and per-trait evidence.

Current source-backed tomato data: `species/solanum_lycopersicum/environment.yaml`. Some temperature references are boundary values rather than full optimum ranges; other parameters intentionally remain `null`.

## Files

- `templates/plant_template.yaml`: full reusable plant trait record template.
- `cultivars/tomato/bobcat_f1.yaml`: initial record for Bobcat F1 tomato.
- `species/solanum_lycopersicum/environment.yaml`: evidence-linked requirements by development phase.

## Design principles

- Record botanical and measurable traits rather than prescribing uses.
- Keep unknown values as `null` rather than inventing measurements.
- Preserve provenance and differences between cultivar claims and observations.
- Use consistent units and keys to support later validation and comparison in Python.

## Validate YAML

```bash
python -m pip install pyyaml
python - <<'PY'
import pathlib, yaml
for f in pathlib.Path('.').rglob('*.yaml'):
    with f.open(encoding='utf-8') as src:
        yaml.safe_load(src)
    print('OK', f)
PY
```

## Next steps

Add a JSON Schema for validation; separate species-level traits from cultivar overrides; create seasonal observation records.


## Makotsevo web application

A working static MVP is available in [`web/`](web/README.md): historical hourly climate, monthly climate table, export and developmental-stage temperature screening. Run locally with `python3 -m http.server 8000 -d web`. GitHub Pages deployment is not enabled automatically.
