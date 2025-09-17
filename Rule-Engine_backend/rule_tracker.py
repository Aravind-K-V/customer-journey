import yaml
from typing import Dict, Any

class RuleTracker:
    def __init__(self, mapping_file: str = 'input_mapping.yaml'):
        with open(mapping_file, 'r') as f:
            self.mappings = yaml.safe_load(f)

    def get_range_label(self, mapping: Dict, field_name: str, value: Any) -> str:
        """Convert numeric value to its range label using mapping."""
        try:
            numeric_value = float(value)
            field_mapping = mapping.get(field_name, {})
            for label, ranges in field_mapping.items():
                if not isinstance(ranges, list):
                    continue
                for r in (ranges if isinstance(ranges[0], list) else [ranges]):
                    if r[0] <= numeric_value <= r[1]:
                        return f"[{r[0]}, {r[1]}]"
        except (ValueError, TypeError):
            return str(value)
        return str(value)

    def extract_rule_info(self, raw_data: Dict, rule_result: Dict, converted_data: Dict) -> Dict:
        """Extract info: expected rules vs customer-provided values."""

        pt = converted_data.get("PT", 1)
        product_type = "Health Insurance" if pt == 1 else "Personal Accident"
        mapping = self.mappings["health_mapping"] if pt == 1 else self.mappings["pa_mapping"]

        # ---------------- Health ----------------
        if pt == 1:
            customer_data = {
                "Product Type": product_type,
                "Product Category": converted_data.get("PC", ""),
                "Age": raw_data.get("Age"),
                "Sum Insured": raw_data.get("SA"),
                "Deductible": raw_data.get("Ded"),
                "Occupation": raw_data.get("OCC"),
                "Location": raw_data.get("CLOC"),
                "PFD Conditions": "None"
            }

            expected_data = {
                "Product Type": product_type,
                "Product Category": converted_data.get("PC", ""),
                "Age": self.get_range_label(mapping, "Age", raw_data.get("Age")),
                "Sum Insured": self.get_range_label(mapping, "SA", raw_data.get("SA")),
                "Deductible": self.get_range_label(mapping, "Ded", raw_data.get("Ded")),
                "Occupation": raw_data.get("OCC"),
                "Location": raw_data.get("CLOC"),
                "PFD Conditions": "None"
            }

        # ---------------- PA ----------------
        else:
            customer_data = {
                "Product Type": product_type,
                "PFD": raw_data.get("PFD"),
                "Occupation": raw_data.get("Occ"),
                "Income": raw_data.get("Inc"),
                "Sum Insured": raw_data.get("SA"),
                "Age": raw_data.get("Age"),
                "Other": raw_data.get("Oth")
            }

            expected_data = {
                "Product Type": product_type,
                "PFD": raw_data.get("PFD"),
                "Occupation": raw_data.get("Occ"),
                "Income": self.get_range_label(mapping, "Inc", raw_data.get("Inc")),
                "Sum Insured": self.get_range_label(mapping, "SA", raw_data.get("SA")),
                "Age": self.get_range_label(mapping, "Age", raw_data.get("Age")),
                "Other": raw_data.get("Oth")
            }

        return {
            "expected_data": expected_data,
            "customer_data": customer_data,
            "mc_required": rule_result.get("mc_required", False),
            "finreview_required": rule_result.get("finreview_required", False),
            "televideoagent_required": rule_result.get("televideoagent_required", False)
        }
