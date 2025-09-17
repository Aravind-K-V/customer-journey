# #requirements.txt

# import os
# import re
# import fitz  # PyMuPDF
# import pytesseract
# import sys
# import cv2
# from PIL import Image
# from pdf2image import convert_from_path
# import joblib
# import numpy as np
# from sklearn.pipeline import Pipeline
# from sklearn.linear_model import LogisticRegression
# from sklearn.preprocessing import StandardScaler
# from sklearn.metrics import confusion_matrix, accuracy_score
# import warnings
# import logging
# from datetime import datetime
# from urllib.parse import urlparse
# from flask import Flask, request, jsonify

# app = Flask(__name__)
# warnings.filterwarnings("ignore")

# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# # --- CONFIG ---
# MODEL_FILE = "proposal_form_model.pkl"
# CHECK_FOLDER = r"E:\saisri\kazunov 1ai\proposal forms\sample"
# LOG_FILE = "proposal_form_log.txt"

# # --- KEYWORDS ---
# KEYWORDS = [
#     'proposal form', 'insurance', 'sum insured', 'premium', 'nominee',
#     'insurer', 'pre-existing disease', 'family history', 'medical history',
#     'health insurance', 'plan name', 'CIN', 'UIN', 'Product Code', 'URN', 'Unique Ref No',
    
#     # Personal Information
#     'proposer', 'insured person', 'policy holder', 'applicant', 'beneficiary',
#     'date of birth', 'age', 'gender', 'marital status', 'occupation',
#     'annual income', 'nationality', 'residence status', 'contact details',
#     'address proof', 'identity proof', 'PAN card', 'Aadhaar', 'passport',
    
#     # Insurance Specific Terms
#     'policy term', 'policy period', 'coverage', 'deductible', 'co-payment',
#     'waiting period', 'grace period', 'maturity benefit', 'death benefit',
#     'accidental death benefit', 'disability benefit', 'critical illness',
#     'hospitalization', 'day care treatment', 'pre-hospitalization',
#     'post-hospitalization', 'ambulance charges', 'room rent limit',
#     'ICU charges', 'surgical expenses', 'medical expenses',
    
#     # Policy Details
#     'policy number', 'proposal number', 'application number', 'certificate number',
#     'endorsement', 'rider', 'add-on cover', 'base cover', 'floater policy',
#     'individual policy', 'family floater', 'group insurance', 'top-up',
#     'restoration benefit', 'no claim bonus', 'cumulative bonus',
    
#     # Medical Information
#     'medical examination', 'health checkup', 'BMI', 'blood pressure',
#     'diabetes', 'hypertension', 'heart disease', 'cancer', 'kidney disease',
#     'liver disease', 'respiratory disease', 'mental illness', 'smoking',
#     'alcohol consumption', 'drug abuse', 'allergies', 'medications',
#     'surgery history', 'hospitalization history', 'treatment history',
    
#     # Financial Terms
#     'premium amount', 'premium frequency', 'payment mode', 'installment',
#     'single premium', 'regular premium', 'limited premium', 'GST',
#     'service tax', 'cess', 'discount', 'loading', 'extra premium',
#     'premium waiver', 'surrender value', 'paid-up value', 'loan value',
    
#     # Legal and Compliance
#     'declaration', 'disclosure', 'warranty', 'condition', 'exclusion',
#     'terms and conditions', 'policy document', 'proposal form declaration',
#     'agent code', 'agent name', 'intermediary', 'broker', 'bancassurance',
#     'IRDAI', 'regulatory', 'compliance', 'grievance', 'ombudsman',
    
#     # Life Insurance Specific
#     'life cover', 'term insurance', 'whole life', 'endowment', 'ULIP',
#     'unit linked', 'pension plan', 'annuity', 'retirement plan',
#     'child plan', 'education plan', 'money back', 'guaranteed return',
    
#     # Health Insurance Specific
#     'mediclaim', 'hospitalisation', 'outpatient', 'inpatient', 'cashless',
#     'reimbursement', 'network hospital', 'pre-authorization', 'claim settlement',
#     'TPA', 'third party administrator', 'health card', 'treatment',
    
