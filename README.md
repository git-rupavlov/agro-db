# Plant Traits Database

Structured, evidence-aware YAML records for plant species and cultivars.

## Files

- `templates/plant_template.yaml`: full reusable plant trait record template.
- `cultivars/tomato/bobcat_f1.yaml`: initial record for Bobcat F1 tomato.

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
