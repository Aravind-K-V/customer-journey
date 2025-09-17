import yaml
import logging
from py_rules.components import Condition, Result, Rule
from py_rules.engine import RuleEngine

def match_condition(input_val, rule_val):
    if input_val is None:
        return False
    if isinstance(rule_val, list):
        return input_val in rule_val
    else:
        return input_val == rule_val

def match_value_to_range(value, mapping):
    """
    Returns the category key if value falls into any range in mapping.
    Handles both single ranges [a, b] and disjoint ranges [[a, b], [c, d]].
    """
    for cat, rng in mapping.items():
        if isinstance(rng[0], list):  # Disjoint ranges
            for subrange in rng:
                if subrange[0] <= value <= subrange[1]:
                    return int(cat)
        elif isinstance(rng, list) and len(rng) == 2:
            if rng[0] <= value <= rng[1]:
                return int(cat)
    return None

# Initialize logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Set to DEBUG to capture detailed logs

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Create file handler
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.INFO)  # Logs of INFO level or above will be written to the file
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)

logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Extract keys used in rule conditions
def extract_keys_from_dict(cond_dict):
    keys = set()
    if isinstance(cond_dict, dict):
        if 'condition' in cond_dict:
            condition = cond_dict['condition']
            var = condition.get('variable')
            if var:
                keys.add(var)
        else:
            for k, v in cond_dict.items():
                if isinstance(v, (dict, list)):
                    keys.update(extract_keys_from_dict(v))
    elif isinstance(cond_dict, list):
        for item in cond_dict:
            keys.update(extract_keys_from_dict(item))
    return keys

def extract_condition_keys(condition):
    return extract_keys_from_dict(condition.to_dict())

# Parse YAML condition dict into Condition objects recursively
def parse_condition(condition_data):
    if isinstance(condition_data, dict):
        if 'or' in condition_data:
            conditions = [parse_condition(c) for c in condition_data['or']]
            combined = conditions[0]
            for cond in conditions[1:]:
                combined = combined | cond
            return combined
        else:
            conditions = []
            for key, value in condition_data.items():
                if isinstance(value, list):
                    conditions.append(Condition(key, 'in', value))
                else:
                    conditions.append(Condition(key, '==', value))
            combined = conditions[0]
            for cond in conditions[1:]:
                combined = combined & cond
            return combined
    else:
        raise ValueError("Unsupported condition format")

# Load rules from YAML file into categorized dict
def load_yaml_rules(file_path):
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
        rules = {'pfd_rules': [], 'stp_accept_rules': [], 'stp_reject_rules': [], 'non_stp_rules': [], 
                 'pa_stp_accept_rules': [], 'pa_stp_reject_rules': [], 'pa_non_stp_rules': []}

        for rule_data in data.get('pfd_rules', []):
            condition = parse_condition(rule_data['condition'])
            then_action = rule_data.get('then')
            if then_action and then_action.startswith("PFD"):
                pfd_value = int(then_action.split('=')[1].strip())
                rules['pfd_rules'].append(
                    Rule(rule_data.get('name', 'PFD Rule')).If(condition).Then(Result('PFD', 'int', pfd_value))
                )

        for rule_data in data.get('stp_accept_rules', []):
            condition = parse_condition(rule_data['condition'])
            rules['stp_accept_rules'].append(
                Rule(rule_data.get('name', 'STP Accept Rule')).If(condition).Then(Result('status', 'str', 'STP-Accept'))
            )
            
        for rule_data in data.get('stp_reject_rules', []):
            condition = parse_condition(rule_data['condition'])
            rules['stp_reject_rules'].append(
                Rule(rule_data.get('name', 'STP Reject Rule')).If(condition).Then(Result('status', 'str', 'STP-Reject'))
            )

        for rule_data in data.get('non_stp_rules', []):
            condition = parse_condition(rule_data['condition'])
            rule = Rule(rule_data.get('name', 'Non-STP Rule')).If(condition).Then(Result('status', 'str', 'Non-STP'))
            if 'status_flag' in rule_data:
                setattr(rule, 'status_flag', rule_data['status_flag'])
            rules['non_stp_rules'].append(rule)
            
        for rule_data in data.get('pa_stp_accept_rules', []):
            if 'condition' not in rule_data:
                logger.error(f"Rule missing 'condition': {rule_data}")
                continue  # or raise an error
            condition = parse_condition(rule_data['condition'])
            rules['pa_stp_accept_rules'].append(
                Rule(rule_data.get('name', 'PA STP Accept Rule')).If(condition).Then(Result('status', 'str', rule_data['result']))
            )
        for rule_data in data.get('pa_stp_reject_rules', []):
            condition = parse_condition(rule_data['condition'])
            rules['pa_stp_reject_rules'].append(
                Rule(rule_data.get('name', 'PA STP Reject Rule')).If(condition).Then(Result('status', 'str', rule_data['result']))
            )
            
        for rule_data in data.get('pa_non_stp_rules', []):
            condition = parse_condition(rule_data['condition'])
            rule = Rule(rule_data.get('name', 'PA Non-STP Rule')).If(condition).Then(Result('status', 'str', rule_data['result']))
            if 'status_flag' in rule_data:
                setattr(rule, 'status_flag', rule_data['status_flag'])
            rules['pa_non_stp_rules'].append(rule)
        return rules

