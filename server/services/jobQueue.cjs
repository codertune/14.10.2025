const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { DatabaseService } = require('../database.cjs');

class JobQueue {
  constructor() {
    this.processing = new Map();
    this.maxConcurrent = 3;
  }

  async submitJob(userId, serviceId, uploadedFile, serviceName, creditsUsed, additionalFiles = {}) {
    try {
      const scriptMap = {
        'damco-tracking-maersk': 'damco_tracking_maersk.py',
        'ctg-port-tracking': 'ctg_port_tracking.py',
        'egm-download': 'egm_download.py',
        'exp-search': 'bb_exp_search.py',
        'rex-soo-submission': 'rex_submission.py'
      };

      const scriptName = scriptMap[serviceId];
      if (!scriptName) {
        throw new Error(`No automation script found for service: ${serviceId}`);
      }

      const jobId = uuidv4();
      const inputFilePath = uploadedFile.path;
      const inputFileName = uploadedFile.filename;
      const outputDirectory = path.join(__dirname, '../../results', `job_${jobId}`);

      fs.mkdirSync(outputDirectory, { recursive: true });
      fs.mkdirSync(path.join(outputDirectory, 'pdfs'), { recursive: true });

      // Handle REX service ZIP file extraction
      let pdfDirectory = null;
      if (serviceId === 'rex-soo-submission' && additionalFiles.zipFile) {
        const AdmZip = require('adm-zip');
        pdfDirectory = path.join(outputDirectory, 'extracted_pdfs');
        fs.mkdirSync(pdfDirectory, { recursive: true });

        try {
          console.log(`[${jobId}] 📦 Extracting ZIP file: ${additionalFiles.zipFile.filename}`);
          const zip = new AdmZip(additionalFiles.zipFile.path);
          zip.extractAllTo(pdfDirectory, true);
          console.log(`[${jobId}] ✅ ZIP extracted to: ${pdfDirectory}`);

          const extractedFiles = fs.readdirSync(pdfDirectory);
          console.log(`[${jobId}] 📄 Extracted ${extractedFiles.length} files:`, extractedFiles);
        } catch (zipError) {
          console.error(`[${jobId}] ❌ ZIP extraction failed:`, zipError);
          throw new Error(`Failed to extract ZIP file: ${zipError.message}`);
        }
      }

      await DatabaseService.createJob({
        id: jobId,
        user_id: userId,
        service_id: serviceId,
        service_name: serviceName,
        input_file_path: inputFilePath,
        input_file_name: inputFileName,
        output_directory: outputDirectory,
        credits_used: creditsUsed,
        status: 'queued',
        priority: 1
      });

      const queuePosition = await DatabaseService.getQueuePosition(jobId);

      const shouldStartImmediately = this.processing.size < this.maxConcurrent;

      if (shouldStartImmediately) {
        this.processJob(jobId, serviceId, scriptName, inputFilePath, outputDirectory, userId, pdfDirectory).catch(console.error);
      }

      return {
        jobId,
        status: shouldStartImmediately ? 'processing' : 'queued',
        immediate: shouldStartImmediately,
        queuePosition: shouldStartImmediately ? 0 : queuePosition
      };
    } catch (error) {
      console.error('Submit job error:', error);
      throw error;
    }
  }

