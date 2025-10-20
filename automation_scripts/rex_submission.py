#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EPB Export Tracker REX/SOO Submission Automation (Smart Process Flow Edition)
Author: Izaz Ahamed
Platform: Smart Process Flow
---------------------------------------------------------------------------------
Workflow:
1️⃣ Login with EPB credentials from portal
2️⃣ Add SOO → Confirm popup
3️⃣ Open first record
4️⃣ Fill all fields from CSV
5️⃣ Upload Commercial Invoice + Bill of Lading PDFs from extracted ZIP
6️⃣ Save + Back
7️⃣ Repeat for each CSV row
8️⃣ Generate results CSV with success/failure status
---------------------------------------------------------------------------------
Usage: python rex_submission.py <csv_file> <output_dir> <job_id> <pdf_dir> <username> <password>
"""

import os, sys, csv, time, logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Argument validation
if len(sys.argv) < 7:
    print("❌ Usage: python rex_submission.py <csv_file> <output_dir> <job_id> <pdf_dir> <username> <password>")
    sys.exit(1)

CSV_FILE = sys.argv[1]
OUTPUT_DIR = sys.argv[2]
JOB_ID = sys.argv[3]
PDF_DIR = sys.argv[4]
USERNAME = sys.argv[5]
PASSWORD = sys.argv[6]

URL = "https://epb-exporttracker.gov.bd/#/login"
RESULT_LOG = os.path.join(OUTPUT_DIR, f"soo_results_{JOB_ID}.csv")
TIMEOUT = 30

# Setup logging
os.makedirs(OUTPUT_DIR, exist_ok=True)
log_file = os.path.join(OUTPUT_DIR, f"rex_submission_{JOB_ID}.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logging.info("=" * 80)
logging.info("🚀 EPB REX/SOO Submission Automation Started")
logging.info("=" * 80)
logging.info(f"📁 Input CSV: {CSV_FILE}")
logging.info(f"📂 Output Directory: {OUTPUT_DIR}")
logging.info(f"🆔 Job ID: {JOB_ID}")
logging.info(f"📦 PDF Directory: {PDF_DIR}")
logging.info(f"👤 Username: {USERNAME}")
logging.info("=" * 80)

def setup_driver():
    """Setup Chrome driver with headless configuration"""
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--incognito")

    for path in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]:
        if os.path.exists(path):
            opts.binary_location = path
            break

    driver = webdriver.Chrome(options=opts)
    logging.info("✅ Chrome driver initialized successfully")
    return driver

def read_csv(file_path):
    """Read CSV file and return list of row dictionaries"""
    with open(file_path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def write_result(data, success, message):
    """Write processing result to CSV log"""
    file_exists = os.path.exists(RESULT_LOG)
    with open(RESULT_LOG, "a", newline='', encoding='utf-8') as logf:
        writer = csv.writer(logf)
        if not file_exists:
            writer.writerow(["InvoiceNo", "Status", "Message", "Timestamp"])
        writer.writerow([
            data.get("InvoiceNo", "N/A"),
            "✅ Success" if success else "❌ Failed",
            message,
            time.strftime("%Y-%m-%d %H:%M:%S")
        ])

def find_pdf_file(invoice_no, pdf_type):
    """Find PDF file in extracted directory by invoice number and type"""
    patterns = [
        f"{invoice_no}_{pdf_type}.pdf",
        f"{invoice_no}-{pdf_type}.pdf",
        f"{pdf_type}_{invoice_no}.pdf",
        f"{pdf_type}-{invoice_no}.pdf",
    ]

    for pattern in patterns:
        pdf_path = os.path.join(PDF_DIR, pattern)
        if os.path.exists(pdf_path):
            return os.path.abspath(pdf_path)

    for filename in os.listdir(PDF_DIR):
        if invoice_no in filename and pdf_type.lower() in filename.lower():
            return os.path.abspath(os.path.join(PDF_DIR, filename))

    return None

def login(driver, wait):
    """Login to EPB Export Tracker portal"""
    try:
        logging.info("🌐 Opening EPB Export Tracker...")
        driver.get(URL)

        logging.info("🔐 Logging in...")
        wait.until(EC.presence_of_element_located((By.ID, "inputUserName"))).send_keys(USERNAME)
        driver.find_element(By.ID, "inputPassword").send_keys(PASSWORD)
        driver.find_element(By.CSS_SELECTOR, "button.btn i.icon-lock").find_element(By.XPATH, "..").click()

        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.tile a[href*='sooList']")))
        logging.info("✅ Login successful")
        return True
    except Exception as e:
        logging.error(f"❌ Login failed: {e}")
        return False

def process_soo_record(driver, wait, row, index, total):
    """Process single SOO record"""
    invoice_no = row.get('InvoiceNo', 'Unknown')

    try:
        logging.info(f"\n{'=' * 60}")
        logging.info(f"🚀 Processing record {index}/{total} → Invoice: {invoice_no}")
        logging.info(f"{'=' * 60}")

        # Navigate to SOO List
        driver.find_element(By.CSS_SELECTOR, "div.tile a[href*='sooList']").click()
        time.sleep(2)

        # Click Add SOO
        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[ng-click='checkSooFormEligibility()']"))).click()
        time.sleep(1)

        # Confirm popup
        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.btn.btn-primary[ng-click=\"close('yes')\"]"))).click()
        logging.info("☑️  Add SOO confirmed")

        # Wait for loading to complete
        time.sleep(3)

        # Open first record
        first_row = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.k-grid-content tbody tr:first-child a")))
        driver.execute_script("arguments[0].click();", first_row)
        logging.info("📋 Opened SOO record")
        time.sleep(2)

        # Click SOO Form Details tab
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "SoO Form Details"))).click()
        time.sleep(2)

        # Fill form fields
        logging.info("📝 Filling form fields...")
        Select(wait.until(EC.presence_of_element_located((By.ID, "RexImporterId")))).select_by_value(row.get("RexImporterId", ""))
        Select(driver.find_element(By.ID, "DestinationCountryId")).select_by_value(row.get("DestinationCountryId", ""))
        Select(driver.find_element(By.ID, "inputFreightRoute")).select_by_visible_text(row.get("FreightRoute", ""))

        driver.find_element(By.ID, "inputBLNo").send_keys(row.get("BLNo", ""))
        driver.find_element(By.ID, "inputBLDate").send_keys(row.get("BLDate", ""))
        driver.find_element(By.ID, "inputContainerNo").send_keys(row.get("ContainerNo", ""))
        driver.find_element(By.ID, "adCode").send_keys(row.get("AdCode", ""))
        driver.find_element(By.ID, "serial").send_keys(row.get("Serial", ""))
        Select(driver.find_element(By.ID, "year")).select_by_visible_text(row.get("Year", ""))
        driver.find_element(By.ID, "inputEXPDate").send_keys(row.get("EXPDate", ""))
        driver.find_element(By.ID, "inputBillOfExportNo").send_keys(row.get("BillOfExportNo", ""))
        driver.find_element(By.ID, "inputBillOfExportDate").send_keys(row.get("BillOfExportDate", ""))

        Select(driver.find_element(By.ID, "inputHSCode")).select_by_visible_text(row.get("HSCode", ""))
        driver.find_element(By.ID, "inputQnty").send_keys(row.get("Quantity", ""))
        Select(driver.find_element(By.ID, "inputUnitType")).select_by_visible_text(row.get("UnitType", ""))
        driver.find_element(By.CSS_SELECTOR, "a[ng-click^='addHsCodeInfo']").click()
        time.sleep(1)

        driver.find_element(By.ID, "inputInvoiceNo").send_keys(invoice_no)
        driver.find_element(By.ID, "inputInvoiceDate").send_keys(row.get("InvoiceDate", ""))
        Select(driver.find_element(By.ID, "currency")).select_by_visible_text(row.get("Currency", ""))
        driver.find_element(By.ID, "inputInvoiceValue").send_keys(row.get("InvoiceValue", ""))
        driver.find_element(By.ID, "inputDate").send_keys(row.get("DeclarationDate", ""))

        logging.info("✅ Form fields filled successfully")

        # Upload Commercial Invoice
        logging.info("📤 Uploading Commercial Invoice...")
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Commercial Invoice"))).click()
        time.sleep(1)

        ci_file = find_pdf_file(invoice_no, "invoice")
        if not ci_file:
            raise FileNotFoundError(f"Commercial Invoice PDF not found for {invoice_no}")

        ci_upload = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file'][accept*='.pdf']")))
        ci_upload.send_keys(ci_file)
        logging.info(f"✅ Commercial Invoice uploaded: {os.path.basename(ci_file)}")
        time.sleep(2)

        # Upload Bill of Lading
        logging.info("📦 Uploading Bill of Lading...")
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Bill of Lading"))).click()
        time.sleep(1)

        bol_file = find_pdf_file(invoice_no, "bol")
        if not bol_file:
            raise FileNotFoundError(f"Bill of Lading PDF not found for {invoice_no}")

        bol_upload = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file'][accept*='.pdf']")))
        bol_upload.send_keys(bol_file)
        logging.info(f"✅ Bill of Lading uploaded: {os.path.basename(bol_file)}")
        time.sleep(2)

        # Save form
        logging.info("💾 Saving SOO form...")
        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.control-bar-save-btn[ng-click*='save()']"))).click()
        time.sleep(4)

        # Go back to list
        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='sooList'].navigate-link"))).click()
        logging.info("⬅️  Returned to SOO list")
        time.sleep(2)

        write_result(row, True, "SOO submitted successfully")
        logging.info(f"✅ Record {index} completed successfully")
        return True

    except Exception as e:
        error_msg = str(e)
        logging.error(f"❌ Error processing record {index} (Invoice: {invoice_no}): {error_msg}")
        write_result(row, False, error_msg)
        return False

def main():
    """Main execution function"""
    driver = None
    success_count = 0
    failed_count = 0

    try:
        # Validate CSV file
        if not os.path.exists(CSV_FILE):
            logging.error(f"❌ CSV file not found: {CSV_FILE}")
            return 1

        # Validate PDF directory
        if not os.path.exists(PDF_DIR):
            logging.error(f"❌ PDF directory not found: {PDF_DIR}")
            return 1

        # Read CSV data
        rows = read_csv(CSV_FILE)
        total_rows = len(rows)
        logging.info(f"📊 Found {total_rows} records to process")

        if total_rows == 0:
            logging.warning("⚠️  No records found in CSV file")
            return 1

        # Setup driver and login
        driver = setup_driver()
        wait = WebDriverWait(driver, TIMEOUT)

        if not login(driver, wait):
            logging.error("❌ Failed to login. Aborting...")
            return 1

        # Process each record
        for idx, row in enumerate(rows, start=1):
            if process_soo_record(driver, wait, row, idx, total_rows):
                success_count += 1
            else:
                failed_count += 1

            time.sleep(2)

        # Summary
        logging.info("\n" + "=" * 80)
        logging.info("🎉 Processing Complete!")
        logging.info("=" * 80)
        logging.info(f"✅ Successful: {success_count}/{total_rows}")
        logging.info(f"❌ Failed: {failed_count}/{total_rows}")
        logging.info(f"📄 Results saved to: {RESULT_LOG}")
        logging.info("=" * 80)

        return 0 if failed_count == 0 else 0

    except Exception as e:
        logging.error(f"🚨 Fatal error: {e}")
        return 1
    finally:
        if driver:
            driver.quit()
            logging.info("🔒 Browser closed")

if __name__ == "__main__":
    sys.exit(main())
