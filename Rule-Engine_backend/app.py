# from fastapi import FastAPI, UploadFile, File, HTTPException, Request
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from detect_proposal_form import predict_proposal_form  # Your custom function
# from typing import Optional
# from my_rule_engine import main
# from extractor import extract_rule_engine_input  # Your custom extractor
# from config import CORS_ORIGINS
# from rule_tracker import RuleTracker  # Import your RuleTracker class
# import logging
# import json
# import os
# import shutil
# import uvicorn
# import requests

# logger = logging.getLogger("rule_engine")


# app = FastAPI()

# # @app.on_event("startup")
# # async def startup():
# #     await database.connect()

# # @app.on_event("shutdown")
# # async def shutdown():
# #     await database.disconnect()


# # CORS for frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# UPLOAD_FOLDER = './uploads'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# # Upload file endpoint
# @app.post("/upload")
# async def upload_file(file: UploadFile = File(...)):
#     try:
#         if not file:
#             raise HTTPException(status_code=400, detail="No file uploaded")
#         file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
#     return {
#         "filename": file.filename}

# # Request model for filename
# class FileNameRequest(BaseModel):
#     filename: str

# # Detect proposal endpoint
# @app.post("/detectproposalform")
# async def detect_proposal(req: FileNameRequest):
#     file_path = os.path.join(UPLOAD_FOLDER, req.filename)
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="File not found")
#     print("Filepath received:", file_path)
#     print("File exists:", os.path.exists(file_path)) 
#     result = predict_proposal_form(file_path)
#     print("Backend result before return:", result)  
#     return {"isProposalForm": bool(result)}

# @app.post("/rule_engine")
# async def trigger_main(request: Request):
#     try:
#         print("Step 1: Reading input.json")
#         body = await request.json()
#         print("Request body:", body)
        
#         with open("input.json", "r") as file:
#             input_data = json.load(file)
            
#         # ✅ NEW: Read the RAW extracted data for RuleTracker
#         with open("raw_extracted_data.json", "r") as file:
#             raw_extracted_data = json.load(file)
        
#         print("Converted data:", input_data)
#         print("Raw extracted data:", raw_extracted_data)
        
#         # Initialize tracker
#         tracker = RuleTracker()

#         result = main(input_data)
#         print("Rule Engine Result:", result)
        
#         # Extract additional information for database
#         rule_info = tracker.extract_rule_info(raw_extracted_data, result, input_data)

#         statuses = []
#         all_flags = set()

#         # ✅ Case 1: Result is a dict (your current scenario)
#         if isinstance(result, dict):
#             if "status" in result:
#                 statuses.append(result["status"])
#             # Check flags from keys like FIN, MERT, MC
#             if result.get("FIN") == "Yes":
#                 all_flags.add("FIN")
#             if result.get("MERT") == "Yes":
#                 all_flags.add("MERT")
#             if result.get("MC") == "Yes":
#                 all_flags.add("MC")

#         # ✅ Case 2: Result is a list of dicts
#         elif isinstance(result, list):
#             for res in result:
#                 if "result" in res:
#                     statuses.append(res["result"])
#                 if "status_flag" in res:
#                     all_flags.update(res["status_flag"])

#         # ✅ Determine booleans
#         mc_required = "MC" in all_flags
#         televideoagent_required = "MERT" in all_flags
#         finreview_required = "FIN" in all_flags

#         payload = {
#             "request_id": body["request_id"],
#             "proposal_number": body["proposalNumber"],
#             "statuses": statuses,
#             "mc_required": mc_required,
#             "televideoagent_required": televideoagent_required,
#             "finreview_required": finreview_required,
#             "original_input": rule_info['original_input'],
#             "expected_data": rule_info['expected_data_human_readable']
#         }

#         print("Payload to Node.js:", payload)

#         try:
#             response = requests.post(
#                 "http://13.232.45.218:8000/api/ruleEngineRoutes/save-rule-engine-result",
#                 json=payload
#             )
#             print(f"✅ Sent to Node.js API, Response: {response.status_code}")
#         except Exception as e:
#             print("⚠️ Node.js API call failed:", e)

#         return payload

#     except Exception as e:
#         logger.error(f"Error in rule engine: {e}")
#         return {"error": str(e)}
    
# from fastapi import FastAPI, Request
# from typing import Dict, Any

# # ✅ New API to call it directly
# @app.post("/convert_to_structure")
# async def convert_to_structure(request: Request):
#     print("Received request to convert raw data to rule engine structure148")
#     body = await request.json()
#     print("Request body:150", body)
    
#     if "extractedData" in body:
#         raw_db_data = body["extractedData"]
#     elif "data" in body:
#         raw_db_data = body["data"]
#     else:
#         raw_db_data = body
        
#     print("Raw DB Data:", raw_db_data)
#     if not raw_db_data:
#         return {"error": "No data provided"}

#     extract_data = extract_rule_engine_input(raw_db_data)
#     print("Extracted Data:", extract_data)
    
#     raw_output_file = "raw_extracted_data.json"
#     with open(raw_output_file, "w") as f:
#         json.dump(extract_data, f, indent=2)
#     print(f"Raw data saved to {raw_output_file}")
    