# Convert input values using mapping.yaml
def map_value(value, mapping):
    if value is None:
        raise ValueError("Input value cannot be None")  # Strict: raise error if None
    if isinstance(mapping, dict) and all(isinstance(v, list) for v in mapping.values()):
        for mapped_val, (low, high) in mapping.items():
            if low <= value <= high:
                return int(mapped_val)
        return None
    else:
        return mapping.get(value, None)
def expand_mapping(mapping):
    expanded = {}
    for k, v in mapping.items():
        for part in k.split('/'):
            expanded[part.strip().lower()] = v
    return expanded

def convert_input(input_data, mapping):
    converted = {}
    # PC categorical mapping
    for key in ['PC', 'OCC', 'CLOC']:
        if key not in input_data:
            raise KeyError(f"Missing required input field: {key}")
        map_dict = {k.lower(): v for k, v in mapping[key].items()}
        input_val = input_data[key].strip().lower()
        converted[key] = map_dict.get(input_val, None)
    # Age, SA, Ded numeric range mapping
    for key in ['Age', 'SA', 'Ded']:
        if key not in input_data:
            raise KeyError(f"Missing required input field: {key}")
        if key not in mapping:
            raise KeyError(f"Missing mapping for key: {key}")
        converted[key] = map_value(input_data[key], mapping[key])
    health_keys = ['BMI_gt_28', 'Thyroid_Disorders', 'Digestive_System_Disorders',
                   'ENT_Disorders', 'Diabetes', 'Cancer', 'Heart_Attack',
                   'Chronic_Liver', 'Kidney', 'Tobacco']
    for key in health_keys:
        converted[key] = input_data.get(key, 'no').lower()
    return converted
        