#     # Motor Insurance Specific (if applicable)
#     'vehicle insurance', 'comprehensive cover', 'third party liability',
#     'own damage', 'IDV', 'insured declared value', 'registration number',
#     'engine number', 'chassis number', 'vehicle type', 'fuel type',
    
#     # Documents
#     'KYC', 'know your customer', 'photograph', 'signature', 'thumb impression',
#     'witness', 'attestation', 'verification', 'document submission',
#     'original documents', 'self-attested', 'notarized',
    
#     # Dates and Timelines
#     'proposal date', 'inception date', 'commencement date', 'expiry date',
#     'renewal date', 'due date', 'effective date', 'issue date',
    
#     # Communication
#     'email id', 'mobile number', 'telephone number', 'correspondence address',
#     'permanent address', 'communication preference', 'language preference',
    
#     # Additional Coverage Terms
#     'emergency evacuation', 'overseas coverage', 'travel insurance',
#     'personal accident', 'group personal accident', 'workmen compensation',
#     'professional indemnity', 'public liability', 'product liability',
    
#     # Claims Related
#     'claim form', 'claim intimation', 'claim process', 'claim settlement ratio',
#     'claim history', 'previous claims', 'pending claims', 'rejected claims',
    
#     # Regulatory Numbers
#     'GSTIN', 'registration certificate', 'license number', 'authorization code',
#     'IRDA license', 'certificate of insurance', 'cover note',
    
#     # Special Categories
#     'senior citizen', 'student', 'housewife', 'self-employed', 'salaried',
#     'business owner', 'professional', 'retired', 'dependent',
    
#     # Risk Assessment
#     'risk assessment', 'underwriting', 'medical underwriting', 'financial underwriting',
#     'hazardous occupation', 'dangerous sports', 'adventure sports',
#     'overseas travel', 'high risk', 'standard risk', 'preferred risk'
# ]

# # KEYWORDS = [
# #     'proposal form', 'insurance', 'sum insured', 'premium', 'nominee',
# #     'insurer', 'pre-existing disease', 'family history', 'medical history',
# #     'health insurance', 'plan name', 'CIN', 'UIN', 'Product Code', 'URN', 'Unique Ref No'
# # ]

# NEGATIVE_KEYWORDS = [
#     'discharge summary', 'medical leave', 'patient registration form', 'medical certificate of fitness',
#     'to return to duty', 'medical form', 'patient admission form',
#     'registration cum admission form', 'admission form', 'hospital admission',
#     'discharge form', 'patient admission details', 'patient registration',  
#     'employment agreement', 'salary', 'joining date',  
#     'job role', 'compensation', 'employee benefits', 'probation period', 'offer letter', 'resume'
# ]


# # --- FUNCTIONS ---
# def extract_text_from_pdf(path):
#     try:
#         doc = fitz.open(path)
#         all_text = ''
#         for page in doc:
#             all_text += page.get_text()
#         if not all_text.strip():
#             raise ValueError("Empty text, try OCR.")
#         return all_text, len(doc)
#     except Exception:
#         print(f"No text found in {path}, using OCR...")
#         return extract_text_with_ocr(path)
    
# def preprocess_image_for_ocr(pil_img):
#     """Convert PIL image to OpenCV format and preprocess for OCR."""
#     img = np.array(pil_img)

#     # Convert to grayscale
#     gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

#     # Apply adaptive thresholding (binarization)
#     thresh = cv2.adaptiveThreshold(
#         gray, 255,
#         cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
#         cv2.THRESH_BINARY,
#         31, 2
#     )

#     # Denoise
#     denoised = cv2.fastNlMeansDenoising(thresh, h=30)

#     # Optional: Deskew (for rotated text)
#     coords = np.column_stack(np.where(denoised > 0))
#     angle = cv2.minAreaRect(coords)[-1]
#     if angle < -45:
#         angle = -(90 + angle)
#     else:
#         angle = -angle
#     (h, w) = denoised.shape[:2]
#     center = (w // 2, h // 2)
#     M = cv2.getRotationMatrix2D(center, angle, 1.0)
#     rotated = cv2.warpAffine(denoised, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

#     return Image.fromarray(rotated)

