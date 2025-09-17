import math
from datetime import datetime
from typing import Dict, Any


def extract_rule_engine_input(raw_db_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes raw database data into the specific input.json structure
    required by the rule engine.

    Args:
        raw_db_data (Dict[str, Any]): A dictionary containing raw fields
                                     fetched directly from the database tables
                                     or frontend.
    Returns:
        Dict[str, Any]: The formatted dictionary for the rule engine.
    """
    if not raw_db_data:
        return {}

    # -------------------------
    # 1. PT (Product Type)
    # -------------------------
    product_type_from_db = str(
        raw_db_data.get("PT")
    )
    print("Product Type from DB:", product_type_from_db)

    product_map = {
        "Health Insurance": 1,
        "Personal Accident Insurance": 2,
        "Critical Illness": 3,
        "Life Insurance": 4
    }
    
    pt = product_map[product_type_from_db]
    print("Mapped Product Type (PT):", pt)
    
    # -------------------------
    # Handle Health vs PA
    # -------------------------
    if pt == 1:
        return extract_health_data(raw_db_data, pt)
    elif pt == 2:
        return extract_pa_data(raw_db_data, pt)
    else:
        pass


# ============================================================
# HEALTH (PT = 1)
# ============================================================
def extract_health_data(raw_db_data: Dict[str, Any], pt: int) -> Dict[str, Any]:
    result = {}

    result["PT"] = pt
    result["PC"] = "Regular"

    # -------------------------
    # Age
    # -------------------------
    def safe_int(val, default=0):
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return default

    result["Age"] = safe_int(raw_db_data.get("Age") or raw_db_data.get("age"))

    # -------------------------
    # SA & Ded
    # -------------------------
    insured = raw_db_data.get("Insured") or raw_db_data.get("insured") or {}
    result["SA"] = safe_int(insured.get("SA"))
    result["Ded"] = safe_int(insured.get("Ded"))

    # -------------------------
    # BMI
    # -------------------------
    weight = insured.get("weight_kg")
    height_cm = insured.get("height_cm")
    try:
        if weight and height_cm and float(height_cm) > 0:
            bmi = float(weight) / ((float(height_cm) / 100) ** 2)
            result["BMI_gt_28"] = "yes" if bmi > 28 else "no"
        else:
            result["BMI_gt_28"] = "no"
    except (ValueError, TypeError, ZeroDivisionError):
        result["BMI_gt_28"] = "no"

    # -------------------------
    # Medical Conditions
    # -------------------------
    def to_yes_no(value):
        if isinstance(value, str):
            return "yes" if value.lower() == "yes" else "no"
        return "yes" if value else "no"

    result["Thyroid_Disorders"] = to_yes_no(raw_db_data.get("thyroid_disorders") or raw_db_data.get("Thyroid_Disorders"))
    result["Digestive_System_Disorders"] = to_yes_no(raw_db_data.get("digestive_system_disorders") or raw_db_data.get("Digestive_System_Disorders"))
    result["ENT_Disorders"] = to_yes_no(raw_db_data.get("ent_disorders") or raw_db_data.get("ENT_Disorders"))
    result["Cancer"] = to_yes_no(raw_db_data.get("cancer") or raw_db_data.get("Cancer"))
    result["Heart_Attack"] = to_yes_no(raw_db_data.get("heart_attack") or raw_db_data.get("Heart_Attack"))
    result["Chronic_Liver"] = to_yes_no(raw_db_data.get("chronic_liver") or raw_db_data.get("Chronic_Liver"))
    result["Kidney"] = to_yes_no(raw_db_data.get("kidney") or raw_db_data.get("Kidney"))
    result["Diabetes"] = to_yes_no(raw_db_data.get("diabetes") or raw_db_data.get("Diabetes"))
    # result["Tobacco"] = to_yes_no(raw_db_data.get("tobacco") or raw_db_data.get("Tobacco"))

    # -------------------------
    # OCC (Occupation Risk)
    # -------------------------
    occupation = str(
        raw_db_data.get("occupation") or raw_db_data.get("OCC") or ""
    ).lower()

    high_risk_jobs = [
        "driver", "construction", "mining", "firefighter", "police", "army", "navy", "air force",
        "railway", "shipyard", "fisherman", "electrician", "factory", "manual labor", "security"
    ]
    result["OCC"] = "High-Risk" if any(job in occupation for job in high_risk_jobs) else "Normal"

    # -------------------------
    # CLOC (City/Pincode)
    # -------------------------
    cloc = raw_db_data.get("CLOC") or {}
    pincode = str(
        raw_db_data.get("pincode") or cloc.get("pin_code") or ""
    )
    city = str(
        raw_db_data.get("city") or cloc.get("city") or ""
    ).lower()

    red_zone_pincodes = [
        "400001", "400002", "400003", "400004", "400005", "400006", "400007", "400008", "400009", "400010",
        "400011", "400012", "400013", "400014", "400015", "400016", "400017", "400018", "400019", "400020",
        "400021", "400022", "400023", "400024", "400025", "400026", "400027", "400028", "400029", "400030",
        "400031", "400032", "400033", "400034", "400035", "400036", "400037", "400038", "400039", "400040",
        "400041", "400042", "400043", "400044", "400045", "400046", "400047", "400048", "400049", "400050",
        "400051", "400052", "400053", "400054", "400055", "400056", "400057", "400058", "400059", "400060",
        "400061", "400062", "400063",  # Mumbai
        "110001", "110002", "110003", "110004", "110005",  # Delhi
    ]
    red_zone_cities = ["mumbai", "assam", "delhi","kolkata", "srinagar", "navi mumbai", "jammu & kashmir"]

    if pincode in red_zone_pincodes:
        result["CLOC"] = "Red"
    elif any(rc in city for rc in red_zone_cities):
        result["CLOC"] = "Red"
    else:
        result["CLOC"] = "Normal"

    print("Final Extracted Health Data:", result)
    return result


# ============================================================
# PERSONAL ACCIDENT (PT = 2)
# ============================================================
def extract_pa_data(raw_db_data: Dict[str, Any], pt: int) -> Dict[str, Any]:
    result = {}
    result["PT"] = pt

    # -------------------------
    # PFD (Personal/Family Disease risk)
    # -------------------------
    pfd_val = str(raw_db_data.get("PFD") or "").lower()
    if pfd_val in ["yes", "no"]:
        result["PFD"] = pfd_val
    else:
        result["PFD"] = "no"  # default if missing

    # -------------------------
    # OTH (Other/Previous Insurance)
    # -------------------------
    oth_val = str(raw_db_data.get("OTH") or raw_db_data.get("Oth") or "").lower()
    if oth_val in ["yes", "no"]:
        result["Oth"] = oth_val
    else:
        result["Oth"] = "no"

    # -------------------------
    # Age
    # -------------------------
    def safe_int(val, default=0):
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return default

    result["Age"] = safe_int(raw_db_data.get("Age") or raw_db_data.get("age"))

    # -------------------------
    # SA
    # -------------------------
    insured = raw_db_data.get("Insured") or raw_db_data.get("insured") or {}
    result["SA"] = safe_int(insured["SA"] or 0)

    # -------------------------
    # Annual Income
    # -------------------------
    result["Inc"] = safe_int(raw_db_data.get("annual_income") or raw_db_data.get("Inc") or 0)

    # -------------------------
    # Occupation Mapping
    # -------------------------
    occupation = str(
        raw_db_data.get("occupation") or raw_db_data.get("OCC") or ""
    ).lower()

    if any(word in occupation for word in ["cricket", "football", "athlete", "sports", "driver", 
        "construction", "mining", "firefighter", "police", "army", "navy", "air force", "kabaddi", "volleyball",
        "hockey", "badminton", "tennis", "boxing", "wrestling", "cycling", "swimming", "gymnastics", "koko",  "chess",
        "martial arts", "weightlifting", "archery", "skating", "javelin throw", "shot put", "high jump", "long jump", 
        "railway", "shipyard", "fisherman", "electrician", "factory", "manual labor", "security"]):
        result["Occ"] = "Sports"
    elif any(word in occupation for word in ["housewife", "homemaker"]):
        result["Occ"] = "Housewife"
    else:
        result["Occ"] = "Desk/Sedentary"

    print("Final Extracted PA Data:", result)
    return result