def convert_pa_input(input_data, mapping):
    # Normalize mapping keys and value keys for safety
    def normalize(s):
        return s.strip().title() if isinstance(s, str) else s

    # Normalize mapping keys and mapping value keys
    mapping_norm = {}
    for k, v in mapping.items():
        if isinstance(v, dict):
            # Normalize value keys too
            mapping_norm[normalize(k)] = {normalize(kk): vv for kk, vv in v.items()}
        else:
            mapping_norm[normalize(k)] = v

    converted = {}

    print("Input keys:", list(input_data.keys()))
    print("Mapping keys:", list(mapping_norm.keys()))

    for key, value in input_data.items():
        key_norm = normalize(key)
        print(f"Processing key: '{key}' (normalized: '{key_norm}') value: '{value}'")

        if key_norm in mapping_norm:
            print(f"  '{key_norm}' IS in mapping")
            map_val = mapping_norm[key_norm]

            # For value-to-code mapping (like Oth, Pfd, Occ)
            if isinstance(map_val, dict) and not any(isinstance(v, list) for v in map_val.values()):
                value_norm = normalize(value)
                mapped = map_val.get(value_norm, value)
                print(f"    Converting value: '{value}' (normalized: '{value_norm}') -> {mapped}")
                converted[key] = mapped

            # For range mapping (like Inc, Sa, Age)
            elif isinstance(map_val, dict):
                mapped = None
                if isinstance(value, (int, float)):
                    mapped = match_value_to_range(value, map_val)
                if mapped is not None:
                    print(f"    Value {value} mapped to category {mapped}")
                    converted[key] = mapped
                else:
                    print(f"    Value {value} did not match any range for '{key_norm}'")
                    converted[key] = None
            else:
                converted[key] = value
        else:
            print(f"  '{key_norm}' is NOT in mapping, copying as is")
            converted[key] = value

    print("Converted PA input:", converted)
    return converted


# Preprocess count_yes_conditions and set PFD=3 if critical conditions exist
def preprocess_pfd(facts):
    critical_conditions = ['Cancer', 'Heart_Attack', 'Chronic_Liver', 'Kidney', 'Tobacco']
    other_conditions = ['BMI_gt_28', 'Thyroid_Disorders', 'Digestive_System_Disorders',
                        'ENT_Disorders','Diabetes']

    if any(facts.get(cond, 'no') == 'yes' for cond in critical_conditions):
        facts['PFD'] = 3
    else:
        count = sum(facts.get(cond, 'no') == 'yes' for cond in other_conditions)
        facts['count_yes_conditions'] = count
    return facts

# Apply rules and update facts accordingly, with match/no-match logging
def apply_rules(rules, facts, rule_set_name=''):
    status_flags = {"MERT": "No", "MERV": "No", "MC": "No"}
    inferred_facts = facts.copy()
    matched_any_rule = False
    for rule in rules:
        required_keys = extract_condition_keys(rule.if_action)
        # Check for missing or None values
        missing_or_none = [k for k in required_keys if k not in inferred_facts or inferred_facts[k] is None]
        if missing_or_none:
            print(f"[{rule_set_name}] Skipping rule '{getattr(rule, 'name', '')}' due to missing/None keys: {missing_or_none}")
            continue

        facts_for_rule = {k: inferred_facts[k] for k in required_keys}
        print(f"Evaluating rule: {getattr(rule, 'name', str(rule))}")
        print("With facts:", facts_for_rule)
        print("Converted facts_for_rule:", facts_for_rule)
        engine = RuleEngine(facts_for_rule)

        try:
            if engine.evaluate(rule):
                matched_any_rule = True
                then_action = getattr(rule, 'then_action', None)
                if then_action is not None:
                    if then_action.key == 'PFD':
                        inferred_facts['PFD'] = then_action.value
                        print(f"PFD value set to {then_action.value} by rule: {rule.name}")
                        logger.info(f"PFD value set to {then_action.value} by rule: {rule.name}")
                    elif then_action.key == 'status':
                        inferred_facts['status'] = then_action.value
                        print(f"Status set to {then_action.value} by rule: {rule.name}")
                        logger.info(f"Status set to {then_action.value} by rule: {rule.name}")
                        if inferred_facts['status'] == 'Non-STP':
                            flag = getattr(rule, 'status_flag', None)
                            if isinstance(flag, list):
                                status_flags = {k: "Yes" if k in flag else "No" for k in status_flags}
                            else:
                                status_flags = {k: "Yes" if k == flag else "No" for k in status_flags}
                        else:
                            status_flags = {k: "No" for k in status_flags}
                        return inferred_facts, status_flags
        except Exception as e:
            print(f"[{rule_set_name}] Error evaluating rule '{getattr(rule, 'name', '')}': {e}")
            logger.error(f"Error evaluating rule '{getattr(rule, 'name', '')}': {e}")

    if not matched_any_rule:
        print(f"No rules matched the input facts in {rule_set_name}.")
        logger.info(f"No rules matched the input facts in {rule_set_name}.")
    return inferred_facts, status_flags