# def extract_text_with_ocr(pdf_path):
#     try:
#         images = convert_from_path(pdf_path, dpi=300)
#         text = ''
#         for img in images:
#             processed_img = preprocess_image_for_ocr(img)
#             page_text = pytesseract.image_to_string(processed_img, lang="eng")
#             text += page_text + "\n"
#         return text, len(images)
#     except Exception as e:
#         print(f"OCR failed for {pdf_path}: {e}")
#         return "", 0

# def extract_features(text, num_pages):
#     text = text.lower()
#     keyword_counts = [text.count(k.lower()) for k in KEYWORDS]
#     total_keywords = sum(1 for count in keyword_counts if count > 0)
#     features = keyword_counts + [len(text), num_pages]
#     return features, total_keywords, text

# def train_classifier():
#     print("Model not found, training a new one...")
#     labeled = [
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\ProHealth Prime with Prime plus_Proposal form_24Oct17.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Copy of 426189015-Proposal-Form-for-Health-Insurance-Policy.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\656865713-StarHealthAssureInsurancePolicy-ProposalForm-1-2.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\427357617-Tata-AIG-Health-Insurance-pdf.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\426189015-Proposal-Form-for-Health-Insurance-Policy.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\418962274-National-Insurance-Varistha-Proposal-Form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\398623645-Icici-Lombard-Complete-Health-Insurance-Proposal-Form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\324615826-RPLI-Medical-form1-pdf.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\264743482-Easy-Health-Proposal-Form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\277713967-Health-Insurance-Policy.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\patient-registration-form.pdf", 'label': 0},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\1.-STUDENTS-REGISTRATION-FORM.pdf", 'label': 0},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\EDIT OoPdfFormExample.pdf", 'label': 0},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\tata_aig_supercharge_proposal_form_176b99da62.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Tata_AIG_Criti_Medicare_Proposal_Form_21d8ab067a.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\secure-(personal-accident-insurance)---proposal-form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\protect-plus---proposal-form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_Star_Specialized_Product_Proposal_Form_V_15_709da046d3.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_Star_Hospital_Cash_V_8_Web_160f4a21fd.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_aeff10b821.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_0b4f1c4c9c.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Premier_Proposal_5f2bd12e92.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\personal-protect-policy_proposal-form_lot-07.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\PA_Common_Proposal_Form_V_5_Web_27a4da8bb8.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Medicare_Proposal_7e538e3ab4.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Medi_Care_Plus_Proposal_f9213f5b09.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\instant-care---proposal-form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\il-complete-health-insurance_proposal-form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\hospifund-insurance_proposal-form_lot-09.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\20240509T052044.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Home_Guard_Plus_Capital_6976f87f3a.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\health-shield-360-retail-proposal-form---perq-2.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\health-shield-360-retail-proposal-form---perq.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\health-care-plus-insurance_proposal-form_lot-12.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\family-shield_proposal-form_lot-08.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\elder_care_proposal_form_d35a0d8615.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\Common_Proposal_Form_1_V_24_Web_0b63653a62.pdf", 'label': 0},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\care-advanced---proposal-form.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\20221003T120811.pdf", 'label': 1},
#         {'path': r"E:\saisri\kazunov 1ai\proposal forms\20200930T090606.pdf", 'label': 1}
#     ]
#     X, y = [], []
#     for item in labeled:
#         text, pages = extract_text_from_pdf(item['path'])[0:2]
#         if text.strip():
#             features, _, _ = extract_features(text, pages)
#             X.append(features)
#             y.append(item['label'])

#     model = Pipeline([
#         ('scaler', StandardScaler()),
#         ('clf', LogisticRegression(max_iter=1000))
#     ])
#     model.fit(X, y)
#     joblib.dump(model, MODEL_FILE)
#     print("Model trained and saved.")
#     return model

# def contains_negative_keywords(text):
#     return any(neg_kw.lower() in text for neg_kw in NEGATIVE_KEYWORDS)

# def predict_proposal_form(files):
    
#     if os.path.exists(MODEL_FILE):
#         model = joblib.load(MODEL_FILE)
#     else:
#         model = train_classifier()

#     y_true, y_pred = [], []
#     final_results = []
#     # If `files` is just a single path string
#     if isinstance(files, str):
#         files = [files]

