import React, { useState } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, X,
  RefreshCw, ShieldCheck
} from 'lucide-react';
import { documentApi } from '../lib/api';
import { DEMO_CITIZEN_CASES } from '../lib/mockData';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  onSuccess?: (uploadedDoc: any) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  caseId: initialCaseId,
  onSuccess,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    initialCaseId || DEMO_CITIZEN_CASES[0]?.id || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    // 1. Validate file extension
    if (!['.pdf', '.docx', '.txt'].includes(ext)) {
      setUploadError(
        `Unsupported file type '${ext}'. Please upload a PDF (.pdf), Word document (.docx), or plain text file (.txt).`
      );
      return;
    }

    // 2. Validate file size (15 MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15 MB limit. Please upload a smaller document.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a document file to upload.');
      return;
    }

    if (!selectedCaseId) {
      setUploadError('Please select a case to attach the document to.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await documentApi.upload(selectedCaseId, selectedFile);
      setUploadedResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please check network connectivity.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-900 to-indigo-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Upload Legal Document</h3>
              <p className="text-xs text-slate-300">Secure validation, text extraction & AI analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {uploadedResult ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Document Uploaded Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  "{uploadedResult.originalName}" is now queued in the AI comprehension pipeline.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between">
                <span>Initial Status:</span>
                <span className="font-bold text-blue-600">{uploadedResult.processingStatus}</span>
              </div>

              <button
                onClick={onClose}
                className="w-full btn-primary text-xs py-2.5"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Case Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Case
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="input-field text-xs"
                >
                  {DEMO_CITIZEN_CASES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Document File (PDF, DOCX, TXT)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50 relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Click to browse or drag and drop file here
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supported formats: PDF (.pdf), Word (.docx), Plain Text (.txt) — Max 15 MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Security info */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted private storage. Documents are never exposed publicly.</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="btn-primary text-xs flex items-center gap-1.5 px-5"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Process</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
