#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bangladesh Bank EXP Download Automation (Stable Final Version)
Author: Izaz Ahamed
Platform: Smart Process Flow
------------------------------------------------------------
✅ Logs into https://exp.bb.org.bd/ords/f?p=112
✅ Reads records from CSV (ADSCODE2, EXP_SERIAL2, EXP_YEAR2)
✅ Downloads EXP PDFs directly from iframe links
✅ Merges all downloaded PDFs into a single combined file
✅ Compatible with headless VPS (no GUI required)
✅ Includes automatic recovery on failures
------------------------------------------------------------
"""

import os, sys, time, csv, logging, urllib.request
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from PyPDF2 import PdfMerger

# ---------------------------------------------------------------------
# ARGUMENTS
# ---------------------------------------------------------------------
if len(sys.argv) < 6:
    print("❌ Usage: python3 bb_exp_search.py <input_csv> <output_dir> <job_id> <username> <password> [--fast-mode]")
    sys.exit(1)

CSV_FILE = sys.argv[1]
OUTPUT_DIR = sys.argv[2]
JOB_ID = sys.argv[3]
USERNAME = sys.argv[4]
PASSWORD = sys.argv[5]
FAST_MODE = "--fast-mode" in sys.argv

BASE_URL = "https://exp.bb.org.bd/ords/f?p=112"
DOWNLOAD_DIR = os.path.join(OUTPUT_DIR, "downloads")
COMBINED_PDF = os.path.join(DOWNLOAD_DIR, f"EXP_Combined_{JOB_ID}.pdf")

# ---------------------------------------------------------------------
# LOGGING SETUP
# ---------------------------------------------------------------------
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
log_file = os.path.join(OUTPUT_DIR, f"exp_download_{JOB_ID}.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(log_file), logging.StreamHandler(sys.stdout)]
)

logging.info("🚀 Starting Bangladesh Bank EXP automation")
logging.info(f"📁 Input CSV: {CSV_FILE}")
logging.info(f"📂 Output Directory: {OUTPUT_DIR}")
logging.info(f"🆔 Job ID: {JOB_ID}")
logging.info(f"👤 Username: {USERNAME}")
logging.info(f"⚙️ Fast Mode: {'ON' if FAST_MODE else 'OFF'}")

# ---------------------------------------------------------------------
# BROWSER SETUP
# ---------------------------------------------------------------------
def get_browser():
    options = uc.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-quic")
    options.add_argument("--disable-http2")
    options.add_argument("--disable-ipv6")
    options.add_argument("--window-size=1366,768")
    prefs = {"download.default_directory": DOWNLOAD_DIR}
    options.add_experimental_option("prefs", prefs)
    driver = uc.Chrome(options=options)
    driver.set_page_load_timeout(60)
    return driver

# ---------------------------------------------------------------------
# SCREENSHOT HELPER
# ---------------------------------------------------------------------
def save_screenshot(driver, name):
    try:
        path = os.path.join(DOWNLOAD_DIR, f"{name}_{int(time.time())}.png")
        driver.save_screenshot(path)
        logging.info(f"📸 Saved screenshot: {path}")
    except Exception:
        pass

# ---------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------
def login(driver):
    for attempt in range(3):
        try:
            logging.info(f"🔐 Attempting login ({attempt+1}/3)...")
            driver.get(BASE_URL)
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "P101_USERNAME")))

            driver.find_element(By.ID, "P101_USERNAME").send_keys(USERNAME)
            driver.find_element(By.ID, "P101_PASSWORD").send_keys(PASSWORD)
            driver.find_element(By.LINK_TEXT, "Login").click()

            WebDriverWait(driver, 25).until(EC.presence_of_element_located((By.PARTIAL_LINK_TEXT, "Transaction")))
            logging.info("✅ Login successful.")
            return True

        except Exception as e:
            save_screenshot(driver, f"error_login_fail_{attempt+1}")
            logging.warning(f"⚠️ Login attempt {attempt+1} failed: {e}")
            time.sleep(5)
    logging.error("❌ All login attempts failed.")
    sys.exit(2)

# ---------------------------------------------------------------------
# OPEN SEARCH PAGE
# ---------------------------------------------------------------------
def open_search_page(driver):
    driver.find_element(By.PARTIAL_LINK_TEXT, "Transaction").click()
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.PARTIAL_LINK_TEXT, "Search EXP Detail Information"))
    ).click()
    logging.info("📄 Opened EXP search page via Transaction menu.")

# ---------------------------------------------------------------------
# PROCESS SINGLE EXP ENTRY
# ---------------------------------------------------------------------
def process_exp(driver, adscode, exp_serial, exp_year):
    try:
        WebDriverWait(driver, 25).until(EC.presence_of_element_located((By.ID, "P92_ADSCODE2")))
        for f_id in ["P92_ADSCODE2", "P92_EXP_SERIAL2", "P92_EXP_YEAR2"]:
            driver.find_element(By.ID, f_id).clear()

        driver.find_element(By.ID, "P92_ADSCODE2").send_keys(adscode)
        driver.find_element(By.ID, "P92_EXP_SERIAL2").send_keys(exp_serial)
        driver.find_element(By.ID, "P92_EXP_YEAR2").send_keys(exp_year)
        driver.find_element(By.LINK_TEXT, "Search").click()

        WebDriverWait(driver, 25).until(EC.presence_of_element_located((By.LINK_TEXT, "Print EXP")))
        driver.find_element(By.LINK_TEXT, "Print EXP").click()
        logging.info(f"🖨️ Opening Print EXP for {adscode}-{exp_serial}-{exp_year}")

        # Wait for iframe with direct PDF
        time.sleep(3)
        iframe = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//iframe[contains(@src, 'PRINT_REPORT')]"))
        )
        pdf_url = iframe.get_attribute("src")
        if not pdf_url.startswith("http"):
            pdf_url = "https://exp.bb.org.bd/ords/" + pdf_url

        logging.info(f"🔗 Direct PDF link: {pdf_url}")

        pdf_filename = os.path.join(DOWNLOAD_DIR, f"EXP_{adscode}_{exp_serial}_{exp_year}.pdf")
        urllib.request.urlretrieve(pdf_url, pdf_filename)
        logging.info(f"✅ Downloaded: {pdf_filename}")

        # Back to search page
        try:
            back_btn = WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "Back"))
            )
            back_btn.click()
        except Exception:
            driver.get("https://exp.bb.org.bd/ords/f?p=112:92:::::")

        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "P92_ADSCODE2")))
        logging.info(f"✅ Completed {adscode}-{exp_serial}-{exp_year}\n")

    except Exception as e:
        save_screenshot(driver, f"fatal_{adscode}_{exp_serial}")
        logging.error(f"❌ Failed for {adscode}-{exp_serial}-{exp_year}: {e}")
        try:
            driver.get("https://exp.bb.org.bd/ords/f?p=112:92:::::")
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "P92_ADSCODE2")))
            logging.info("🔄 Recovered search page.")
        except Exception:
            pass

# ---------------------------------------------------------------------
# MERGE PDFs
# ---------------------------------------------------------------------
def merge_pdfs():
    pdfs = [os.path.join(DOWNLOAD_DIR, f) for f in os.listdir(DOWNLOAD_DIR) if f.lower().endswith(".pdf")]
    if not pdfs:
        logging.warning("⚠️ No PDFs found to merge.")
        return
    merger = PdfMerger()
    for f in sorted(pdfs):
        merger.append(f)
    merger.write(COMBINED_PDF)
    merger.close()
    logging.info(f"📄 Combined PDF created: {COMBINED_PDF}")

# ---------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------
def main():
    try:
        driver = get_browser()
        login(driver)
        open_search_page(driver)

        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                adscode = row.get("ADSCODE2", "").strip()
                exp_serial = row.get("EXP_SERIAL2", "").strip()
                exp_year = row.get("EXP_YEAR2", "").strip() or "2025"
                if not adscode or not exp_serial:
                    continue
                count += 1
                process_exp(driver, adscode, exp_serial, exp_year)

        driver.quit()
        logging.info(f"✅ All {count} EXP records processed. Now merging PDFs...")
        merge_pdfs()
        logging.info("🎉 Finished all operations successfully.")
        sys.exit(0)

    except Exception as e:
        logging.error(f"❌ Fatal error in main: {e}")
        sys.exit(1)

# ---------------------------------------------------------------------
if __name__ == "__main__":
    main()
