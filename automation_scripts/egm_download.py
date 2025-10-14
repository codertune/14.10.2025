#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bangladesh Customs Bill Tracking Automation (Headless VPS + Private Mode)
Author : Izaz Ahamed
-----------------------------------------------------------------------
✅ Headless Chrome (Linux VPS)
✅ Private (Incognito) mode — no history, no cache, no cookies
✅ Retry + requeue failed rows (never skip)
✅ Screenshot + HTML debug on failure
✅ Audio reCAPTCHA solving supported
✅ 1360×768 consistent screenshot → PDF
✅ Exports failed_rows.csv for Smart Process Flow requeue
"""

import os, sys, time, random, tempfile, logging, urllib.request, shutil, pandas as pd
from fpdf import FPDF
from PIL import Image
from PyPDF2 import PdfMerger
import pydub

# -----------------------------------------------------------------------------
# OPTIONAL: SpeechRecognition (for audio challenge)
# -----------------------------------------------------------------------------
try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False
    print("⚠️ SpeechRecognition not installed — audio challenge skipped.")

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
URL = "https://customs.gov.bd/portal/services/billTracking/billTracking.jsf"
WAIT_TIMEOUT = 25
MAX_ATTEMPTS = 3
MAX_ROW_RETRIES = 3

if len(sys.argv) < 3:
    print("❌ Usage: python3 egm_download.py <input_file> <output_dir> [job_id]")
    sys.exit(1)

INPUT_FILE = sys.argv[1]
OUTPUT_DIR = sys.argv[2]
JOB_ID = sys.argv[3] if len(sys.argv) > 3 else "unknown"
PDFS_DIR = os.path.join(OUTPUT_DIR, "pdfs")
SCREENSHOT_DIR = os.path.join(OUTPUT_DIR, "screenshots")
FAILED_CSV = os.path.join(OUTPUT_DIR, f"failed_rows_{JOB_ID}.csv")

# -----------------------------------------------------------------------------
# LOGGING
# -----------------------------------------------------------------------------
logger = logging.getLogger("EgmDownload-" + JOB_ID)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logger.info("📁 Input: %s", INPUT_FILE)
logger.info("📂 Output: %s", OUTPUT_DIR)
logger.info("🆔 Job ID: %s", JOB_ID)

# -----------------------------------------------------------------------------
# ENVIRONMENT CHECK
# -----------------------------------------------------------------------------
FFMPEG_PATH = shutil.which("ffmpeg")
if FFMPEG_PATH:
    logger.info("🎧 FFmpeg found at: %s", FFMPEG_PATH)
else:
    logger.warning("⚠️ FFmpeg not found — audio challenge may fail.")

# -----------------------------------------------------------------------------
# DEBUG SAVE HELPERS
# -----------------------------------------------------------------------------
def save_debug(driver, name):
    """Save screenshot and HTML for debugging"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    try:
        png = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        driver.save_screenshot(png)
        logger.info("📸 Screenshot saved: %s", png)
    except Exception as e:
        logger.error("❌ Screenshot failed: %s", e)
    try:
        html = os.path.join(SCREENSHOT_DIR, f"{name}.html")
        with open(html, "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        logger.info("📝 HTML saved: %s", html)
    except Exception as e:
        logger.error("❌ HTML save failed: %s", e)

# -----------------------------------------------------------------------------
# DRIVER SETUP
# -----------------------------------------------------------------------------
def setup_driver():
    """Launch undetected Chrome (headless, private mode)"""
    opts = uc.ChromeOptions()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1360,768")

    # ✅ Private mode
    opts.add_argument("--incognito")
    opts.add_argument("--disable-application-cache")
    opts.add_argument("--disk-cache-size=0")
    opts.add_argument("--disable-cache")
    opts.add_argument("--disable-plugins-discovery")
    opts.add_argument("--no-first-run")
    opts.add_argument("--no-default-browser-check")

    for path in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]:
        if os.path.exists(path):
            opts.binary_location = path
            break

    driver = uc.Chrome(options=opts, use_subprocess=True)
    logger.info("🧩 Chrome launched in PRIVATE mode (no cache/history)")
    return driver

