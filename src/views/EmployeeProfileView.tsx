import { useState, useEffect, FormEvent } from 'react';
import { User, DollarSign, Clock, Calendar, ArrowLeft, Save, FileText, Eye, Download, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Employee, Shift, AppDocument } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { calculateHours } from '../utils';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EmployeeProfileViewProps {
  employeeId: string;
  onBack: () => void;
}

export const EmployeeProfileView = ({ employeeId, onBack }: EmployeeProfileViewProps) => {
  const { user, isAdmin: authIsAdmin } = useAuth();
  const isAdmin = authIsAdmin;
  const isOwner = user?.id === employeeId;
  const canEdit = isAdmin || isOwner;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [documentToView, setDocumentToView] = useState<AppDocument | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Handle default admin profile
        if (employeeId === 'admin-1') {
          setEmployee({
            id: 'admin-1',
            name: 'System Admin',
            role: 'Admin',
            email: 'admin@firestation.com',
            staffId: 0,
            hourlyRate: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            phone: 'N/A',
            bio: 'System Administrator Account'
          });
          setShifts([]);
          setDocuments([]);
          setIsLoading(false);
          return;
        }

        const [emps, allShifts, allDocs] = await Promise.all([
          api.getEmployees(),
          api.getRoster(),
          api.getDocuments()
        ]);

        const currentEmp = emps.find(e => e.id === employeeId);
        if (currentEmp) {
          setEmployee(currentEmp);
          const empShifts = allShifts
            .filter(s => s.staffName === currentEmp.name && (s.status === 'Published' || s.isApproved))
            .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending (recent first)
          setShifts(empShifts);
          
          const empDocs = allDocs.filter(d => d.type === 'Personal' && d.uploadedBy === currentEmp.name);
          setDocuments(empDocs);
        }
      } catch (error) {
        console.error('Failed to fetch employee profile data:', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  const handleUpdateEmployee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!employee) return;

    const formData = new FormData(e.currentTarget);
    const updatedEmployee: Employee = {
      ...employee,
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      bio: formData.get('bio') as string,
      hourlyRate: Number(formData.get('hourlyRate')),
    };

    try {
      await api.saveEmployee(updatedEmployee);
      setEmployee(updatedEmployee);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Employee not found</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-bold">Go Back</button>
      </div>
    );
  }

  const totalEarned = shifts.reduce((acc, shift) => {
    const hours = calculateHours(shift.startTime, shift.endTime);
    return acc + (hours * (shift.hourlyRate || employee.hourlyRate || 0));
  }, 0);

  const totalPaid = shifts.reduce((acc, shift) => {
    const hours = calculateHours(shift.startTime, shift.endTime);
    const shiftTotal = hours * (shift.hourlyRate || employee.hourlyRate || 0);
    const isPaid = !!shift.isPaid;
    return acc + (shift.paidAmount || (isPaid ? shiftTotal : 0));
  }, 0);
  const outstanding = totalEarned - totalPaid;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <PageHeader title={`${employee.name}'s Profile`} />
      </div>

      <div className="space-y-6">
        {/* Top Row: Profile Info */}
        <div className="glass-card p-8 bg-primary dark:bg-primary text-white shadow-lg shadow-primary/20 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <form onSubmit={handleUpdateEmployee} className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="w-32 h-32 bg-white/20 rounded-3xl flex items-center justify-center text-white backdrop-blur-sm shadow-inner shrink-0">
                <User size={64} />
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <div className="space-y-1 lg:col-span-2">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Employee Name</label>
                  {isEditing ? (
                    <input name="name" defaultValue={employee.name} className="w-full px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white outline-none text-2xl font-bold" />
                  ) : (
                    <h2 className="text-3xl font-bold text-white">{employee.name}</h2>
                  )}
                  {isEditing ? (
                    <input name="role" defaultValue={employee.role} className="w-full px-3 py-2 mt-2 rounded-lg border-none bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white outline-none" />
                  ) : (
                    <p className="text-white/80 font-medium text-lg">{employee.role}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Hourly Rate</label>
                  {isEditing ? (
                    <input name="hourlyRate" type="number" defaultValue={employee.hourlyRate} className="w-full px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white outline-none" />
                  ) : (
                    <p className="font-bold text-white text-xl">${employee.hourlyRate || 0}/hr</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Contact Info</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input name="email" type="email" defaultValue={employee.email} className="w-full px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white outline-none" placeholder="Email" />
                      <input name="phone" defaultValue={employee.phone} className="w-full px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white outline-none" placeholder="Phone" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{employee.email}</p>
                      <p className="text-sm font-medium text-white">{employee.phone}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 lg:col-span-4">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Bio</label>
                  {isEditing ? (
                    <textarea name="bio" defaultValue={employee.bio} rows={2} className="w-full px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white outline-none resize-none" />
                  ) : (
                    <p className="text-sm font-medium text-white/90 max-w-3xl">{employee.bio}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-start md:self-center">
                {isEditing ? (
                  <div className="flex flex-col gap-2 w-32">
                    <button type="submit" className="w-full bg-white text-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-slate-50 transition-colors">
                      <Save size={18} /> Save
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="w-full py-3 rounded-xl font-bold text-white/80 hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  canEdit && (
                    <button type="button" onClick={() => setIsEditing(true)} className="w-32 py-3 rounded-xl font-bold bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm flex items-center justify-center gap-2">
                      <User size={18} /> Edit Profile
                    </button>
                  )
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Middle Row: Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="glass-card p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                  <DollarSign size={20} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Earned</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">${totalEarned.toFixed(2)}</h3>
              </div>
            </div>
            
            <div className="glass-card p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                  <DollarSign size={20} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Paid</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">${totalPaid.toFixed(2)}</h3>
              </div>
            </div>
            
            <div className="glass-card p-5 shadow-sm hover:shadow-md transition-all col-span-2 sm:col-span-1 lg:col-span-1">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20">
                  <DollarSign size={20} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Outstanding</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">${outstanding.toFixed(2)}</h3>
              </div>
            </div>
        </div>

        {/* Bottom Row: Shifts */}
        <div className="glass-card p-8 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <Clock className="text-indigo-500" />
            Recent & Upcoming Shifts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.length > 0 ? (
              shifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
                      <Calendar size={20} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{shift.day}, {shift.date}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{shift.startTime} - {shift.endTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">
                      ${(calculateHours(shift.approvedStartTime || shift.startTime, shift.approvedEndTime || shift.endTime) * (shift.hourlyRate || employee.hourlyRate || 0)).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">${shift.hourlyRate || employee.hourlyRate || 0}/hr</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Clock className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No shifts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="glass-card p-8 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <FileText className="text-indigo-500" />
            Personal Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length > 0 ? (
              documents.map(doc => (
                <div key={doc.id} className="flex flex-col p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-white truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setDocumentToView(doc)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No personal documents found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document View Modal */}
      <AnimatePresence>
        {documentToView && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate pr-4">{documentToView.name}</h3>
                <button 
                  onClick={() => {
                    setDocumentToView(null);
                    setPageNumber(1);
                    setNumPages(undefined);
                  }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center min-h-[50vh]">
                {documentToView.fileType?.includes('image') ? (
                  <img src={documentToView.url} alt={documentToView.name} className="max-w-full max-h-full object-contain" />
                ) : documentToView.fileType?.includes('pdf') ? (
                  <div className="flex flex-col items-center w-full h-full">
                    <div className="flex-1 overflow-auto w-full flex justify-center items-start bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-4">
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
                            <p className="text-slate-900 dark:text-white font-medium">Failed to load PDF</p>
                            <p className="text-slate-500 text-sm mt-2 mb-4">The document could not be rendered.</p>
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
                      <div className="flex items-center gap-4 mt-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                          disabled={pageNumber <= 1}
                          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button
                          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                          disabled={pageNumber >= numPages}
                          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Preview not available for this file type.</p>
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
