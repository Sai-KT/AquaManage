import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import HeroBanner from '../../components/HeroBanner';
import Topbar from '../../components/Topbar';
import { Upload, MapPin, AlertTriangle, CheckCircle, X, FileText, Video } from 'lucide-react';
import { issueTypes } from '../../data/mockData';
import studentService from '../../services/studentService';

export default function ReportIssue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ type: '', zone: '', location: '', description: '', photo: null, video: null });
  const [zonesList, setZonesList] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    studentService.getCampusZones().then(res => {
      if (res.data) setZonesList(res.data);
    });
  }, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhoto = (file) => {
    if (!file) return;
    setForm((f) => ({ ...f, photo: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleVideo = (file) => {
    if (!file) return;
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];
    if (!allowed.includes(file.type)) return;
    setForm((f) => ({ ...f, video: file }));
    setVideoName(file.name);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const validate = () => {
    const e = {};
    if (!form.type)        e.type = 'Please select an issue type.';
    if (!form.zone)        e.zone = 'Please select a campus zone.';
    if (!form.description || form.description.trim().length < 10)
      e.description = 'Please describe the issue in at least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await studentService.submitReport({
        type: form.type,
        zone: form.zone,
        location: form.location,
        description: form.description,
        photoFile: form.photo,
        videoFile: form.video,
        user,
      });

      if (res && res.success) {
        setSubmittedId(res.reportId);
        setSubmitted(true);
      } else {
        setSubmitError(res?.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ type: '', zone: '', location: '', description: '', photo: null, video: null });
    setPhotoPreview(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setVideoName('');
    setSubmitted(false);
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="app-layout">
        <Sidebar role="student" />
        <div className="main-content">
          <Topbar title="Report an Issue" />
          <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
            <div style={{ textAlign: 'center', maxWidth: 440 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'var(--green-100)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 24px',
                boxShadow: 'var(--shadow-glow-green)',
                animation: 'float 3s ease-in-out infinite',
              }}>
                <CheckCircle size={44} style={{ color: 'var(--green-600)' }} />
              </div>
              <h2 style={{ color: 'var(--navy-900)', marginBottom: 10 }}>Issue Reported Successfully!</h2>
              <p style={{ color: 'var(--navy-500)', marginBottom: 8, fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Thank you for keeping the IIIT campus water system healthy!
                Your report has been logged and our maintenance team will respond soon.
              </p>
              <div style={{
                background: 'var(--green-50)', border: '1px solid var(--green-300)',
                borderRadius: 14, padding: '18px 28px', margin: '20px 0', display: 'inline-block',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>
                  Tracking ID
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-800)' }}>
                  {submittedId}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                {[
                  { label: 'Issue Type', value: form.type },
                  { label: 'Zone', value: form.zone },
                ].map(r => (
                  <div key={r.label} style={{ background: 'var(--navy-50)', borderRadius: 10, padding: '10px 14px', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--navy-400)', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy-800)' }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" onClick={resetForm}>
                  Report Another Issue
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => navigate('/student/myreports')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <FileText size={16} /> Track My Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar title="Report an Issue" subtitle="Help keep IIIT campus water systems healthy" />
        <div className="page-body">
          <HeroBanner role="student" />

          <div className="responsive-grid-2-1" style={{ alignItems: 'start' }}>
            {/* Form */}
            <div className="card">
              <form onSubmit={handleSubmit}>
                {/* Issue Type */}
                <div className="form-group">
                  <label className="form-label">Issue Type <span>*</span></label>
                  <select
                    className="form-select"
                    value={form.type}
                    onChange={handleChange('type')}
                    style={{ borderColor: errors.type ? 'var(--red-500)' : undefined }}
                  >
                    <option value="">Select issue type...</option>
                    {issueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <div style={{ fontSize: '0.75rem', color: 'var(--red-500)', marginTop: 4 }}>{errors.type}</div>}
                </div>

                {/* Zone */}
                <div className="form-group">
                  <label className="form-label">Campus Zone / Building <span>*</span></label>
                  <select
                    className="form-select"
                    value={form.zone}
                    onChange={handleChange('zone')}
                    style={{ borderColor: errors.zone ? 'var(--red-500)' : undefined }}
                  >
                    <option value="">Select IIIT building/zone...</option>
                    {(zonesList.length > 0 ? zonesList : ['Academic Block', 'PPCRC', 'Mithila Hostel', 'Vikramshila Hostel', 'Canteen', 'Campus Garden']).map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                  {errors.zone && <div style={{ fontSize: '0.75rem', color: 'var(--red-500)', marginTop: 4 }}>{errors.zone}</div>}
                </div>

                {/* Specific Location */}
                <div className="form-group">
                  <label className="form-label">Specific Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--navy-400)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="e.g. Academic Block — Ground Floor, near washroom door"
                      value={form.location}
                      onChange={handleChange('location')}
                    />
                  </div>
                  <div className="form-hint">The more specific, the faster we can respond!</div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Describe the issue in detail — what is leaking, how much water is wasting, is there flooding?"
                    value={form.description}
                    onChange={handleChange('description')}
                    style={{ borderColor: errors.description ? 'var(--red-500)' : undefined }}
                  />
                  {errors.description && <div style={{ fontSize: '0.75rem', color: 'var(--red-500)', marginTop: 4 }}>{errors.description}</div>}
                </div>

                {/* Photo Upload */}
                <div className="form-group">
                  <label className="form-label">Attach Photo (Optional but recommended)</label>
                  {photoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--green-300)' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo: null })); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'var(--red-500)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-zone"
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); handlePhoto(e.dataTransfer.files[0]); }}
                      onClick={() => document.getElementById('photo-input').click()}
                      style={{ borderColor: dragOver ? 'var(--green-500)' : undefined, background: dragOver ? 'var(--green-50)' : undefined }}
                    >
                      <Upload size={28} style={{ color: 'var(--navy-400)', margin: '0 auto' }} />
                      <p>Drag & drop a photo, or <strong style={{ color: 'var(--green-600)' }}>browse</strong></p>
                      <span>PNG, JPG up to 10MB</span>
                      <input id="photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhoto(e.target.files[0])} />
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div className="form-group">
                  <label className="form-label">Attach Video (Optional)</label>
                  {videoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <video
                        src={videoPreview}
                        controls
                        style={{
                          width: '100%', maxHeight: 200, borderRadius: 10,
                          border: '2px solid var(--green-300)', background: '#000',
                          display: 'block',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, padding: '6px 10px', background: 'var(--navy-50)', borderRadius: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--navy-500)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          📹 {videoName}
                        </span>
                        <button
                          type="button"
                          onClick={() => { if (videoPreview) URL.revokeObjectURL(videoPreview); setVideoPreview(null); setVideoName(''); setForm(f => ({ ...f, video: null })); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--red-500)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                        >
                          <X size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="upload-zone"
                      onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
                      onDragLeave={() => setVideoDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setVideoDragOver(false); handleVideo(e.dataTransfer.files[0]); }}
                      onClick={() => document.getElementById('video-input').click()}
                      style={{ borderColor: videoDragOver ? 'var(--green-500)' : undefined, background: videoDragOver ? 'var(--green-50)' : undefined }}
                    >
                      <Video size={28} style={{ color: 'var(--navy-400)', margin: '0 auto' }} />
                      <p>Drag & drop a video, or <strong style={{ color: 'var(--green-600)' }}>browse</strong></p>
                      <span>MP4, MOV, WebM up to 50MB</span>
                      <input id="video-input" type="file" accept="video/mp4,video/quicktime,video/webm,video/ogg" style={{ display: 'none' }} onChange={(e) => handleVideo(e.target.files[0])} />
                    </div>
                  )}
                </div>

                {submitError && (
                  <div style={{ padding: '10px 14px', background: 'var(--red-100)', color: 'var(--red-700)', borderRadius: 8, fontSize: '0.8125rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8, opacity: isSubmitting ? 0.8 : 1, cursor: isSubmitting ? 'wait' : 'pointer' }}
                >
                  <AlertTriangle size={17} />
                  {isSubmitting ? 'Submitting to System...' : 'Submit Report'}
                </button>
              </form>
            </div>

            {/* Info Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ background: 'var(--green-50)', border: '1px solid var(--green-300)' }}>
                <div style={{ fontWeight: 700, color: 'var(--green-800)', marginBottom: 12 }}>💡 IIIT Reporting Tips</div>
                {[
                  'Specify the building: Academic Block, PPCRC, Mithila/Vikramshila Hostel, or Canteen',
                  'Mention the floor number for quicker response',
                  'A photo makes identification much faster',
                  'Report immediately — early action saves water!',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.8125rem', color: 'var(--green-800)', lineHeight: 1.5 }}>
                    <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--green-600)' }} />
                    {tip}
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, color: 'var(--navy-800)', marginBottom: 14 }}>What Happens Next?</div>
                {[
                  { step: '01', label: 'Report logged', desc: 'Added to the system with a unique ID immediately.' },
                  { step: '02', label: 'Review & Assign', desc: 'Admin assigns it to maintenance staff.' },
                  { step: '03', label: 'Field Response', desc: 'Maintenance visits and resolves the issue.' },
                  { step: '04', label: 'You\'re Notified', desc: 'Status updates visible in "My Reports".' },
                ].map((s) => (
                  <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--green-700)', flexShrink: 0 }}>
                      {s.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--navy-800)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                  onClick={() => navigate('/student/myreports')}
                >
                  <FileText size={13} /> View My Previous Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