  async processJob(jobId, serviceId, scriptName, inputFilePath, outputDirectory, userId, pdfDirectory = null) {
    if (this.processing.has(jobId)) {
      return;
    }

    this.processing.set(jobId, true);

    try {
      await DatabaseService.updateJobStatus(jobId, 'processing', {
        started_at: new Date()
      });

      const scriptPath = path.join(__dirname, '../../automation_scripts', scriptName);

      const result = await this.runPythonScript(scriptPath, inputFilePath, outputDirectory, jobId, serviceId, userId, pdfDirectory);

      if (result.success) {
        const resultFiles = result.resultFiles || [];
        const downloadUrl = resultFiles.length > 0
          ? `/api/download/job/${jobId}/${resultFiles[0]}`
          : null;

        await DatabaseService.updateJobStatus(jobId, 'completed', {
          completed_at: new Date(),
          result_files: resultFiles,
          download_url: downloadUrl
        });

        console.log(`[${jobId}] ✅ Job completed successfully`);
        console.log(`[${jobId}] 📁 Result files:`, resultFiles);
        console.log(`[${jobId}] 🔗 Download URL:`, downloadUrl);

        const job = await DatabaseService.getJob(jobId);
        if (job) {
          const pdfFiles = resultFiles.filter(f => f.startsWith('pdfs/') && f.endsWith('.pdf'));
          const filesGeneratedCount = pdfFiles.length;

          console.log(`[${jobId}] 📊 Creating work history entry with ${filesGeneratedCount} PDF files`);

          try {
            await DatabaseService.addWorkHistory(job.user_id, {
              serviceId: job.service_id,
              serviceName: job.service_name,
              fileName: job.input_file_name,
              creditsUsed: parseFloat(job.credits_used),
              status: 'completed',
              resultFiles: resultFiles,
              downloadUrl: downloadUrl,
              filesGeneratedCount: filesGeneratedCount
            });
            console.log(`[${jobId}] ✅ Work history entry created successfully`);
          } catch (workHistoryError) {
            console.error(`[${jobId}] ⚠️ Failed to create work history entry:`, workHistoryError);
          }
        }
      } else {
        await DatabaseService.updateJobStatus(jobId, 'failed', {
          completed_at: new Date(),
          error_message: result.error || 'Unknown error'
        });

        const job = await DatabaseService.getJob(jobId);
        if (job) {
          await DatabaseService.refundCredits(job.user_id, job.credits_used);
        }

        console.error(`[${jobId}] ❌ Job failed:`, result.error);
      }
    } catch (error) {
      console.error(`[${jobId}] ❌ Job processing error:`, error);

      await DatabaseService.updateJobStatus(jobId, 'failed', {
        completed_at: new Date(),
        error_message: error.message
      });

      const job = await DatabaseService.getJob(jobId);
      if (job) {
        await DatabaseService.refundCredits(job.user_id, job.credits_used);
      }
    } finally {
      this.processing.delete(jobId);
      this.processNextInQueue(serviceId, userId);
    }
  }

