const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const csvParser = require('csv-parser');
const { Pool } = require('pg');

let pool;

function setPool(dbPool) {
  pool = dbPool;
}

class RexSooService {
  static async extractZipFile(zipFilePath, userId) {
    const uploadId = Date.now().toString();
    const extractPath = path.join(__dirname, '../uploads/rex-temp', userId, uploadId);

    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries();

      const pdfFiles = [];

      zipEntries.forEach(entry => {
        if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.pdf')) {
          const fileName = path.basename(entry.entryName);
          const filePath = path.join(extractPath, fileName);

          zip.extractEntryTo(entry, extractPath, false, true);

          const stats = fs.statSync(filePath);
          pdfFiles.push({
            filename: fileName,
            path: filePath,
            size: stats.size,
            extractedName: entry.entryName
          });
        }
      });

      return {
        success: true,
        uploadId,
        extractPath,
        files: pdfFiles,
        totalFiles: pdfFiles.length
      };
    } catch (error) {
      console.error('ZIP extraction error:', error);
      throw new Error(`Failed to extract ZIP file: ${error.message}`);
    }
  }

  static async parseCSVFile(csvFilePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          const validatedRow = this.validateCSVRow(row);
          if (validatedRow.errors.length > 0) {
            errors.push({
              row: results.length + 1,
              errors: validatedRow.errors,
              data: row
            });
          }
          results.push(validatedRow.data);
        })
        .on('end', () => {
          resolve({
            success: true,
            rows: results,
            totalRows: results.length,
            errors: errors
          });
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        });
    });
  }

  static validateCSVRow(row) {
    const errors = [];
    const requiredFields = ['RexImporterId', 'BLNo', 'InvoiceNo'];

    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      data: {
        rex_importer_id: row.RexImporterId,
        destination_country_id: row.DestinationCountryId,
        freight_route: row.FreightRoute,
        bl_no: row.BLNo,
        bl_date: this.parseDate(row.BLDate),
        container_no: row.ContainerNo,
        ad_code: row.AdCode,
        serial: row.Serial,
        year: row.Year,
        exp_date: this.parseDate(row.EXPDate),
        bill_of_export_no: row.BillOfExportNo,
        bill_of_export_date: this.parseDate(row.BillOfExportDate),
        hs_code: row.HSCode,
        quantity: parseFloat(row.Quantity) || 0,
        unit_type: row.UnitType,
        invoice_no: row.InvoiceNo,
        invoice_date: this.parseDate(row.InvoiceDate),
        currency: row.Currency,
        invoice_value: parseFloat(row.InvoiceValue) || 0,
        declaration_date: this.parseDate(row.DeclarationDate)
      },
      errors
    };
  }

  static parseDate(dateString) {
    if (!dateString) return null;

    const formats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        if (format.source.startsWith('^\\(\\d\\{4\\}')) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          return `${year}-${month}-${day}`;
        }
      }
    }

    return dateString;
  }

  static matchDocuments(csvRows, pdfFiles) {
    const matches = [];

    csvRows.forEach((row, index) => {
      const blNo = row.bl_no ? row.bl_no.trim() : '';
      const invoiceNo = row.invoice_no ? row.invoice_no.trim() : '';

      const blPattern = new RegExp(blNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const invoicePattern = new RegExp(invoiceNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const blDoc = pdfFiles.find(file => blPattern.test(file.filename));
      const invoiceDoc = pdfFiles.find(file => invoicePattern.test(file.filename));

      matches.push({
        rowIndex: index,
        rowData: row,
        blDocument: blDoc ? {
          filename: blDoc.filename,
          path: blDoc.path,
          size: blDoc.size
        } : null,
        invoiceDocument: invoiceDoc ? {
          filename: invoiceDoc.filename,
          path: invoiceDoc.path,
          size: invoiceDoc.size
        } : null,
        hasAllDocuments: !!(blDoc && invoiceDoc),
        missing: []
      });

      if (!blDoc) matches[index].missing.push('BL');
      if (!invoiceDoc) matches[index].missing.push('Invoice');
    });

    return matches;
  }

  static async saveSubmission(userId, csvFileName, zipFileName, matches, creditCost) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const savedSubmissions = [];

      for (const match of matches) {
        if (!match.hasAllDocuments) {
          continue;
        }

        const submissionResult = await client.query(
          `INSERT INTO rex_submissions (
            user_id, rex_importer_id, destination_country_id, freight_route,
            bl_no, bl_date, container_no, ad_code, serial, year, exp_date,
            bill_of_export_no, bill_of_export_date, hs_code, quantity, unit_type,
            invoice_no, invoice_date, currency, invoice_value, declaration_date,
            status, credits_used, csv_file_name, zip_file_name
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25
          ) RETURNING id`,
          [
            userId,
            match.rowData.rex_importer_id,
            match.rowData.destination_country_id,
            match.rowData.freight_route,
            match.rowData.bl_no,
            match.rowData.bl_date,
            match.rowData.container_no,
            match.rowData.ad_code,
            match.rowData.serial,
            match.rowData.year,
            match.rowData.exp_date,
            match.rowData.bill_of_export_no,
            match.rowData.bill_of_export_date,
            match.rowData.hs_code,
            match.rowData.quantity,
            match.rowData.unit_type,
            match.rowData.invoice_no,
            match.rowData.invoice_date,
            match.rowData.currency,
            match.rowData.invoice_value,
            match.rowData.declaration_date,
            'submitted',
            creditCost,
            csvFileName,
            zipFileName
          ]
        );

        const submissionId = submissionResult.rows[0].id;

        const permanentDir = path.join(__dirname, '../uploads/rex-submissions', userId, submissionId);
        if (!fs.existsSync(permanentDir)) {
          fs.mkdirSync(permanentDir, { recursive: true });
        }

        if (match.blDocument) {
          const blDestPath = path.join(permanentDir, `bl_${match.blDocument.filename}`);
          fs.copyFileSync(match.blDocument.path, blDestPath);

          await client.query(
            `INSERT INTO rex_documents (submission_id, document_type, file_path, original_filename, file_size)
             VALUES ($1, $2, $3, $4, $5)`,
            [submissionId, 'bl', blDestPath, match.blDocument.filename, match.blDocument.size]
          );
        }

        if (match.invoiceDocument) {
          const invDestPath = path.join(permanentDir, `invoice_${match.invoiceDocument.filename}`);
          fs.copyFileSync(match.invoiceDocument.path, invDestPath);

          await client.query(
            `INSERT INTO rex_documents (submission_id, document_type, file_path, original_filename, file_size)
             VALUES ($1, $2, $3, $4, $5)`,
            [submissionId, 'invoice', invDestPath, match.invoiceDocument.filename, match.invoiceDocument.size]
          );
        }

        savedSubmissions.push({
          submissionId,
          blNo: match.rowData.bl_no,
          invoiceNo: match.rowData.invoice_no
        });
      }

      const totalCredits = savedSubmissions.length * creditCost;
      await client.query(
        'UPDATE users SET credits = credits - $1 WHERE id = $2',
        [totalCredits, userId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        totalSubmissions: savedSubmissions.length,
        totalCreditsUsed: totalCredits,
        submissions: savedSubmissions
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Save submission error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getSubmissions(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT
          s.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', d.id,
                'type', d.document_type,
                'filename', d.original_filename,
                'size', d.file_size
              )
            ) FILTER (WHERE d.id IS NOT NULL),
            '[]'
          ) as documents
        FROM rex_submissions s
        LEFT JOIN rex_documents d ON d.submission_id = s.id
        WHERE s.user_id = $1
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        success: true,
        submissions: result.rows,
        total: result.rows.length
      };
    } catch (error) {
      console.error('Get submissions error:', error);
      throw error;
    }
  }

  static async getSubmissionById(submissionId, userId) {
    try {
      const result = await pool.query(
        `SELECT
          s.*,
          json_agg(
            json_build_object(
              'id', d.id,
              'type', d.document_type,
              'filename', d.original_filename,
              'size', d.file_size,
              'path', d.file_path
            )
          ) as documents
        FROM rex_submissions s
        LEFT JOIN rex_documents d ON d.submission_id = s.id
        WHERE s.id = $1 AND s.user_id = $2
        GROUP BY s.id`,
        [submissionId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Submission not found');
      }

      return {
        success: true,
        submission: result.rows[0]
      };
    } catch (error) {
      console.error('Get submission by ID error:', error);
      throw error;
    }
  }

  static async deleteSubmission(submissionId, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const docsResult = await client.query(
        'SELECT file_path FROM rex_documents WHERE submission_id = $1',
        [submissionId]
      );

      docsResult.rows.forEach(doc => {
        if (fs.existsSync(doc.file_path)) {
          fs.unlinkSync(doc.file_path);
        }
      });

      await client.query(
        'DELETE FROM rex_submissions WHERE id = $1 AND user_id = $2',
        [submissionId, userId]
      );

      await client.query('COMMIT');

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Delete submission error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static cleanupTempFiles(extractPath) {
    try {
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = { RexSooService, setPool };