def apply_pa_rules(rules, facts, rule_set_name=''):
    status_flags = {"FIN": "No", "MERT": "No", "MC": "No"}
    inferred_facts = facts.copy()
    matched_any_rule = False
    for rule in rules:
        required_keys = extract_condition_keys(rule.if_action)
        # Check for missing or None values
        missing_or_none = [k for k in required_keys if k not in inferred_facts or inferred_facts[k] is None]
        if missing_or_none:
            print(f"[{rule_set_name}] Skipping rule '{getattr(rule, 'name', '')}' due to missing/None keys: {missing_or_none}")
            continue

        facts_for_rule = {k: inferred_facts[k] for k in required_keys}
        print(f"Evaluating rule: {getattr(rule, 'name', str(rule))}")
        print("With facts:", facts_for_rule)
        print("Converted facts_for_rule:", facts_for_rule)
        engine = RuleEngine(facts_for_rule)

        try:
            if engine.evaluate(rule):
                matched_any_rule = True
                then_action = getattr(rule, 'then_action', None)
                if then_action is not None:
                    if then_action.key == 'status':
                        inferred_facts['status'] = then_action.value
                        print(f"Status set to {then_action.value} by rule: {rule.name}")
                        logger.info(f"Status set to {then_action.value} by rule: {rule.name}")
                        if inferred_facts['status'] == 'Non-STP':
                            flag = getattr(rule, 'status_flag', None)
                            if isinstance(flag, list):
                                status_flags = {k: "Yes" if k in flag else "No" for k in status_flags}
                            else:
                                status_flags = {k: "Yes" if k == flag else "No" for k in status_flags}
                        else:
                            status_flags = {k: "No" for k in status_flags}
                        return inferred_facts, status_flags
        except Exception as e:
            print(f"[{rule_set_name}] Error evaluating rule '{getattr(rule, 'name', '')}': {e}")
            logger.error(f"Error evaluating rule '{getattr(rule, 'name', '')}': {e}")

    if not matched_any_rule:
        print(f"No PA rules matched the input facts in {rule_set_name}.")
        logger.info(f"No PA rules matched the input facts in {rule_set_name}.")
    return inferred_facts, status_flags


# Main forward chaining logic: PFD rules first, then STP, then Non-STP
def forward_chaining_health(rules, facts):
    
    # PFD rules
    logger.debug("Starting forward chaining with PFD rules.")
    facts, status_flags = apply_rules(rules['pfd_rules'], facts, rule_set_name='PFD rules')
    
    #1. STP rules
    logger.debug("Starting STP-Accept rules evaluation.")
    facts, status_flags = apply_rules(rules['stp_accept_rules'], facts, rule_set_name='STP-Accept rules')
    if 'status' in facts:
        logger.debug("Status found in facts, terminating forward chaining.")
        return facts, status_flags
    
    #2. STP-Reject rules
    logger.debug("Starting STP-Reject rules evaluation.")
    facts, status_flags = apply_rules(rules['stp_reject_rules'], facts, rule_set_name='STP-Reject rules')
    if 'status' in facts:
        logger.debug("Status found in facts, terminating forward chaining.")
        return facts, status_flags
    
    # 3. Non-STP rules
    logger.debug("Starting Non-STP rules evaluation.")
    facts, status_flags = apply_rules(rules['non_stp_rules'], facts, rule_set_name='Non-STP rules')
    if 'status' in facts:
        logger.debug("Status found in facts, terminating forward chaining.")
        return facts, status_flags
    facts['status'] = 'No rules matched the input facts in PA rules.'
    return facts, status_flags
    
