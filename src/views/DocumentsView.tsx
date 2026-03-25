import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  Download, 
  Plus, 
  X, 
  File, 
  FileSpreadsheet, 
  Image as ImageIcon,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AppDocument, Employee } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DocumentsView: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Invoice' | 'Personal'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [documentToView, setDocumentToView] = useState<AppDocument | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'Invoice' as 'Invoice' | 'Personal',
    employeeName: '',
    receivedDate: format(new Date(), 'yyyy-MM-dd'),
    file: null as File | null
  });

  useEffect(() => {
    fetchDocuments();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
      if (data.length > 0) {
        setUploadForm(prev => ({ ...prev, employeeName: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadForm(prev => ({ 
        ...prev, 
        file,
        name: prev.name || file.name.split('.')[0]
      }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.name) {
      toast.error('Please provide a name and select a file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(uploadForm.file);
      reader.onload = async () => {
        const base64Url = reader.result as string;
        
        const newDoc: AppDocument = {
          id: crypto.randomUUID(),
          name: uploadForm.name,
          type: uploadForm.type,
          url: base64Url,
          uploadedBy: uploadForm.type === 'Personal' && uploadForm.employeeName ? uploadForm.employeeName : (user?.name || 'Unknown'),
          uploadedAt: new Date().toISOString(),
          receivedDate: uploadForm.receivedDate,
          fileType: uploadForm.file?.type || 'application/octet-stream',
          fileSize: uploadForm.file?.size
        };

        await api.saveDocument(newDoc);
        toast.success('Document uploaded successfully');
        setIsUploadModalOpen(false);
        setUploadForm({
          name: '',
          type: 'Invoice',
          employeeName: employees.length > 0 ? employees[0].name : '',
          receivedDate: format(new Date(), 'yyyy-MM-dd'),
          file: null
        });
        fetchDocuments();
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      await api.deleteDocument(documentToDelete);
      toast.success('Document deleted');
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDelete = (id: string) => {
    setDocumentToDelete(id);
  };

  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <File className="w-8 h-8 text-gray-400" />;
    if (fileType.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (fileType.includes('csv') || fileType.includes('sheet') || fileType.includes('excel')) 
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    return <FileText className="w-8 h-8 text-indigo-500" />;
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.uploadedBy || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-500">Upload and manage invoices and personal documents</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by name or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === 'all' 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setFilterType('Invoice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === 'Invoice' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setFilterType('Personal')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === 'Personal' 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Personal Docs
            </button>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
          <p className="text-gray-500">Try adjusting your search or filters, or upload a new document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    doc.type === 'Invoice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {doc.type}
                  </div>
                </div>
                
                <h3 className="font-bold text-gray-900 mb-1 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    <span>Uploaded by: {doc.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Received: {doc.receivedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 text-xs">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDocumentToView(doc)}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
                <h3 className="text-lg font-bold text-indigo-900">Upload Document</h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. March Milk Invoice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUploadForm(prev => ({ ...prev, type: 'Invoice' }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        uploadForm.type === 'Invoice'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadForm(prev => ({ ...prev, type: 'Personal' }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        uploadForm.type === 'Personal'
                          ? 'bg-purple-50 border-purple-200 text-purple-700 ring-2 ring-purple-100'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Personal Doc
                    </button>
                  </div>
                </div>

                {uploadForm.type === 'Personal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee
                    </label>
                    <select
                      value={uploadForm.employeeName}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, employeeName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    >
                      <option value="">Select an employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received Date
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadForm.receivedDate}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, receivedDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors cursor-pointer relative">
                    <div className="space-y-1 text-center">
                      {uploadForm.file ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
                          <p className="mt-2 text-sm font-medium text-gray-900">{uploadForm.file.name}</p>
                          <button 
                            type="button"
                            onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                            className="text-xs text-red-500 hover:underline mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-10 w-10 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                              Upload a file
                            </span>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Word, PDF, CSV, PNG, JPG up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.csv,.png,.jpg,.jpeg"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {documentToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this document? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setDocumentToDelete(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document View Modal */}
      <AnimatePresence>
        {documentToView && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{documentToView.name}</h3>
                <button 
                  onClick={() => {
                    setDocumentToView(null);
                    setPageNumber(1);
                    setNumPages(undefined);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-auto bg-gray-50 flex flex-col justify-center items-center min-h-[50vh]">
                {documentToView.fileType?.includes('image') ? (
                  <img src={documentToView.url} alt={documentToView.name} className="max-w-full max-h-full object-contain" />
                ) : documentToView.fileType?.includes('pdf') ? (
                  <div className="flex flex-col items-center w-full h-full">
                    <div className="flex-1 overflow-auto w-full flex justify-center items-start bg-gray-200/50 rounded-lg p-4">
                      <Document
                        file={documentToView.url}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        loading={
                          <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        }
                        error={
                          <div className="text-center p-8">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-gray-900 font-medium">Failed to load PDF</p>
                            <p className="text-gray-500 text-sm mt-2 mb-4">The document could not be rendered.</p>
                            <a 
                              href={documentToView.url} 
                              download={documentToView.name} 
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                            >
                              <Download className="w-4 h-4" /> Download Instead
                            </a>
                          </div>
                        }
                      >
                        <Page 
                          pageNumber={pageNumber} 
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          className="shadow-lg"
                          width={Math.min(window.innerWidth * 0.8, 800)}
                        />
                      </Document>
                    </div>
                    
                    {numPages && numPages > 1 && (
                      <div className="flex items-center gap-4 mt-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                        <button
                          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                          disabled={pageNumber <= 1}
                          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button
                          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                          disabled={pageNumber >= numPages}
                          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type.</p>
                    <a 
                      href={documentToView.url} 
                      download={documentToView.name} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentsView;
