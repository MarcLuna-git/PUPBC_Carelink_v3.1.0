import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Calendar, User, Loader2, Stethoscope, Pill, ClipboardList, ChevronDown, ChevronUp, Filter, X, Download } from 'lucide-react';
import api from '../../../services/api';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`} />
);

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filterYear, setFilterYear] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/student/clinic-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const data = response.data.data;
        const consultations = Array.isArray(data) ? data : (data?.data || []);
        
        const formatted = consultations.map((c, index) => ({
          id: `${c.record_type}-${c.id || index}`,
          date: c.occurred_at,
          diagnosis: (c.record_type === 'emergency' ? 'Emergency: ' : '') + (c.reason || c.chief_complaint || 'Consultation'),
          treatment: c.intervention || c.general_remarks || 'Not recorded',
          medicine: c.medicine || c.prescription || 'None prescribed',
          notes: [c.assessment, c.disposition].filter(Boolean).join(' / '),
          nurse: c.nurse ? `${c.nurse.first_name || ''} ${c.nurse.last_name || ''}`.trim() || 'Attending Nurse' : 'Attending Nurse',
          vitals: {
            bp: c.vital_signs?.bp || null,
            hr: c.vital_signs?.hr || null,
            temp: c.vital_signs?.temp || null,
            rr: c.vital_signs?.rr || null,
            o2: c.vital_signs?.o2_sat || null,
          },
          status: c.status || 'completed',
        }));
        
        setRecords(formatted);

      }
    } catch (err) {
      console.log('Records error:', err);
      setError('Unable to load health records.');
    } finally {
      setLoading(false);
    }
  };

  const years = [...new Set(records.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a);

  const filteredRecords = records.filter(r => {
    const matchesSearch = search === '' || 
      r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      r.treatment.toLowerCase().includes(search.toLowerCase()) ||
      r.nurse.toLowerCase().includes(search.toLowerCase());
    
    const matchesYear = filterYear === 'all' || new Date(r.date).getFullYear().toString() === filterYear;
    
    return matchesSearch && matchesYear;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-7 w-40 mb-1.5" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48 rounded-2xl" />
            <Skeleton className="h-10 w-10 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-56" />
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto pb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Health Records</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {records.length} encounter{records.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-maroon-500 focus:outline-none"
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..." />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-2xl border transition flex-shrink-0 ${
              showFilters || filterYear !== 'all'
                ? 'bg-maroon-50 border-maroon-300 text-maroon-700 dark:bg-maroon-900/20 dark:border-maroon-600 dark:text-maroon-400'
                : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
            }`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm text-center border border-red-200 dark:border-red-800/20">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by Year</p>
                <button onClick={() => { setFilterYear('all'); setShowFilters(false); }}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setFilterYear('all'); setShowFilters(false); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    filterYear === 'all' ? 'bg-maroon-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>All Years</button>
                {years.map(year => (
                  <button key={year} onClick={() => { setFilterYear(year.toString()); setShowFilters(false); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      filterYear === year.toString() ? 'bg-maroon-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>{year}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">No Records Found</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {search || filterYear !== 'all' ? 'Try adjusting your filters.' : 'Your consultation history will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <motion.div key={record.id} layout
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all">
              
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="w-full p-4 sm:p-5 flex items-start justify-between text-left gap-3">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-maroon-50 dark:bg-maroon-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {record.diagnosis}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.date)}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                      <span>{formatTime(record.date)}</span>
                    </div>
                    {record.medicine && record.medicine !== 'None prescribed' && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-maroon-600 dark:text-maroon-400">
                        <Pill className="w-3 h-3" />
                        <span className="truncate">{record.medicine}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                    record.status === 'completed' 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/20'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/20'
                  }`}>
                    {record.status}
                  </span>
                  {expandedId === record.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedId === record.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4">
                      
                      {Object.values(record.vitals).some(v => v) && (
                        <div className="mb-4">
                          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Vital Signs
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {record.vitals.bp && (
                              <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1.5 rounded-xl font-medium">
                                BP: {record.vitals.bp}
                              </span>
                            )}
                            {record.vitals.hr && (
                              <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2.5 py-1.5 rounded-xl font-medium">
                                HR: {record.vitals.hr}
                              </span>
                            )}
                            {record.vitals.temp && (
                              <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-1.5 rounded-xl font-medium">
                                Temp: {record.vitals.temp}
                              </span>
                            )}
                            {record.vitals.rr && (
                              <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2.5 py-1.5 rounded-xl font-medium">
                                RR: {record.vitals.rr}
                              </span>
                            )}
                            {record.vitals.o2 && (
                              <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1.5 rounded-xl font-medium">
                                O2: {record.vitals.o2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3.5">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" /> Diagnosis
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {record.diagnosis}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3.5">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" /> Treatment
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {record.treatment}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3.5">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Pill className="w-3 h-3" /> Medicine
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {record.medicine}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3.5">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> Nurse
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {record.nurse}
                          </p>
                        </div>
                      </div>

                      {record.notes && (
                        <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3.5 border border-yellow-100 dark:border-yellow-800/20">
                          <p className="text-[11px] text-yellow-600 dark:text-yellow-500 uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">{record.notes}</p>
                        </div>
                      )}

                      <button className="mt-4 w-full py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Record
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
};

export default HealthRecords;