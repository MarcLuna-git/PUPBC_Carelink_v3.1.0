import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import ClinicHistoryList, { DataFields } from '../../../components/ClinicHistoryList';

const emptyEmergency = { incident_datetime: '', reason: '', symptoms: '', assessment: '', intervention: '', disposition: '', notes: '' };
export default function NurseStudents() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(params.get('student'));
  const [selected, setSelected] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('Personal Information');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergency, setEmergency] = useState(emptyEmergency);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/nurse/students', { params: { search, page }, signal: controller.signal }).then(({ data }) => { setStudents(data.data.data); setLastPage(data.data.last_page); }).catch(err => { if (err.code !== 'ERR_CANCELED') setError('Unable to load students.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page]);
  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    const controller = new AbortController();
    setDetailLoading(true); setSelected(null); setHistory([]); setAppointments([]); setError('');
    Promise.all([
      api.get(`/nurse/students/${selectedId}`, { signal: controller.signal }),
      api.get(`/nurse/students/${selectedId}/appointments`, { signal: controller.signal }),
      api.get(`/nurse/students/${selectedId}/clinic-history`, { signal: controller.signal }),
    ]).then(([detail, visits, records]) => { setSelected(detail.data.data); setAppointments(visits.data.data); setHistory(records.data.data); }).catch(err => { if (err.code !== 'ERR_CANCELED') setError('Unable to load student record.'); }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectedId, refresh]);
  const submitEmergency = async event => {
    event.preventDefault(); if (saving) return; setSaving(true); setError('');
    try { await api.post('/nurse/emergency-encounters', { ...emergency, student_id: selectedId }); setEmergencyOpen(false); setEmergency(emptyEmergency); setTab('Clinic History'); setRefresh(value => value + 1); }
    catch (err) { setError(Object.values(err.response?.data?.errors || {}).flat().join(' ') || err.response?.data?.message || 'Unable to save emergency encounter.'); }
    finally { setSaving(false); }
  };
  const close = () => { setSelectedId(null); setEmergencyOpen(false); setEmergency(emptyEmergency); setError(''); };
  const tabs = ['Personal Information', 'Health Profile', 'Appointments', 'Clinic History', 'Consultations', 'Emergency Encounters'];
  return <div className="max-w-6xl mx-auto space-y-5 text-gray-900 dark:text-gray-100">
    <h1 className="text-2xl font-bold">Students</h1>
    {!selectedId && error && <p role="alert" className="text-red-600">{error}</p>}
    <input aria-label="Search students" placeholder="Search student name or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full border rounded-xl p-3 dark:bg-gray-800" />
    {loading && <p>Loading students...</p>}
    <div className="grid md:grid-cols-3 gap-4">{students.map(student => <button key={student.id} onClick={() => { setSelectedId(student.id); setTab('Personal Information'); }} className="text-left border rounded-2xl p-5 bg-white dark:bg-gray-800"><b>{student.first_name} {student.last_name}</b><p>{student.student_id}</p><p className="text-sm text-gray-500">{student.student_profile?.course || student.course}</p></button>)}</div>
    {!loading && !students.length && <p>No students found.</p>}
    <div className="flex gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {lastPage}</span><button disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Next</button></div>
    {selectedId && <div role="dialog" aria-modal="true" aria-label="Student record" className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4"><div className="max-w-4xl mx-auto my-8 bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-5">
      <div className="flex justify-between"><h2 className="text-xl font-bold">{selected ? `${selected.first_name} ${selected.last_name}` : 'Student record'}</h2><button onClick={close} aria-label="Close student record">Close</button></div>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {detailLoading ? <p>Loading record...</p> : selected && <>
        <p>{selected.student_id}</p>
        <div className="flex flex-wrap gap-2" role="tablist">{tabs.map(name => <button role="tab" aria-selected={tab === name} key={name} onClick={() => setTab(name)} className={`rounded-xl px-3 py-2 text-sm ${tab === name ? 'bg-maroon-800 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>{name}</button>)}</div>
        {tab === 'Personal Information' && <DataFields data={{ first_name: selected.first_name, middle_name: selected.middle_name, last_name: selected.last_name, email: selected.email, student_id: selected.student_id, birthday: selected.birthday?.slice(0, 10), gender: selected.gender, mobile_number: selected.mobile_number, ...selected.student_profile }} />}
        {tab === 'Health Profile' && (selected.health_profile ? <DataFields data={selected.health_profile} /> : <p>Health profile not yet submitted.</p>)}
        {tab === 'Appointments' && (appointments.length ? appointments.map(visit => <div key={visit.id} className="border rounded-xl p-3 mb-3"><DataFields data={{ service: visit.service, appointment_date: visit.appointment_date?.slice(0, 10), time_slot: visit.time_slot, status: visit.status, concern: visit.concern }} /></div>) : <p>No appointments.</p>)}
        {['Clinic History', 'Consultations', 'Emergency Encounters'].includes(tab) && <ClinicHistoryList records={history.filter(record => tab === 'Clinic History' || record.record_type === (tab === 'Consultations' ? 'consultation' : 'emergency'))} />}
        <button onClick={() => { setError(''); setEmergencyOpen(true); }} className="bg-red-700 text-white rounded-xl px-4 py-3">Add Emergency Encounter</button>
      </>}
    </div></div>}
    {emergencyOpen && selectedId && <div role="dialog" aria-modal="true" aria-label="Emergency encounter" className="fixed inset-0 z-[60] bg-black/60 overflow-y-auto p-4"><form onSubmit={submitEmergency} className="max-w-2xl mx-auto my-8 bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-4"><h2 className="text-xl font-bold">Add Emergency Encounter</h2>{error && <p role="alert" className="text-red-600">{error}</p>}<label className="block">Incident date and time<input required type="datetime-local" value={emergency.incident_datetime} onChange={e => setEmergency({ ...emergency, incident_datetime: e.target.value })} className="block w-full border rounded-xl p-3 dark:bg-gray-700" /></label>{['reason', 'symptoms', 'assessment', 'intervention', 'disposition', 'notes'].map(field => <label key={field} className="block capitalize">{field}<textarea required={field === 'reason'} value={emergency[field]} onChange={e => setEmergency({ ...emergency, [field]: e.target.value })} className="block w-full border rounded-xl p-3 dark:bg-gray-700" /></label>)}<div className="flex justify-end gap-4"><button type="button" disabled={saving} onClick={() => setEmergencyOpen(false)}>Cancel</button><button disabled={saving} className="bg-red-700 text-white rounded-xl px-4 py-3">{saving ? 'Saving...' : 'Save Encounter'}</button></div></form></div>}
  </div>;
}