# -----------------------------------------------------------------------------
# RECAPTCHA SOLVER
# -----------------------------------------------------------------------------
class RecaptchaSolver:
    def __init__(self, driver):
        self.driver = driver

    def is_solved(self):
        try:
            self.driver.switch_to.default_content()
            iframe = self.driver.find_element(By.CSS_SELECTOR, "iframe[title*='reCAPTCHA']")
            self.driver.switch_to.frame(iframe)
            anchor = self.driver.find_element(By.ID, "recaptcha-anchor")
            checked = anchor.get_attribute("aria-checked") == "true" or \
                      "recaptcha-checkbox-checked" in anchor.get_attribute("class")
            self.driver.switch_to.default_content()
            return checked
        except Exception:
            self.driver.switch_to.default_content()
            return False

    def _solve_audio_challenge(self, wait):
        """Handle audio challenge via SpeechRecognition"""
        attempt = 0
        while True:
            attempt += 1
            try:
                audio_src = wait.until(EC.presence_of_element_located((By.ID, "audio-source"))).get_attribute("src")
                logger.info("🎵 Audio challenge %d: %s", attempt, audio_src)
                mp3 = os.path.join(tempfile.gettempdir(), f"captcha_{attempt}.mp3")
                wav = os.path.join(tempfile.gettempdir(), f"captcha_{attempt}.wav")
                urllib.request.urlretrieve(audio_src, mp3)
                pydub.AudioSegment.from_mp3(mp3).export(wav, format="wav")

                if not SR_AVAILABLE:
                    raise RuntimeError("SpeechRecognition not available")

                recog = sr.Recognizer()
                with sr.AudioFile(wav) as s:
                    audio = recog.record(s)
                text = recog.recognize_google(audio)
                logger.info("🗣️ Recognized text: %s", text)

                input_box = wait.until(EC.presence_of_element_located((By.ID, "audio-response")))
                input_box.clear()
                input_box.send_keys(text.lower())
                verify = wait.until(EC.element_to_be_clickable((By.ID, "recaptcha-verify-button")))
                self.driver.execute_script("arguments[0].click();", verify)
                time.sleep(3)

                error_msgs = self.driver.find_elements(By.CSS_SELECTOR, ".rc-audiochallenge-error-message")
                if any("Multiple correct solutions required" in e.text for e in error_msgs):
                    logger.info("🔁 Multiple audio required — solving next challenge...")
                    continue

                self.driver.switch_to.default_content()
                if self.is_solved():
                    logger.info("✅ reCAPTCHA solved via audio after %d attempt(s)", attempt)
                    return True
            except Exception as e:
                logger.error("❌ Audio challenge failed: %s", e)
                save_debug(self.driver, f"audio_fail_{attempt}")
                break
        return False

    def solveCaptcha(self):
        wait = WebDriverWait(self.driver, WAIT_TIMEOUT)
        self.driver.switch_to.default_content()

        # Click checkbox
        try:
            iframe = self.driver.find_element(By.CSS_SELECTOR, "iframe[title*='reCAPTCHA']")
            self.driver.switch_to.frame(iframe)
            box = self.driver.find_element(By.CLASS_NAME, "recaptcha-checkbox-border")
            box.click()
            time.sleep(2)
            self.driver.switch_to.default_content()
            if self.is_solved():
                logger.info("✅ reCAPTCHA checkbox solved.")
                return
        except Exception:
            self.driver.switch_to.default_content()

        # Fallback to audio
        logger.info("🎧 Fallback to audio challenge...")
        try:
            challenge_iframe = wait.until(EC.presence_of_element_located(
                (By.CSS_SELECTOR, "iframe[title*='recaptcha challenge']")
            ))
            self.driver.switch_to.frame(challenge_iframe)
            audio_btn = wait.until(EC.element_to_be_clickable((By.ID, "recaptcha-audio-button")))
            self.driver.execute_script("arguments[0].click();", audio_btn)
            time.sleep(2)
            self._solve_audio_challenge(wait)
        except Exception as e:
            logger.error("❌ Could not launch audio challenge: %s", e)
            save_debug(self.driver, "audio_init_fail")