def forward_chaining_pa(rules, facts):    
    
    # 1. STP
    logger.debug("Starting PA STP rules evaluation.")
    facts, status_flags = apply_pa_rules(rules['pa_stp_accept_rules'], facts, rule_set_name='PA STP Accept rules')
    if 'status' in facts:
        logger.debug("Status found in facts, terminating forward chaining.")
        return facts, status_flags
    
    # 2. STP-Reject
    logger.debug("Starting PA STP-Reject rules evaluation.")
    facts, status_flags = apply_pa_rules(rules['pa_stp_reject_rules'], facts, rule_set_name='PA STP Reject rules')
    if 'status' in facts:
        logger.debug("Status found in facts, terminating forward chaining.")
        return facts, status_flags

    # 3. NSTP
    logger.debug("Starting PA Non-STP rules evaluation.")
    facts, status_flags = apply_pa_rules(rules['pa_non_stp_rules'], facts, rule_set_name='PA Non-STP rules')
    if 'status' in facts:
        logger.debug("Status found in facts, terminating forward chaining.")
        return facts, status_flags
    
    facts['status'] = 'No rules matched the input facts in final status evaluation.'
    logger.info("Inference: No rules matched in final status evaluation.")
    return facts, status_flags

def print_converted_facts(facts):
    keys_to_show = ['PC', 'PFD', 'Age', 'SA', 'Ded', 'OCC', 'CLOC']
    filtered_facts = {k: facts.get(k) for k in keys_to_show}
    print(f"Converted input facts: {filtered_facts}")

def validate_input(input_data, required_keys):
    missing_keys = [key for key in required_keys if key not in input_data]
    if missing_keys:
        return f"Missing required input fields: {', '.join(missing_keys)}"
        # raise KeyError(f"Missing required input fields: {', '.join(missing_keys)}")
    none_keys = [key for key in required_keys if input_data[key] is None]
    if none_keys:
        return f"Input fields cannot be null: {', '.join(none_keys)}"
        # raise ValueError(f"Input fields cannot be null: {', '.join(none_keys)}")
    return "pass"

def flatten_condition_dict(cond):
    """
    Recursively flattens a py_rules condition dict to a simple {variable: value} dict.
    Only supports 'and' of simple equality/in conditions.
    """
    flat = {}

    if 'and' in cond:
        for sub in cond['and']:
            flat.update(flatten_condition_dict(sub))
    elif 'condition' in cond:
        c = cond['condition']
        var = c['variable']
        op = c['operator']
        val = c['value']
        # Extract value for '==' or 'in'
        if op == '==':
            flat[var] = val['value']
        elif op == 'in':
            # For 'in', value is a list of {'type':..., 'value':...}
            flat[var] = [v['value'] for v in val['value']]
    return flat

def get_rule_condition_dict(rule):
    cond_obj = getattr(rule, 'if_action', None)
    if cond_obj and hasattr(cond_obj, 'to_dict'):
        cond_dict = cond_obj.to_dict()
        flat = flatten_condition_dict(cond_dict)
        return flat
    return {}

def count_matches(rule, input_facts):
    cond = get_rule_condition_dict(rule)
    matches = 0
    mismatches = []
    for k, v in cond.items():
        input_val = input_facts.get(k)
        if isinstance(v, list):
            if input_val in v:
                matches += 1
            else:
                mismatches.append((k, input_val, v))
        else:
            if input_val == v:
                matches += 1
            else:
                mismatches.append((k, input_val, v))
    return matches, mismatches

def find_closest_rules(rules, input_facts):
    best = []
    max_matches = 0
    for rule in rules:
        matches, mismatches = count_matches(rule, input_facts)
        if matches > max_matches:
            best = [(rule, matches, mismatches)]
            max_matches = matches
        elif matches == max_matches and matches > 0:
            best.append((rule, matches, mismatches))
    return best, max_matches