#     with open(LOG_FILE, "a") as log:
#         for file in files:
#             try:
#                 text, pages = extract_text_from_pdf(file)
#                 if not text.strip():
#                     print(f"Skipping {file} (no text found).")
#                     continue

#                 features, keyword_count, lowered_text = extract_features(text, pages)
#                 model_pred = model.predict([features])[0]
#                 keyword_result = keyword_count >= 3
#                 has_negative = contains_negative_keywords(lowered_text)

#                 # Final result
#                 final_result = 0 if has_negative else (1 if keyword_result or model_pred == 1 else 0)

#                 log.write(f"{os.path.basename(file)}: Keywords = {keyword_count}, Model = {model_pred}, Negative = {has_negative}, Final = {final_result}\n")
#                 print(f"{os.path.basename(file)} → Keywords: {keyword_count}, Model: {model_pred}, Negative: {has_negative} → Final: {'Proposal Form' if final_result else 'NOT Proposal Form'}")

#                 # Confusion matrix basis (assuming model label is ground truth)
#                 y_true.append(model_pred)
#                 y_pred.append(final_result)
#                 final_results.append(final_result)
#             except Exception as e:
#                 print(f"Failed to process {file}: {e}")

#     if y_true and y_pred:
#         print("\n--- Evaluation Metrics ---")
#         print("Confusion Matrix:")
#         print(confusion_matrix(y_true, y_pred))
#         print(f"Accuracy Score: {accuracy_score(y_true, y_pred):.2f}")
        
#     # Return result for one file or list for multiple
#     if len(final_results) == 1:
#         return final_results[0]
#     return final_results
# def detect_from_s3(s3_path):
#     try:
#         is_proposal = bool(predict_proposal_form(s3_path))
#         return { "isProposalForm": is_proposal }
#     except Exception as e:
#         return { "error": str(e) }



# def main():
#     pdf_files = [os.path.join(CHECK_FOLDER, f)
#                  for f in os.listdir(CHECK_FOLDER)
#                  if f.lower().endswith('.pdf')]
#     if not pdf_files:
#         print("No PDF files found in the check_proposal folder.")
#         return
#     results=predict_proposal_form(pdf_files)
#     return results

# main()


# @app.route('/detect_proposal_form', methods=['POST'])
# def detect():
#     data = request.get_json()
#     s3_url = data.get("s3_url")
#     if not s3_url:
#         return jsonify({"error": "Missing s3_url"}), 400

#     result = detect_from_s3(s3_url)
#     return jsonify(result)


# if __name__ == "__main__":
#     if len(sys.argv) > 1:
#         pdf_path = sys.argv[1]
#         result = predict_proposal_form(pdf_path)
#         print(result)
#     else:
#         app.run(debug=True, port=8080)


#requirements.txt

import os
import re
import fitz  # PyMuPDF
import pytesseract
import sys
import cv2
from PIL import Image
from pdf2image import convert_from_path
import joblib
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, accuracy_score
import warnings
import logging
from datetime import datetime
from urllib.parse import urlparse
from flask import Flask, request, jsonify

app = Flask(__name__)
warnings.filterwarnings("ignore")

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# --- CONFIG ---
MODEL_FILE = "proposal_form_model.pkl"
CHECK_FOLDER = r"E:\saisri\kazunov 1ai\proposal forms\sample"
LOG_FILE = "proposal_form_log.txt"