# -----------------------------------------------------------------------------
# BILL FETCH
# -----------------------------------------------------------------------------
def fetch_bill_status(driver, solver, office, serial, number, year):
    wait = WebDriverWait(driver, WAIT_TIMEOUT)
    driver.get(URL)
    Select(wait.until(EC.presence_of_element_located((By.ID, "formAct:customOfficeCode")))).select_by_value(str(office))
    driver.find_element(By.ID, "formAct:billEntrySerial").send_keys(str(serial))
    driver.find_element(By.ID, "formAct:billEntryNumber").send_keys(str(number))
    Select(driver.find_element(By.ID, "formAct:billEntryYear")).select_by_value(str(year))

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            logger.info("🔐 Solving reCAPTCHA (Attempt %d)…", attempt)
            solver.solveCaptcha()
            break
        except Exception as e:
            logger.warning("Attempt %d failed: %s", attempt, e)
            save_debug(driver, f"captcha_fail_{serial}_{number}_{year}_try{attempt}")
            if attempt == MAX_ATTEMPTS:
                raise

    btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Retrieve B/E Status']")))
    driver.execute_script("arguments[0].click();", btn)
    logger.info("🖱️ Clicked 'Retrieve B/E Status'")
    time.sleep(3)

    os.makedirs(PDFS_DIR, exist_ok=True)
    pdf_path = os.path.join(PDFS_DIR, f"{office}_{serial}_{number}_{year}.pdf")
    tmp_png = os.path.join(tempfile.gettempdir(), f"{office}_{serial}_{number}_{year}.png")

    driver.save_screenshot(tmp_png)
    Image.open(tmp_png).convert("RGB").save(pdf_path, "PDF", resolution=100.0)
    logger.info("📄 PDF saved: %s", pdf_path)

    try:
        back_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='BACK TO MAIN PAGE']")))
        driver.execute_script("arguments[0].click();", back_btn)
        time.sleep(2)
    except Exception:
        pass

    return pdf_path

# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------
def main():
    if not os.path.exists(INPUT_FILE):
        logger.error("❌ Missing input file: %s", INPUT_FILE)
        return 1

    df = pd.read_csv(INPUT_FILE)
    generated, failed = [], []

    jobs = [
        (row["customOfficeCode"], row["billEntrySerial"], row["billEntryNumber"], row["billEntryYear"])
        for _, row in df.iterrows()
    ]

    logger.info("🚀 Starting automation for %d entries…", len(jobs))
    driver = setup_driver()
    solver = RecaptchaSolver(driver)

    while jobs:
        office, serial, number, year = jobs.pop(0)
        attempt = 1
        while attempt <= MAX_ROW_RETRIES:
            logger.info("\n%s\nProcessing %s-%s-%s (Attempt %d)\n%s", "="*50, serial, number, year, attempt, "="*50)
            try:
                pdf = fetch_bill_status(driver, solver, office, serial, number, year)
                if pdf:
                    generated.append(pdf)
                    break
            except Exception as e:
                logger.error("❌ Error: %s", e)
                save_debug(driver, f"fail_{serial}_{number}_{year}_try{attempt}")
                if attempt == MAX_ROW_RETRIES:
                    failed.append((office, serial, number, year))
                else:
                    logger.info("🔁 Retrying row (%d/%d)...", attempt, MAX_ROW_RETRIES)
                    try: driver.quit()
                    except: pass
                    driver = setup_driver()
                    solver = RecaptchaSolver(driver)
            attempt += 1

        if attempt > MAX_ROW_RETRIES and (office, serial, number, year) in failed:
            jobs.append((office, serial, number, year))
            logger.info("⏳ Row requeued: %s-%s-%s", serial, number, year)

    driver.quit()

    # Combine all PDFs
    if generated:
        merger = PdfMerger()
        for pdf in generated:
            if pdf and os.path.exists(pdf):
                merger.append(pdf)
        combined = os.path.join(OUTPUT_DIR, f"egm_bill_tracking_report_{JOB_ID}.pdf")
        merger.write(combined)
        merger.close()
        logger.info("✅ Combined PDF saved: %s", combined)
    else:
        logger.warning("⚠️ No PDFs generated.")

    # Save failed rows CSV
    if failed:
        pd.DataFrame(failed, columns=["customOfficeCode", "billEntrySerial", "billEntryNumber", "billEntryYear"]).to_csv(
            FAILED_CSV, index=False
        )
        logger.warning("⚠️ %d rows failed after retries. Saved to %s", len(failed), FAILED_CSV)

    logger.info("🎉 Completed successfully!")
    return 0


if __name__ == "__main__":
    main()