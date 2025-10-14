#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Damco (APM) Tracking for Incentive - Maersk Portal Automation (Headless + Private + Auto Driver)
Author: Izaz Ahamed
------------------------------------------------------------
✅ Headless & private Chrome (no cache, no cookies)
✅ Automatic driver management via undetected_chromedriver
✅ PDF export per FCR + combined report
✅ Compatible with Smart Process Flow architecture
"""

import os, sys, time, logging, base64, tempfile, shutil, json
import pandas as pd
from datetime import datetime
from PyPDF2 import PdfMerger

# Selenium/UC imports
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class DamcoTrackingAutomation:
    def __init__(self, headless=True, output_dir='results', job_id=None):
        self.headless = headless
        self.output_dir = output_dir
        self.job_id = job_id
        self.driver = None
        self.wait = None
        self.results = []
        self.result_files = []
        self.temp_profile = None
        self.setup_logging(job_id)

    # -------------------------------------------------------------
    # Logging setup
    # -------------------------------------------------------------
    def setup_logging(self, job_id=None):
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        job_suffix = f"_{job_id}" if job_id else ""
        log_filename = f"damco_tracking{job_suffix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = os.path.join(log_dir, log_filename)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(log_path),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(f"DamcoTracking-{job_id}")

    # -------------------------------------------------------------
    # Driver setup (UC)
    # -------------------------------------------------------------
    def setup_driver(self):
        self.logger.info("🔧 Launching headless Chrome (private mode)...")

        self.temp_profile = tempfile.mkdtemp(prefix="damco_profile_")
        options = uc.ChromeOptions()
        if self.headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--window-size=1360,768")
        options.add_argument("--incognito")
        options.add_argument("--disable-cache")
        options.add_argument("--disable-application-cache")
        options.add_argument("--disk-cache-size=0")
        options.add_argument("--disable-plugins-discovery")
        options.add_argument("--no-first-run")
        options.add_argument("--no-default-browser-check")
        options.add_argument("--disable-extensions")
        options.add_argument("--mute-audio")
        options.add_argument("--start-maximized")
        options.add_argument("--user-data-dir=" + self.temp_profile)

        for path in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]:
            if os.path.exists(path):
                options.binary_location = path
                break

        try:
            self.driver = uc.Chrome(options=options, use_subprocess=True)
            self.wait = WebDriverWait(self.driver, 20)
            self.logger.info("✅ Chrome launched successfully (undetected + headless)")
            os.makedirs(self.output_dir, exist_ok=True)
            os.makedirs(os.path.join(self.output_dir, "pdfs"), exist_ok=True)
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to start Chrome: {e}")
            return False

    # -------------------------------------------------------------
    # Navigation + Cookie Handling
    # -------------------------------------------------------------
    def navigate_to_maersk(self):
        try:
            self.logger.info("🌐 Opening Maersk tracking portal...")
            self.driver.get("https://www.maersk.com/mymaersk-scm-track/")
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            self.logger.info("📍 Page loaded successfully.")
            return True
        except Exception as e:
            self.logger.error(f"❌ Navigation failed: {e}")
            return False

    def accept_cookies(self):
        try:
            self.logger.info("🍪 Checking cookie popup...")
            allow_btn = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-test='coi-allow-all-button']"))
            )
            allow_btn.click()
            self.logger.info("✅ Cookies accepted.")
            time.sleep(2)
        except TimeoutException:
            self.logger.info("⚠️ No cookie banner found.")
        except Exception as e:
            self.logger.warning(f"Cookie popup error: {e}")

    def close_coach_popup(self):
        try:
            got_it_btn = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-test='finishButton']"))
            )
            got_it_btn.click()
            self.logger.info("✅ Closed coach popup.")
            time.sleep(2)
        except TimeoutException:
            self.logger.info("⚠️ No coach popup found.")
        except Exception as e:
            self.logger.warning(f"Coach popup error: {e}")

    # -------------------------------------------------------------
    # Core Processing
    # -------------------------------------------------------------
    def process_booking(self, booking_number, index):
        try:
            self.logger.info(f"🔍 Processing FCR {index}: {booking_number}")
            input_box = self.wait.until(EC.presence_of_element_located((By.ID, "formInput")))
            input_box.clear()
            input_box.send_keys(booking_number)
            submit_btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-test='form-input-button']")))
            self.driver.execute_script("arguments[0].click();", submit_btn)

            # Wait for iframe
            self.wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "damco-track")))
            fcr_link = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, f"//div[@id='fcr_by_fcr_number']//a[contains(text(), '{booking_number}')]"))
            )
            fcr_link.click()
            time.sleep(5)

            pdf_filename = f"{index:03d}_{booking_number}_tracking.pdf"
            pdf_path = os.path.join(self.output_dir, "pdfs", pdf_filename)

            pdf_data = self.driver.execute_cdp_cmd("Page.printToPDF", {
                "format": "A4",
                "printBackground": True
            })
            with open(pdf_path, "wb") as f:
                f.write(base64.b64decode(pdf_data["data"]))
            self.logger.info(f"✅ PDF saved: {pdf_filename}")

            self.results.append({"fcr_number": booking_number, "status": "success", "pdf_file": pdf_filename})
            return pdf_filename
        except Exception as e:
            self.logger.error(f"❌ Error processing {booking_number}: {e}")
            self.results.append({"fcr_number": booking_number, "status": "error", "error": str(e)})
            return None
        finally:
            self.driver.switch_to.default_content()

    # -------------------------------------------------------------
    # File Reading
    # -------------------------------------------------------------
    def read_booking_numbers_from_file(self, file_path):
        try:
            ext = os.path.splitext(file_path)[1].lower()
            if ext == ".csv":
                df = pd.read_csv(file_path)
            elif ext in [".xls", ".xlsx"]:
                df = pd.read_excel(file_path, engine="openpyxl")
            else:
                raise ValueError("Unsupported file type")
            col = df.columns[0]
            bookings = [str(x).strip() for x in df[col].dropna().tolist() if str(x).strip()]
            return bookings
        except Exception as e:
            self.logger.error(f"❌ Failed to read {file_path}: {e}")
            return []

    # -------------------------------------------------------------
    # Process All Bookings
    # -------------------------------------------------------------
    def process_all_bookings(self, bookings):
        pdfs, fails = [], []
        for i, b in enumerate(bookings, 1):
            pdf = self.process_booking(b, i)
            if pdf:
                pdfs.append(pdf)
            else:
                fails.append(b)
            time.sleep(2)
        return pdfs, fails

    # -------------------------------------------------------------
    # PDF Report
    # -------------------------------------------------------------
    def generate_combined_report(self, pdfs):
        if not pdfs:
            return None
        combined_filename = f"damco_tracking_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        combined_path = os.path.join(self.output_dir, combined_filename)
        merger = PdfMerger()
        for pdf in pdfs:
            path = os.path.join(self.output_dir, "pdfs", pdf)
            if os.path.exists(path):
                merger.append(path)
        merger.write(combined_path)
        merger.close()
        self.logger.info(f"✅ Combined PDF: {combined_filename}")
        return combined_filename

    # -------------------------------------------------------------
    # Cleanup
    # -------------------------------------------------------------
    def cleanup(self):
        try:
            if self.driver:
                self.driver.quit()
                self.logger.info("🔒 Browser closed.")
        except Exception as e:
            self.logger.warning(f"Error closing browser: {e}")
        if self.temp_profile and os.path.exists(self.temp_profile):
            try:
                shutil.rmtree(self.temp_profile)
                self.logger.info(f"🗑️ Temp profile cleaned: {self.temp_profile}")
            except Exception as e:
                self.logger.warning(f"Temp cleanup error: {e}")

    # -------------------------------------------------------------
    # Main runner
    # -------------------------------------------------------------
    def run_automation(self, file_path):
        try:
            if not self.setup_driver():
                return False
            if not self.navigate_to_maersk():
                return False
            self.accept_cookies()
            self.close_coach_popup()

            bookings = self.read_booking_numbers_from_file(file_path)
            pdfs, fails = self.process_all_bookings(bookings)
            combined_report = self.generate_combined_report(pdfs)

            result_files = []
            if combined_report:
                result_files.append(combined_report)
            self.result_files = result_files

            self.logger.info(f"🎉 Done. Success={len(pdfs)}, Fail={len(fails)}")
            return True
        finally:
            self.cleanup()


# -------------------------------------------------------------
# Entry Point
# -------------------------------------------------------------
def main():
    if len(sys.argv) < 4:
        print("Usage: python damco_tracking_maersk.py <input_file> <output_dir> <job_id>")
        sys.exit(1)

    file_path, output_dir, job_id = sys.argv[1], sys.argv[2], sys.argv[3]
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    automation = DamcoTrackingAutomation(headless=True, output_dir=output_dir, job_id=job_id)
    ok = automation.run_automation(file_path)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