#     output_file_path = "input.json"
#     with open(output_file_path, "w") as f:
#         json.dump(extract_data, f, indent=2)
#     print(f"Data saved to {output_file_path}")
#     return extract_data

    
#     # Add this at the bottom of your file
# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=5050)

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from detect_proposal_form import predict_proposal_form  # Your custom function
from typing import Optional
from my_rule_engine import main
from extractor import extract_rule_engine_input  # Your custom extractor
from config import CORS_ORIGINS
from rule_tracker import RuleTracker  # Import your RuleTracker class
import logging
import json
import os
import shutil
import uvicorn
import requests

logger = logging.getLogger("rule_engine")


app = FastAPI()

# @app.on_event("startup")
# async def startup():
#     await database.connect()

# @app.on_event("shutdown")
# async def shutdown():
#     await database.disconnect()


# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://13.232.45.218:5174"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Upload file endpoint
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    return {
        "filename": file.filename}

# Request model for filename
class FileNameRequest(BaseModel):
    filename: str

# Detect proposal endpoint
@app.post("/detectproposalform")
async def detect_proposal(req: FileNameRequest):
    file_path = os.path.join(UPLOAD_FOLDER, req.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    print("Filepath received:", file_path)
    print("File exists:", os.path.exists(file_path)) 
    result = predict_proposal_form(file_path)
    print("Backend result before return:", result)  
    return {"isProposalForm": bool(result)}

@app.post("/rule_engine")
async def trigger_main(request: Request):
    try:
        print("Step 1: Reading input.json")
        body = await request.json()
        print("Request body:", body)
        
        with open("input.json", "r") as file:
            input_data = json.load(file)
            
        # ✅ NEW: Read the RAW extracted data for RuleTracker
        with open("raw_extracted_data.json", "r") as file:
            raw_extracted_data = json.load(file)
        
        print("Converted data(input.json):", input_data)
        print("Raw extracted data(raw_extracted_data.json):", raw_extracted_data)
        
        # Initialize tracker
        tracker = RuleTracker()

        result = main(input_data)
        print("Rule Engine Result:", result)
        
        # Extract additional information for database
        rule_info = tracker.extract_rule_info(raw_extracted_data, result, input_data)

        statuses = []
        all_flags = set()

        # ✅ Case 1: Result is a dict (your current scenario)
        if isinstance(result, dict):
            if "status" in result:
                statuses.append(result["status"])
            # Check flags from keys like FIN, MERT, MC
            if result.get("FIN") == "Yes":
                all_flags.add("FIN")
            if result.get("MERT") == "Yes":
                all_flags.add("MERT")
            if result.get("MC") == "Yes":
                all_flags.add("MC")

        # ✅ Case 2: Result is a list of dicts
        elif isinstance(result, list):
            for res in result:
                if "result" in res:
                    statuses.append(res["result"])
                if "status_flag" in res:
                    all_flags.update(res["status_flag"])

        # ✅ Determine booleans
        mc_required = "MC" in all_flags
        televideoagent_required = "MERT" in all_flags
        finreview_required = "FIN" in all_flags

        payload = {
            "request_id": body["request_id"],
            "proposal_number": body["proposalNumber"],
            "statuses": statuses,
            "mc_required": mc_required,
            "televideoagent_required": televideoagent_required,
            "finreview_required": finreview_required,
            "customer_data": rule_info['customer_data'],
            "expected_data": rule_info['expected_data']
        }

        print("Payload to Node.js:", payload)

        try:
            # ✅ ADD THIS CHECK: Only send if we have complete data
            if payload.get("customer_data") and payload.get("expected_data"):
                response = requests.post(
                    "http://13.232.45.218:8000/api/ruleEngineRoutes/save-rule-engine-result",
                    json=payload
                )
                print(f"✅ Sent to Node.js API, Response: {response.status_code}")
            else:
                print("⚠️ Skipping Node.js API call - incomplete data")
        except Exception as e:
            print("⚠️ Node.js API call failed:", e)

        return payload

    except Exception as e:
        logger.error(f"Error in rule engine: {e}")
        return {"error": str(e)}
    
from fastapi import FastAPI, Request
from typing import Dict, Any

# ✅ New API to call it directly
@app.post("/convert_to_structure")
async def convert_to_structure(request: Request):
    print("Received request to convert raw data to rule engine structure148")
    body = await request.json()
    print("Request body:150", body)
    
    if "extractedData" in body:
        raw_db_data = body["extractedData"]
    elif "data" in body:
        raw_db_data = body["data"]
    else:
        raw_db_data = body
        
    print("Raw DB Data:", raw_db_data)
    if not raw_db_data:
        return {"error": "No data provided"}
    
    raw_output_file = "raw_extracted_data.json"
    with open(raw_output_file, "w") as f:
        json.dump(raw_db_data, f, indent=2)
    print(f"Raw data saved to {raw_output_file}")
    
    extract_data = extract_rule_engine_input(raw_db_data)
    print("Extracted Data:", extract_data)
    
    output_file_path = "input.json"
    with open(output_file_path, "w") as f:
        json.dump(extract_data, f, indent=2)
    print(f"Data saved to {output_file_path}")
    return extract_data

    
    # Add this at the bottom of your file
if __name__ == "__main__":
    print(app.routes)
    uvicorn.run(app, host="0.0.0.0", port=5050)