# --- KEYWORDS ---
KEYWORDS = [
    'proposal form', 'insurance', 'sum insured', 'premium', 'nominee',
    'insurer', 'pre-existing disease', 'family history', 'medical history',
    'health insurance', 'plan name', 'CIN', 'UIN', 'Product Code', 'URN', 'Unique Ref No',
    
    # Personal Information
    'proposer', 'insured person', 'policy holder', 'applicant', 'beneficiary',
    'date of birth', 'age', 'gender', 'marital status', 'occupation',
    'annual income', 'nationality', 'residence status', 'contact details',
    'address proof', 'identity proof', 'PAN card', 'Aadhaar', 'passport',
    
    # Insurance Specific Terms
    'policy term', 'policy period', 'coverage', 'deductible', 'co-payment',
    'waiting period', 'grace period', 'maturity benefit', 'death benefit',
    'accidental death benefit', 'disability benefit', 'critical illness',
    'hospitalization', 'day care treatment', 'pre-hospitalization',
    'post-hospitalization', 'ambulance charges', 'room rent limit',
    'ICU charges', 'surgical expenses', 'medical expenses',
    
    # Policy Details
    'policy number', 'proposal number', 'application number', 'certificate number',
    'endorsement', 'rider', 'add-on cover', 'base cover', 'floater policy',
    'individual policy', 'family floater', 'group insurance', 'top-up',
    'restoration benefit', 'no claim bonus', 'cumulative bonus',
    
    # Medical Information
    'medical examination', 'health checkup', 'BMI', 'blood pressure',
    'diabetes', 'hypertension', 'heart disease', 'cancer', 'kidney disease',
    'liver disease', 'respiratory disease', 'mental illness', 'smoking',
    'alcohol consumption', 'drug abuse', 'allergies', 'medications',
    'surgery history', 'hospitalization history', 'treatment history',
    
    # Financial Terms
    'premium amount', 'premium frequency', 'payment mode', 'installment',
    'single premium', 'regular premium', 'limited premium', 'GST',
    'service tax', 'cess', 'discount', 'loading', 'extra premium',
    'premium waiver', 'surrender value', 'paid-up value', 'loan value',
    
    # Legal and Compliance
    'declaration', 'disclosure', 'warranty', 'condition', 'exclusion',
    'terms and conditions', 'policy document', 'proposal form declaration',
    'agent code', 'agent name', 'intermediary', 'broker', 'bancassurance',
    'IRDAI', 'regulatory', 'compliance', 'grievance', 'ombudsman',
    
    # Life Insurance Specific
    'life cover', 'term insurance', 'whole life', 'endowment', 'ULIP',
    'unit linked', 'pension plan', 'annuity', 'retirement plan',
    'child plan', 'education plan', 'money back', 'guaranteed return',
    
    # Health Insurance Specific
    'mediclaim', 'hospitalisation', 'outpatient', 'inpatient', 'cashless',
    'reimbursement', 'network hospital', 'pre-authorization', 'claim settlement',
    'TPA', 'third party administrator', 'health card', 'treatment',
    
    # Motor Insurance Specific (if applicable)
    'vehicle insurance', 'comprehensive cover', 'third party liability',
    'own damage', 'IDV', 'insured declared value', 'registration number',
    'engine number', 'chassis number', 'vehicle type', 'fuel type',
    
    # Documents
    'KYC', 'know your customer', 'photograph', 'signature', 'thumb impression',
    'witness', 'attestation', 'verification', 'document submission',
    'original documents', 'self-attested', 'notarized',
    
    # Dates and Timelines
    'proposal date', 'inception date', 'commencement date', 'expiry date',
    'renewal date', 'due date', 'effective date', 'issue date',
    
    # Communication
    'email id', 'mobile number', 'telephone number', 'correspondence address',
    'permanent address', 'communication preference', 'language preference',
    
    # Additional Coverage Terms
    'emergency evacuation', 'overseas coverage', 'travel insurance',
    'personal accident', 'group personal accident', 'workmen compensation',
    'professional indemnity', 'public liability', 'product liability',
    
    # Claims Related
    'claim form', 'claim intimation', 'claim process', 'claim settlement ratio',
    'claim history', 'previous claims', 'pending claims', 'rejected claims',
    
    # Regulatory Numbers
    'GSTIN', 'registration certificate', 'license number', 'authorization code',
    'IRDA license', 'certificate of insurance', 'cover note',
    
    # Special Categories
    'senior citizen', 'student', 'housewife', 'self-employed', 'salaried',
    'business owner', 'professional', 'retired', 'dependent',
    
    # Risk Assessment
    'risk assessment', 'underwriting', 'medical underwriting', 'financial underwriting',
    'hazardous occupation', 'dangerous sports', 'adventure sports',
    'overseas travel', 'high risk', 'standard risk', 'preferred risk'
]

# KEYWORDS = [
#     'proposal form', 'insurance', 'sum insured', 'premium', 'nominee',
#     'insurer', 'pre-existing disease', 'family history', 'medical history',
#     'health insurance', 'plan name', 'CIN', 'UIN', 'Product Code', 'URN', 'Unique Ref No'
# ]