  async runPythonScript(scriptPath, inputFilePath, outputDirectory, jobId, serviceId, userId, pdfDirectory = null) {
    return new Promise(async (resolve) => {
      console.log(`[${jobId}] 🚀 Starting Python script: ${scriptPath}`);
      console.log(`[${jobId}] 📁 Input file: ${inputFilePath}`);
      console.log(`[${jobId}] 📂 Output directory: ${outputDirectory}`);

      const env = {
        ...process.env,
        PYTHONUNBUFFERED: '1'
      };

      let args = [scriptPath, inputFilePath, outputDirectory, jobId];

      // For REX service, add PDF directory
      if (serviceId === 'rex-soo-submission' && pdfDirectory) {
        args.push(pdfDirectory);
        console.log(`[${jobId}] 📦 PDF directory: ${pdfDirectory}`);
      }

      // Check if service requires credentials
      const credentialRequiredServices = ['exp-search', 'rex-soo-submission'];
      if (credentialRequiredServices.includes(serviceId)) {
        try {
          const portalNameMap = {
            'exp-search': 'bangladesh_bank_exp',
            'rex-soo-submission': 'epb_export_tracker'
          };
          const portalName = portalNameMap[serviceId];
          const credentials = await DatabaseService.getPortalCredentials(userId, portalName);

          if (!credentials) {
            console.error(`[${jobId}] ❌ No credentials found for portal: ${portalName}`);
            resolve({
              success: false,
              error: 'Portal credentials not configured. Please configure your Bangladesh Bank credentials in the dashboard.'
            });
            return;
          }

          console.log(`[${jobId}] 🔑 Using stored credentials for user: ${credentials.username}`);
          args.push(credentials.username, credentials.password);
        } catch (error) {
          console.error(`[${jobId}] ❌ Error fetching credentials:`, error);
          resolve({
            success: false,
            error: 'Failed to retrieve portal credentials. Please try again.'
          });
          return;
        }
      }

      const pythonProcess = spawn('python3', args, { env });

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        const text = data.toString();
        outputData += text;
        console.log(`[${jobId}]`, text.trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorData += text;
        console.error(`[${jobId}]`, text.trim());
      });

      pythonProcess.on('close', (code) => {
        console.log(`[${jobId}] 🏁 Python process exited with code ${code}`);

        if (code === 0) {
          const resultFiles = this.scanResultFiles(outputDirectory, jobId);

          console.log(`[${jobId}] 📁 Result files:`, resultFiles);
          console.log(`[${jobId}] 📊 PDF count from pdfs folder:`,
            fs.existsSync(path.join(outputDirectory, 'pdfs'))
              ? fs.readdirSync(path.join(outputDirectory, 'pdfs')).length
              : 0
          );

          resolve({
            success: true,
            resultFiles: resultFiles,
            output: outputData
          });
        } else if (code === 2) {
          // Exit code 2 means invalid credentials
          console.error(`[${jobId}] ❌ Invalid portal credentials`);

          // Create notification for credential failure
          DatabaseService.createNotification(
            userId,
            'credential_failure',
            'Portal Credentials Invalid',
            'Your Bangladesh Bank EXP portal credentials are invalid or have expired. Please update them to continue using automation services.',
            {
              portalName: 'bangladesh_bank_exp',
              jobId: jobId,
              actionUrl: '/dashboard?tab=credentials',
              actionLabel: 'Update Credentials'
            }
          ).catch(err => console.error(`[${jobId}] Failed to create credential failure notification:`, err));

          // Update credential failure tracking
          DatabaseService.updateCredentialTestResult(userId, 'bangladesh_bank_exp', false)
            .catch(err => console.error(`[${jobId}] Failed to update credential test result:`, err));

          resolve({
            success: false,
            error: 'Invalid portal credentials. Please update your Bangladesh Bank login credentials and try again.',
            invalidCredentials: true
          });
        } else {
          let userFriendlyError = errorData || `Script exited with code ${code}`;

          if (errorData.includes('This version of ChromeDriver only supports Chrome version')) {
            userFriendlyError = 'Browser compatibility issue detected. The automation system is attempting to resolve this automatically. Please try again in a few moments.';
          } else if (errorData.includes('SessionNotCreatedException')) {
            userFriendlyError = 'Unable to start browser session. Please contact support if this persists.';
          } else if (errorData.includes('Invalid Login Credentials')) {
            userFriendlyError = 'Invalid portal credentials. Please update your Bangladesh Bank login credentials and try again.';
          }

          resolve({
            success: false,
            error: userFriendlyError
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`[${jobId}] ❌ Process error:`, error);
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  scanResultFiles(outputDirectory, jobId) {
    const resultFiles = [];
    const allFiles = [];

    try {
      if (fs.existsSync(outputDirectory)) {
        const mainFiles = fs.readdirSync(outputDirectory)
          .filter(f => f.endsWith('.pdf') || f.endsWith('.json') || f.endsWith('.txt'))
          .map(f => ({ name: f, path: path.join(outputDirectory, f), prefix: '' }));

        allFiles.push(...mainFiles);
      }

      const pdfsDir = path.join(outputDirectory, 'pdfs');
      if (fs.existsSync(pdfsDir)) {
        const pdfFiles = fs.readdirSync(pdfsDir)
          .filter(f => f.endsWith('.pdf'))
          .map(f => ({ name: f, path: path.join(pdfsDir, f), prefix: 'pdfs/' }));

        allFiles.push(...pdfFiles);
      }

      const sortedFiles = allFiles.sort((a, b) => {
        const aIsCombinedReport = a.name.includes('_report_') && a.name.endsWith('.pdf');
        const bIsCombinedReport = b.name.includes('_report_') && b.name.endsWith('.pdf');

        if (aIsCombinedReport && !bIsCombinedReport) return -1;
        if (!aIsCombinedReport && bIsCombinedReport) return 1;

        const aIsPdf = a.name.endsWith('.pdf');
        const bIsPdf = b.name.endsWith('.pdf');

        if (aIsPdf && !bIsPdf) return -1;
        if (!aIsPdf && bIsPdf) return 1;

        const statA = fs.statSync(a.path);
        const statB = fs.statSync(b.path);
        return statB.mtimeMs - statA.mtimeMs;
      });

      resultFiles.push(...sortedFiles.map(f => f.prefix + f.name));

    } catch (error) {
      console.error(`[${jobId}] ❌ Error scanning result files:`, error);
    }

    return resultFiles;
  }

  async processNextInQueue(serviceId, userId) {
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    try {
      const nextJob = await DatabaseService.getNextQueuedJob(serviceId);

      if (nextJob) {
        const scriptMap = {
          'damco-tracking-maersk': 'damco_tracking_maersk.py',
          'ctg-port-tracking': 'ctg_port_tracking.py',
          'egm-download': 'egm_download.py',
          'exp-search': 'bb_exp_search.py'
        };

        const scriptName = scriptMap[nextJob.service_id];
        if (scriptName) {
          this.processJob(
            nextJob.id,
            nextJob.service_id,
            scriptName,
            nextJob.input_file_path,
            nextJob.output_directory,
            nextJob.user_id
          ).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Process next in queue error:', error);
    }
  }

  getStatus() {
    return {
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      activeJobs: Array.from(this.processing.keys())
    };
  }
}

const jobQueueInstance = new JobQueue();

module.exports = jobQueueInstance;
