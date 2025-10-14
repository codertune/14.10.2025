#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CTG Port Authority Tracking Automation (Headless + Private + Auto Driver)
Author: Izaz Ahamed
-------------------------------------------------------------
✅ Runs headless with undetected_chromedriver
✅ Always starts in private (incognito) mode
✅ Auto PDF export per container + combined report
✅ Handles popups, alerts, and summary reports
✅ Works on Linux VPS (Ubuntu) with Chrome installed
"""

import os, sys, time, logging, base64, tempfile, shutil, json
import pandas as pd
from datetime import datetime
from PyPDF2 import PdfMerger
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoAlertPresentException

class CtgPortTrackingAutomation:
    def __init__(self, headless=True, output_dir='results', job_id=None):
        self.headless = headless
        self.output_dir = output_dir
        self.job_id = job_id
        self.driver = None
        self.wait = None
        self.results = []
        self.result_files = []
        self.base_url = "https://cpatos.gov.bd/pcs/"
        self.temp_profile = None
        self.setup_logging(job_id)

    # -------------------------------------------------------------
    def setup_logging(self, job_id=None):
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        job_suffix = f"_{job_id}" if job_id else ""
        log_filename = f"ctg_port_tracking{job_suffix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = os.path.join(log_dir, log_filename)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[logging.FileHandler(log_path), logging.StreamHandler(sys.stdout)]
        )
        self.logger = logging.getLogger(f"CtgPortTracking-{job_id}")

    # -------------------------------------------------------------
    def setup_driver(self):
        self.logger.info("🔧 Launching headless Chrome (private mode)...")

        self.temp_profile = tempfile.mkdtemp(prefix="ctg_profile_")
        opts = uc.ChromeOptions()
        if self.headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument("--window-size=1360,768")
        opts.add_argument("--incognito")
        opts.add_argument("--disable-cache")
        opts.add_argument("--disable-application-cache")
        opts.add_argument("--disk-cache-size=0")
        opts.add_argument("--disable-plugins-discovery")
        opts.add_argument("--no-first-run")
        opts.add_argument("--no-default-browser-check")
        opts.add_argument("--mute-audio")
        opts.add_argument("--disable-extensions")
        opts.add_argument("--user-data-dir=" + self.temp_profile)

        for path in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]:
            if os.path.exists(path):
                opts.binary_location = path
                break

        try:
            self.driver = uc.Chrome(options=opts, use_subprocess=True)
            self.wait = WebDriverWait(self.driver, 20)
            os.makedirs(self.output_dir, exist_ok=True)
            os.makedirs(os.path.join(self.output_dir, "pdfs"), exist_ok=True)
            self.logger.info("✅ Chrome started successfully (undetected, headless, incognito)")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to launch Chrome: {e}")
            return False

    # -------------------------------------------------------------
    def navigate_to_portal(self):
        try:
            self.logger.info("🌐 Navigating to CTG Port Authority portal...")
            self.driver.get(self.base_url)
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            self.logger.info("📍 Portal loaded successfully.")
            return True
        except Exception as e:
            self.logger.error(f"❌ Navigation failed: {e}")
            return False

    # -------------------------------------------------------------
    def handle_alert(self):
        try:
            alert = self.driver.switch_to.alert
            text = alert.text
            self.logger.warning(f"⚠️ Alert detected: {text}")
            alert.accept()
            self.logger.info("✅ Alert dismissed.")
            return True
        except NoAlertPresentException:
            return False
        except Exception as e:
            self.logger.warning(f"Alert handling error: {e}")
            return False

    # -------------------------------------------------------------
    def process_container(self, container_number, index):
        try:
            self.logger.info(f"🔍 Processing container {index}: {container_number}")
            self.driver.get(self.base_url)
            time.sleep(2)

            input_field = self.wait.until(EC.presence_of_element_located((By.ID, "containerLocation")))
            input_field.clear()
            input_field.send_keys(container_number)

            submit_btn = self.wait.until(EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "input[type='submit'][value='Search']#submit")))
            submit_btn.click()
            time.sleep(2)
            self.handle_alert()

            all_windows = self.driver.window_handles
            original_window = self.driver.current_window_handle

            if len(all_windows) > 1:
                for w in all_windows:
                    if w != original_window:
                        self.driver.switch_to.window(w)
                        break
            time.sleep(5)

            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            pdf_filename = f"{index:03d}_{container_number}_tracking.pdf"
            pdf_path = os.path.join(self.output_dir, "pdfs", pdf_filename)

            pdf_data = self.driver.execute_cdp_cmd("Page.printToPDF", {
                "format": "A4",
                "printBackground": True,
                "marginTop": 0.4,
                "marginBottom": 0.4,
                "marginLeft": 0.4,
                "marginRight": 0.4
            })
            with open(pdf_path, "wb") as f:
                f.write(base64.b64decode(pdf_data["data"]))

            self.logger.info(f"✅ PDF saved: {pdf_filename}")

            if len(all_windows) > 1:
                self.driver.close()
                self.driver.switch_to.window(original_window)

            self.results.append({
                "container_number": container_number,
                "status": "success",
                "pdf_file": pdf_filename,
                "timestamp": datetime.now().isoformat()
            })
            return pdf_filename

        except Exception as e:
            self.logger.error(f"❌ Error for {container_number}: {e}")
            self.results.append({
                "container_number": container_number,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            return None

    # -------------------------------------------------------------
    def read_container_file(self, file_path):
        try:
            ext = os.path.splitext(file_path)[1].lower()
            df = pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)
            col = df.columns[0]
            containers = [str(x).strip() for x in df[col].dropna().tolist() if str(x).strip()]
            return containers
        except Exception as e:
            self.logger.error(f"❌ Failed to read file: {e}")
            return []

    # -------------------------------------------------------------
    def process_all(self, containers):
        success, fail = [], []
        for i, c in enumerate(containers, 1):
            pdf = self.process_container(c, i)
            (success if pdf else fail).append(c)
            time.sleep(2)
        return success, fail

    # -------------------------------------------------------------
    def generate_combined_report(self, pdfs):
        if not pdfs:
            return None
        combined_name = f"ctg_port_tracking_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        combined_path = os.path.join(self.output_dir, combined_name)
        merger = PdfMerger()
        for pdf in pdfs:
            path = os.path.join(self.output_dir, "pdfs", pdf)
            if os.path.exists(path):
                merger.append(path)
        merger.write(combined_path)
        merger.close()
        self.logger.info(f"✅ Combined PDF saved: {combined_name}")
        return combined_name

    # -------------------------------------------------------------
    def cleanup(self):
        try:
            if self.driver:
                self.driver.quit()
                self.logger.info("🔒 Browser closed.")
        except Exception as e:
            self.logger.warning(f"Cleanup error: {e}")
        if self.temp_profile and os.path.exists(self.temp_profile):
            try:
                shutil.rmtree(self.temp_profile)
                self.logger.info(f"🗑️ Cleaned profile: {self.temp_profile}")
            except Exception as e:
                self.logger.warning(f"Temp cleanup error: {e}")

    # -------------------------------------------------------------
    def run(self, file_path):
        try:
            if not self.setup_driver():
                return False
            if not self.navigate_to_portal():
                return False

            containers = self.read_container_file(file_path)
            if not containers:
                self.logger.error("No container numbers found.")
                return False

            success, fail = self.process_all(containers)
            combined = self.generate_combined_report(
                [f"{i+1:03d}_{c}_tracking.pdf" for i, c in enumerate(success)]
            )
            self.logger.info(f"🎉 Done. Success={len(success)} Fail={len(fail)}")
            return True
        finally:
            self.cleanup()


def main():
    if len(sys.argv) < 4:
        print("Usage: python ctg_port_tracking.py <input_file> <output_dir> <job_id>")
        sys.exit(1)

    file_path, output_dir, job_id = sys.argv[1], sys.argv[2], sys.argv[3]
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    app = CtgPortTrackingAutomation(headless=True, output_dir=output_dir, job_id=job_id)
    ok = app.run(file_path)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