NEGATIVE_KEYWORDS = [
    'discharge summary', 'medical leave', 'patient registration form', 'medical certificate of fitness',
    'to return to duty', 'medical form', 'patient admission form',
    'registration cum admission form', 'admission form', 'hospital admission',
    'discharge form', 'patient admission details', 'patient registration',  
    'employment agreement', 'joining date',  
    'job role', 'compensation', 'employee benefits', 'probation period', 'offer letter', 'resume'
]


# --- FUNCTIONS ---
def extract_text_from_pdf(path):
    try:
        doc = fitz.open(path)
        all_text = ''
        for page in doc:
            all_text += page.get_text()
        if not all_text.strip():
            raise ValueError("Empty text, try OCR.")
        return all_text, len(doc)
    except Exception:
        print(f"No text found in {path}, using OCR...")
        return extract_text_with_ocr(path)
    
def preprocess_image_for_ocr(pil_img):
    """Convert PIL image to OpenCV format and preprocess for OCR."""
    img = np.array(pil_img)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    # Apply adaptive thresholding (binarization)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 2
    )

    # Denoise
    denoised = cv2.fastNlMeansDenoising(thresh, h=30)

    # Optional: Deskew (for rotated text)
    coords = np.column_stack(np.where(denoised > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = denoised.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(denoised, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    return Image.fromarray(rotated)

def extract_text_with_ocr(pdf_path):
    try:
        images = convert_from_path(pdf_path, dpi=300)
        text = ''
        for img in images:
            processed_img = preprocess_image_for_ocr(img)
            page_text = pytesseract.image_to_string(processed_img, lang="eng")
            text += page_text + "\n"
        return text, len(images)
    except Exception as e:
        print(f"OCR failed for {pdf_path}: {e}")
        return "", 0

def extract_features(text, num_pages):
    text = text.lower()
    keyword_counts = [text.count(k.lower()) for k in KEYWORDS]
    total_keywords = sum(1 for count in keyword_counts if count > 0)
    features = keyword_counts + [len(text), num_pages]
    return features, total_keywords, text

def train_classifier():
    print("Model not found, training a new one...")
    labeled = [
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\ProHealth Prime with Prime plus_Proposal form_24Oct17.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Copy of 426189015-Proposal-Form-for-Health-Insurance-Policy.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\656865713-StarHealthAssureInsurancePolicy-ProposalForm-1-2.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\427357617-Tata-AIG-Health-Insurance-pdf.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\426189015-Proposal-Form-for-Health-Insurance-Policy.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\418962274-National-Insurance-Varistha-Proposal-Form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\398623645-Icici-Lombard-Complete-Health-Insurance-Proposal-Form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\324615826-RPLI-Medical-form1-pdf.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\264743482-Easy-Health-Proposal-Form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\277713967-Health-Insurance-Policy.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\patient-registration-form.pdf", 'label': 0},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\1.-STUDENTS-REGISTRATION-FORM.pdf", 'label': 0},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\EDIT OoPdfFormExample.pdf", 'label': 0},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\tata_aig_supercharge_proposal_form_176b99da62.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Tata_AIG_Criti_Medicare_Proposal_Form_21d8ab067a.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\secure-(personal-accident-insurance)---proposal-form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\protect-plus---proposal-form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_Star_Specialized_Product_Proposal_Form_V_15_709da046d3.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_Star_Hospital_Cash_V_8_Web_160f4a21fd.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_aeff10b821.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Proposal_Form_0b4f1c4c9c.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Premier_Proposal_5f2bd12e92.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\personal-protect-policy_proposal-form_lot-07.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\PA_Common_Proposal_Form_V_5_Web_27a4da8bb8.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Medicare_Proposal_7e538e3ab4.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Medi_Care_Plus_Proposal_f9213f5b09.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\instant-care---proposal-form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\il-complete-health-insurance_proposal-form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\hospifund-insurance_proposal-form_lot-09.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\20240509T052044.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Home_Guard_Plus_Capital_6976f87f3a.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\health-shield-360-retail-proposal-form---perq-2.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\health-shield-360-retail-proposal-form---perq.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\health-care-plus-insurance_proposal-form_lot-12.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\family-shield_proposal-form_lot-08.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\elder_care_proposal_form_d35a0d8615.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\Common_Proposal_Form_1_V_24_Web_0b63653a62.pdf", 'label': 0},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\care-advanced---proposal-form.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\20221003T120811.pdf", 'label': 1},
        {'path': r"E:\saisri\kazunov 1ai\proposal forms\20200930T090606.pdf", 'label': 1}
    ]
    X, y = [], []
    for item in labeled:
        text, pages = extract_text_from_pdf(item['path'])[0:2]
        if text.strip():
            features, _, _ = extract_features(text, pages)
            X.append(features)
            y.append(item['label'])

    model = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    model.fit(X, y)
    joblib.dump(model, MODEL_FILE)
    print("Model trained and saved.")
    return model

def contains_negative_keywords(text):
    return any(neg_kw.lower() in text for neg_kw in NEGATIVE_KEYWORDS)

def predict_proposal_form(files):
    
    if os.path.exists(MODEL_FILE):
        model = joblib.load(MODEL_FILE)
    else:
        model = train_classifier()

    y_true, y_pred = [], []
    final_results = []
    # If `files` is just a single path string
    if isinstance(files, str):
        files = [files]

    with open(LOG_FILE, "a") as log:
        for file in files:
            try:
                text, pages = extract_text_from_pdf(file)
                if not text.strip():
                    print(f"Skipping {file} (no text found).")
                    continue

                features, keyword_count, lowered_text = extract_features(text, pages)
                model_pred = model.predict([features])[0]
                keyword_result = keyword_count >= 3

                # ✅ Find matched keywords
                matched_keywords = [k for k in KEYWORDS if k.lower() in lowered_text]
                negative_matches = [n for n in NEGATIVE_KEYWORDS if n.lower() in lowered_text]

                # Debug prints
                print(f"\n📄 File: {os.path.basename(file)}")
                print(f"✅ Matched Proposal Keywords ({len(matched_keywords)}): {matched_keywords}")
                print(f"❌ Matched Negative Keywords ({len(negative_matches)}): {negative_matches}")

                has_negative = len(negative_matches) > 0


                # Final result
                final_result = 0 if has_negative else (1 if keyword_result or model_pred == 1 else 0)

                log.write(f"{os.path.basename(file)}: Keywords = {keyword_count}, Model = {model_pred}, Negative = {has_negative}, Final = {final_result}\n")
                print(f"{os.path.basename(file)} → Keywords: {keyword_count}, Model: {model_pred}, Negative: {has_negative} → Final: {'Proposal Form' if final_result else 'NOT Proposal Form'}")

                # Confusion matrix basis (assuming model label is ground truth)
                y_true.append(model_pred)
                y_pred.append(final_result)
                final_results.append(final_result)
            except Exception as e:
                print(f"Failed to process {file}: {e}")

    if y_true and y_pred:
        print("\n--- Evaluation Metrics ---")
        print("Confusion Matrix:")
        print(confusion_matrix(y_true, y_pred))
        print(f"Accuracy Score: {accuracy_score(y_true, y_pred):.2f}")
        
    # Return result for one file or list for multiple
    if len(final_results) == 1:
        return final_results[0]
    return final_results
def detect_from_s3(s3_path):
    try:
        is_proposal = bool(predict_proposal_form(s3_path))
        return { "isProposalForm": is_proposal }
    except Exception as e:
        return { "error": str(e) }



def main():
    pdf_files = [os.path.join(CHECK_FOLDER, f)
                 for f in os.listdir(CHECK_FOLDER)
                 if f.lower().endswith('.pdf')]
    if not pdf_files:
        print("No PDF files found in the check_proposal folder.")
        return
    results=predict_proposal_form(pdf_files)
    return results

# main()


# @app.route('/detect_proposal_form', methods=['POST'])
# def detect():
#     data = request.get_json()
#     s3_url = data.get("s3_url")
#     if not s3_url:
#         return jsonify({"error": "Missing s3_url"}), 400

#     result = detect_from_s3(s3_url)
#     return jsonify(result)


# if __name__ == "__main__":
#     if len(sys.argv) > 1:
#         pdf_path = sys.argv[1]
#         result = predict_proposal_form(pdf_path)
#         print(result)
#     else:
#         app.run(debug=True, port=8080)