def build_result(rule_type, status_flag=None, pt=1):
    if rule_type == "STP-Accept":
        return {"status": "STP-Accept"}
    elif rule_type == "STP-Reject":
        return {"status": "STP-Reject"}
    elif rule_type =="Non-STP Accept":
        return {"status": "Non-STP Accept"}
    else:
        if pt == 1:
            result = {
                "status": "Non-STP",
                "MERT": "No",
                "MERV": "No",
                "MC": "No"
            }
        else:
            result = {
                "status": "Non-STP",
                "FIN": "No",
                "MERT": "No",
                "MC": "No"
            }
        if status_flag:
            if isinstance(status_flag, list):
                for flag in status_flag:
                    if flag in result:
                        result[flag] = "Yes"
            elif status_flag in result:
                result[status_flag] = "Yes"
        return result

def main(input_data):
    pt = input_data.get('PT', 1)  # Default to 1 if not provided
    rules = load_yaml_rules('conditions.yaml')
    with open('input_mapping.yaml') as f:
        mapping_data = yaml.safe_load(f)
    if pt == 1:
        # Existing Health logic
        required_keys = ['PC', 'Age', 'SA', 'Ded', 'OCC', 'CLOC']  
        mapping = mapping_data['health_mapping']      
        check_input_validate = validate_input(input_data, required_keys)
        if check_input_validate != "pass":
                result = {"status": check_input_validate}
                logger.error(f"Input validation failed: {check_input_validate}")
                return result
        converted_input = convert_input(input_data, mapping)
        logger.info(f"Converted input (categorical to numerical): {converted_input}")
        converted_input = preprocess_pfd(converted_input)
        converted_input, status_flags = apply_rules(rules['pfd_rules'], converted_input, rule_set_name='PFD rules')
        logger.info(f"Numerical fields for inference: {converted_input}")
        
        final_facts, flags = forward_chaining_health(rules, converted_input)

        # 1. Exact STP match
        if final_facts.get('status') == 'STP-Accept':
            logger.info("Inference: Exact STP match found.")
            return build_result("STP-Accept")
        
        # 2. Exact STP-Reject match
        if final_facts.get('status') == 'STP-Reject':
            logger.info("Inference: Exact STP-Reject match found.")
            return build_result("STP-Reject")
        
        #3. Exact Non-STP Accept match
        if final_facts.get('status') == 'Non-STP Accept':
            logger.info("Inference: Exact Non-STP Accept match found.")
            return build_result("Non-STP Accept")
            
        # 4. Exact Non-STP match
        if final_facts.get('status') == 'Non-STP':
            # Determine which flag is "Yes" from your flags dict
            status_flag = None
            for flag in ['MERT', 'MERV', 'MC']:
                if flags.get(flag) == "Yes":
                    status_flag = flag
                    break
            logger.info("Inference: Exact Non-STP match found.")
            return build_result("Non-STP", status_flag)

        # 3. No exact match: Try closest match
        if final_facts.get('status', '').startswith('No rules matched'):
            stp_accept_closest, stp_accept_max = find_closest_rules(rules['stp_accept_rules'], converted_input)
            non_stp_closest, non_stp_max = find_closest_rules(rules['non_stp_rules'], converted_input)

            if stp_accept_max > non_stp_max:
                closest = stp_accept_closest
            elif non_stp_max > stp_accept_max:
                closest = non_stp_closest
            else:
                closest = stp_accept_closest + non_stp_closest

            if closest:
                rule, match_count, mismatches = closest[0]
                mismatches_str = ", ".join([f"{k}: input={v1}, rule expects={v2}" for k, v1, v2 in mismatches])
                rule_name = getattr(rule, 'name', getattr(rule, 'result', 'UNKNOWN'))
                rule_type = getattr(rule, 'then_action', None)
                rule_type = rule_type.value if rule_type else "UNKNOWN"
                status_flag = getattr(rule, 'status_flag', None)
                
                # Print the detailed closest-match info for your proof
                debug_result = {
                    "status": "No exact match found.",
                    "closest_rule_type": rule_type,
                    "closest_rule_name": rule_name,
                    "matched_fields": match_count,
                    "total_fields": len(get_rule_condition_dict(rule)),
                    "mismatched_fields": mismatches_str
                }
                print("Closest match details for proof:", debug_result)
                return build_result(rule_type, status_flag)
            else:
                logger.info("Inference: No close match found in rules.")
                return {"status": "No close match found in rules."}

        # 4. Fallback (should not reach here)
        return {"status": "Unknown error"}
    elif pt == 2:
        # PA logic
        required_keys = ['PFD', 'Occ', 'Inc', 'SA', 'Age','Oth']
        mapping = mapping_data['pa_mapping']
        check_input_validate = validate_input(input_data, required_keys)
        if check_input_validate != "pass":
            result = {"status": check_input_validate}
            logger.error(f"PA Input validation failed: {check_input_validate}")
            return result
        print("Before conversion:", input_data)
        converted_input = convert_pa_input(input_data, mapping)
        print("After conversion:", converted_input)
        logger.info(f"Converted PA input: {converted_input}")

        # Apply PA rules
        final_facts, flags = forward_chaining_pa(rules, converted_input)

        # 1. Exact STP match
        if final_facts.get('status') == 'STP-Accept':
            logger.info("Inference: Exact STP match found.")
            return build_result("STP-Accept")
        
        
        # 3. Exact STP-Reject match
        if final_facts.get('status') == 'STP-Reject':
            logger.info("Inference: Exact STP-Reject match found.")
            return build_result("STP-Reject")
        
        # 2. Exact Non-STP Accept match
        if final_facts.get('status') == 'Non-STP Accept':
            logger.info("Inference: Exact Non-STP Accept match found.")
            return build_result("Non-STP Accept")

        # 4. Exact NSTP match
        if final_facts.get('status') == 'Non-STP':
            status_flag = [flag for flag in ['FIN', 'MERT', 'MC'] if flags.get(flag) == "Yes"]
            logger.info("Inference: Exact Non-STP match found.")
            return build_result("Non-STP", status_flag, pt=pt)

        # 4. No exact match: Try closest match
        if final_facts.get('status', '').startswith('No rules matched'):
            stp_accept_closest, stp_accept_max = find_closest_rules(rules['pa_stp_accept_rules'], converted_input)
            stp_reject_closest, stp_reject_max = find_closest_rules(rules['pa_stp_reject_rules'], converted_input)
            non_stp_closest, non_stp_max = find_closest_rules(rules['pa_non_stp_rules'], converted_input)
            if stp_accept_max > stp_reject_max and stp_accept_max > non_stp_max:
                closest = stp_accept_closest
            elif stp_reject_max > stp_accept_max and stp_reject_max > non_stp_max:
                closest = stp_reject_closest
            else:
                closest = non_stp_closest
            if closest:
                rule, match_count, mismatches = closest[0]
                mismatches_str = ", ".join([f"{k}: input={v1}, rule expects={v2}" for k, v1, v2 in mismatches])
                rule_name = getattr(rule, 'name', getattr(rule, 'result', 'UNKNOWN'))
                rule_type = getattr(rule, 'then_action', None)
                rule_type = rule_type.value if rule_type else "UNKNOWN"
                status_flag = getattr(rule, 'status_flag', None)
                debug_result = {
                    "status": "No exact match found.",
                    "closest_rule_type": rule_type,
                    "closest_rule_name": rule_name,
                    "matched_fields": match_count,
                    "total_fields": len(get_rule_condition_dict(rule)),
                    "mismatched_fields": mismatches_str
                }
                print("Closest match details for proof (PA):", debug_result)
                return build_result(rule_type, status_flag, pt=pt)
            else:
                logger.info("Inference: No close match found in PA rules.")
                return {"status": "No close match found in PA rules."}

        # 5. Fallback
        return {"status": "Unknown error"}