import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2, Eye } from 'lucide-react';

interface PDFFile {
  filename: string;
  path: string;
  size: number;
}

interface CSVRow {
  rex_importer_id: string;
  destination_country_id: string;
  bl_no: string;
  invoice_no: string;
  freight_route: string;
  bl_date: string;
  invoice_date: string;
  invoice_value: number;
  [key: string]: any;
}

interface DocumentMatch {
  rowIndex: number;
  rowData: CSVRow;
  blDocument: PDFFile | null;
  invoiceDocument: PDFFile | null;
  hasAllDocuments: boolean;
  missing: string[];
}

interface Submission {
  id: string;
  rex_importer_id: string;
  destination_country_id: string;
  bl_no: string;
  invoice_no: string;
  bl_date: string;
  invoice_date: string;
  invoice_value: number;
  status: string;
  created_at: string;
  documents: Array<{
    id: string;
    type: string;
    filename: string;
    size: number;
  }>;
}

export default function RexSooSubmissionPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<PDFFile[]>([]);
  const [csvRows, setCSVRows] = useState<CSVRow[]>([]);
  const [matches, setMatches] = useState<DocumentMatch[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [uploadId, setUploadId] = useState('');
  const [extractPath, setExtractPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/api/rex-soo/submissions/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleZipUpload = async () => {
    if (!zipFile || !user) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('zipFile', zipFile);
      formData.append('userId', user.id);

      const response = await fetch('http://localhost:3001/api/rex-soo/upload-zip', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setExtractedFiles(data.files);
        setUploadId(data.uploadId);
        setExtractPath(data.extractPath);
        setMessage({ type: 'success', text: data.message });
        setStep(2);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload ZIP file' });
    } finally {
      setUploading(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await fetch('http://localhost:3001/api/rex-soo/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCSVRows(data.rows);
        setMessage({ type: 'success', text: data.message });

        const matchResponse = await fetch('http://localhost:3001/api/rex-soo/match-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csvRows: data.rows,
            pdfFiles: extractedFiles,
          }),
        });

        const matchData = await matchResponse.json();

        if (matchData.success) {
          setMatches(matchData.matches);
          setStep(3);
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process CSV file' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || matches.length === 0) return;

    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/rex-soo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          csvFileName: csvFile?.name,
          zipFileName: zipFile?.name,
          matches,
          extractPath,
          creditCost: 2.0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        resetForm();
        fetchSubmissions();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit REX SOO data' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setZipFile(null);
    setCSVFile(null);
    setExtractedFiles([]);
    setCSVRows([]);
    setMatches([]);
    setUploadId('');
    setExtractPath('');
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/rex-soo-submission-template.csv';
    link.download = 'rex-soo-submission-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const matchedCount = matches.filter(m => m.hasAllDocuments).length;
  const missingCount = matches.length - matchedCount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">REX SOO Submission</h1>
          <p className="text-gray-600">Upload CSV template with Bill of Lading and Commercial Invoice PDFs</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p>{message.text}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</span>
              Upload ZIP File
            </h2>

            <p className="text-sm text-gray-600 mb-4">Upload a ZIP file containing all BL and Invoice PDFs</p>

            <input
              type="file"
              accept=".zip"
              onChange={(e) => e.target.files && setZipFile(e.target.files[0])}
              disabled={step > 1 || uploading}
              className="mb-4 w-full text-sm"
            />

            {zipFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">{zipFile.name}</p>
                <p className="text-xs text-gray-500">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <button
              onClick={handleZipUpload}
              disabled={!zipFile || uploading || step > 1}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {uploading && step === 1 ? 'Extracting...' : 'Extract ZIP'}
            </button>

            {extractedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-green-600 mb-2">Extracted {extractedFiles.length} PDFs</p>
                <div className="max-h-32 overflow-y-auto text-xs text-gray-600">
                  {extractedFiles.slice(0, 5).map((file, i) => (
                    <div key={i} className="py-1">{file.filename}</div>
                  ))}
                  {extractedFiles.length > 5 && <div className="py-1">... and {extractedFiles.length - 5} more</div>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</span>
              Upload CSV Template
            </h2>

            <p className="text-sm text-gray-600 mb-4">Upload CSV file with submission data</p>

            <button
              onClick={handleDownloadTemplate}
              className="w-full mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files && setCSVFile(e.target.files[0])}
              disabled={step !== 2 || uploading}
              className="mb-4 w-full text-sm"
            />

            {csvFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">{csvFile.name}</p>
                <p className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            <button
              onClick={handleCSVUpload}
              disabled={!csvFile || uploading || step !== 2}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {uploading && step === 2 ? 'Processing...' : 'Parse CSV'}
            </button>

            {csvRows.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-green-600">Parsed {csvRows.length} rows</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</span>
              Review & Submit
            </h2>

            <p className="text-sm text-gray-600 mb-4">Review matched documents and submit</p>

            {matches.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Matched:</span>
                  <span className="font-semibold text-green-600">{matchedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm">Missing:</span>
                  <span className="font-semibold text-red-600">{missingCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Credits Required:</span>
                  <span className="font-semibold text-blue-600">{matchedCount * 2}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploading || step !== 3 || matchedCount === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-semibold"
            >
              {uploading && step === 3 ? 'Submitting...' : `Submit ${matchedCount} Entries`}
            </button>

            {step === 3 && missingCount > 0 && (
              <p className="mt-4 text-xs text-orange-600">
                {missingCount} rows will be skipped due to missing documents
              </p>
            )}
          </div>
        </div>

        {matches.length > 0 && step === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Document Matching Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Row</th>
                    <th className="text-left p-2">Importer</th>
                    <th className="text-left p-2">BL No</th>
                    <th className="text-left p-2">Invoice No</th>
                    <th className="text-left p-2">BL Document</th>
                    <th className="text-left p-2">Invoice Document</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{match.rowIndex + 1}</td>
                      <td className="p-2 text-xs">{match.rowData.rex_importer_id?.substring(0, 30)}...</td>
                      <td className="p-2">{match.rowData.bl_no}</td>
                      <td className="p-2">{match.rowData.invoice_no}</td>
                      <td className="p-2">
                        {match.blDocument ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {match.blDocument.filename}
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {match.invoiceDocument ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {match.invoiceDocument.filename}
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {match.hasAllDocuments ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Ready</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Incomplete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Your REX Submissions</h2>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No submissions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Importer</th>
                    <th className="text-left p-2">Country</th>
                    <th className="text-left p-2">BL No</th>
                    <th className="text-left p-2">Invoice No</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Documents</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-xs">{sub.rex_importer_id?.substring(0, 30)}...</td>
                      <td className="p-2">{sub.destination_country_id}</td>
                      <td className="p-2">{sub.bl_no}</td>
                      <td className="p-2">{sub.invoice_no}</td>
                      <td className="p-2">${sub.invoice_value?.toFixed(2)}</td>
                      <td className="p-2">{new Date(sub.created_at).toLocaleDateString()}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {sub.documents?.length || 0} files
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
