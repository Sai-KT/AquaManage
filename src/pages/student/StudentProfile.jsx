import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import studentService from '../../services/studentService';
import {
  Mail, Building, GraduationCap, Lock, Key, Eye, EyeOff,
  Save, X, Edit3, CheckCircle, Shield, Clock,
  FileText, RefreshCw, AlertCircle, Info, Camera, Trash2, UploadCloud, Image as ImageIcon
} from 'lucide-react';

const STUDENT_BRANCHES = [
  'Computer Engineering (Comp)',
  'Information Technology (IT)',
  'Electronics and Telecommunication (ENTC)',
];

const normalizeBranch = (dept) => {
  if (!dept) return STUDENT_BRANCHES[0];
  const d = dept.trim().toLowerCase();
  if (d.includes('comp')) return 'Computer Engineering (Comp)';
  if (d.includes('info') || d === 'it') return 'Information Technology (IT)';
  if (d.includes('tele') || d.includes('entc') || d.includes('elect') || d.includes('e&tc')) return 'Electronics and Telecommunication (ENTC)';
  return dept;
};

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user, logout, updateCurrentUser } = useAuth();
  const { isDark } = useTheme();

  // Profile data states
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Avatar upload states
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', department: '' });
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Change password states
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Fetch student profile on mount and when user identity changes
  const loadProfile = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError('');
    try {
      const res = await studentService.getProfile();
      if (res && res.success && res.profile) {
        setProfile(res.profile);
        setEditForm({
          email: res.profile.email || '',
          department: normalizeBranch(res.profile.department) || STUDENT_BRANCHES[0],
        });
        if (res.profile.avatar_url && updateCurrentUser) {
          updateCurrentUser({ avatar_url: res.profile.avatar_url });
        }
      } else {
        setFetchError(res?.error || 'Unable to load profile data from MySQL.');
      }
    } catch (err) {
      setFetchError(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile(false);
  }, [user]);

  // Handle Edit form change
  const handleEditChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (editErrors[field]) {
      setEditErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setSaveError('');
    setSaveSuccess('');
  };

  // Validate Edit form
  const validateEdit = () => {
    const errs = {};
    if (!editForm.email || !editForm.email.trim()) {
      errs.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email.trim())) {
        errs.email = 'Please enter a valid email address (e.g., student@college.edu).';
      } else if (editForm.email.trim().length > 100) {
        errs.email = 'Email address cannot exceed 100 characters.';
      }
    }

    if (editForm.department && editForm.department.trim().length > 100) {
      errs.department = 'Department name cannot exceed 100 characters.';
    }

    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const updates = {
        email: editForm.email.trim(),
        department: editForm.department.trim(),
      };

      const res = await studentService.updateProfile(updates);
      if (res && res.success && res.profile) {
        setProfile(res.profile);
        setSaveSuccess('Profile details updated and saved permanently in MySQL.');
        setIsEditing(false);
        if (updateCurrentUser) {
          updateCurrentUser({
            email: res.profile.email,
            department: res.profile.department,
          });
        }
      } else {
        setSaveError(res?.error || 'Failed to save profile updates.');
      }
    } catch (err) {
      setSaveError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        email: profile.email || '',
        department: normalizeBranch(profile.department) || STUDENT_BRANCHES[0],
      });
    }
    setEditErrors({});
    setSaveError('');
    setIsEditing(false);
  };

  // Handle Password form change
  const handlePwdChange = (field) => (e) => {
    setPwdForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (pwdErrors[field]) {
      setPwdErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setPwdError('');
    setPwdSuccess('');
  };

  // Validate Password form
  const validatePwd = () => {
    const errs = {};
    if (!pwdForm.currentPassword) {
      errs.currentPassword = 'Enter your current password.';
    }
    if (!pwdForm.newPassword) {
      errs.newPassword = 'Enter a new password.';
    } else if (pwdForm.newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters long.';
    } else if (pwdForm.newPassword.length > 128) {
      errs.newPassword = 'Password is too long (maximum 128 characters).';
    } else if (pwdForm.currentPassword && pwdForm.newPassword === pwdForm.currentPassword) {
      errs.newPassword = 'New password cannot be the same as your current password.';
    }

    if (!pwdForm.confirmPassword) {
      errs.confirmPassword = 'Confirm your new password.';
    } else if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle password update submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePwd()) return;

    setIsChangingPwd(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      const res = await studentService.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword,
      });

      if (res && res.success) {
        setPwdSuccess('Password updated successfully! Redirecting to login in 3 seconds...');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

        // Terminate client session and navigate to student login
        setTimeout(() => {
          if (logout) logout();
          navigate('/login/student', { replace: true });
        }, 2500);
      } else {
        setPwdError(res?.error || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      setPwdError(err.message || 'Error occurred while updating password.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  // ── Profile Photo Upload & Removal Handlers ──
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatarFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAvatarFile = async (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Please select a valid image file (JPG, PNG, WebP, or GIF).');
      setAvatarSuccess('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File size exceeds 5MB limit. Please choose a smaller photo.');
      setAvatarSuccess('');
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const res = await studentService.uploadAvatar(file);
      if (res && res.success && res.avatar_url) {
        setProfile((prev) => ({ ...prev, avatar_url: res.avatar_url }));
        if (updateCurrentUser) {
          updateCurrentUser({ avatar_url: res.avatar_url });
        }
        setAvatarSuccess('Profile picture updated successfully! Visible across your Topbar and Portal.');
      } else {
        setAvatarError(res?.error || 'Failed to upload profile picture.');
      }
    } catch (err) {
      setAvatarError(err.message || 'Error occurred while uploading profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const res = await studentService.deleteAvatar();
      if (res && res.success) {
        setProfile((prev) => ({ ...prev, avatar_url: null }));
        if (updateCurrentUser) {
          updateCurrentUser({ avatar_url: null });
        }
        setAvatarSuccess('Profile picture removed. Reverted to default initials avatar.');
      } else {
        setAvatarError(res?.error || 'Failed to remove profile picture.');
      }
    } catch (err) {
      setAvatarError(err.message || 'Error occurred while removing profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Current active avatar
  const currentAvatarUrl = profile?.avatar_url || user?.avatar_url;

  // Derive initials for avatar
  const displayName = profile?.full_name || user?.name || 'Student';
  const displayStudentId = profile?.student_id || user?.student_id || user?.username || 'STU-2024-001';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format date
  const registeredDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Student Record';

  return (
    <div className="app-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <Topbar
          title="Student Profile"
          subtitle="View and manage your registered identity, academic details, and account security"
        />

        <div className="page-body" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
          {/* ── Loading Skeleton / State ── */}
          {isLoading ? (
            <div
              className="card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <RefreshCw size={28} className="spin-icon" style={{ color: '#0ea5e9' }} />
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6 }}>
                  Loading Student Profile...
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--navy-500)', margin: 0 }}>
                  Retrieving your authenticated account details from MySQL database.
                </p>
              </div>
            </div>
          ) : fetchError ? (
            /* ── Error Banner With Retry ── */
            <div
              className="card"
              style={{
                padding: '32px 24px',
                borderLeft: '4px solid #ef4444',
                background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6, fontSize: '1rem' }}>
                    Unable to Load Student Profile
                  </h4>
                  <p style={{ color: isDark ? '#fca5a5' : '#7f1d1d', fontSize: '0.875rem', marginBottom: 16 }}>
                    {fetchError}
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => loadProfile(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} /> Retry Loading
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── Global Feedback Alerts ── */}
              {avatarSuccess && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle size={18} />
                  <span>{avatarSuccess}</span>
                </div>
              )}

              {avatarError && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{avatarError}</span>
                </div>
              )}

              {saveSuccess && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle size={18} />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{saveError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle size={18} />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              {/* ── 1. Profile Header Hero Card ── */}
              <div
                className="card"
                style={{
                  padding: '24px 28px',
                  marginBottom: 24,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 20,
                  }}
                >
                  {/* Left: Avatar & Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: 22,
                          background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '1.85rem',
                          fontWeight: 800,
                          boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {currentAvatarUrl ? (
                          <img
                            src={currentAvatarUrl}
                            alt={displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload or Change Profile Picture"
                        style={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#0ea5e9',
                          border: '2px solid #fff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Camera size={13} />
                      </button>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                          {displayName}
                        </h2>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10b981',
                            borderRadius: 20,
                            padding: '2px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                            }}
                          />
                          Active Account
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          marginTop: 6,
                          fontSize: '0.8125rem',
                          color: 'var(--navy-600)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Shield size={14} style={{ color: '#0ea5e9' }} />
                          <strong>Student ID:</strong> {displayStudentId}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <GraduationCap size={14} style={{ color: '#10b981' }} />
                          {profile?.department || 'Department Unassigned'}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={14} style={{ color: 'var(--navy-400)' }} />
                          Registered {registeredDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Navigation to My Reports */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate('/student/myreports')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
                      title="View all your submitted complaints"
                    >
                      <FileText size={14} /> My Reports History
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => loadProfile(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Refresh Profile from Database"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 2. Main Two-Column Content Grid ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 24,
                  alignItems: 'start',
                }}
              >
                {/* ── Left Column: Academic & Contact Details (Editable) + Identity Info ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Card A: Academic & Contact Details */}
                  <div className="card" style={{ padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: 20 }}>
                      <div className="card-title">
                        <GraduationCap size={18} style={{ color: '#0ea5e9' }} />
                        <span>Academic & Contact Information</span>
                      </div>
                      {!isEditing && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            if (profile) {
                              setEditForm({
                                email: profile.email || '',
                                department: normalizeBranch(profile.department) || STUDENT_BRANCHES[0],
                              });
                            }
                            setIsEditing(true);
                            setSaveSuccess('');
                            setSaveError('');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
                        >
                          <Edit3 size={14} /> Edit Details
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      /* ── Edit Form ── */
                      <form onSubmit={handleSaveProfile} noValidate>
                        {/* Department Field */}
                        <div className="form-group" style={{ marginBottom: 16 }}>
                          <label
                            className="form-label"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}
                          >
                            <Building size={14} style={{ color: '#0ea5e9' }} />
                            <span>Department / Branch</span>
                          </label>
                          <select
                            id="student-branch-select"
                            className="form-control"
                            value={editForm.department}
                            onChange={handleEditChange('department')}
                            style={{
                              width: '100%',
                              borderColor: editErrors.department ? '#ef4444' : undefined,
                            }}
                          >
                            {STUDENT_BRANCHES.map((branch) => (
                              <option key={branch} value={branch}>
                                {branch}
                              </option>
                            ))}
                          </select>
                          {editErrors.department ? (
                            <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                              {editErrors.department}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginTop: 4 }}>
                              Select from the 3 official college departments.
                            </div>
                          )}
                        </div>

                        {/* Email Field */}
                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label
                            className="form-label"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}
                          >
                            <Mail size={14} style={{ color: '#0ea5e9' }} />
                            <span>Registered College Email</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={editForm.email}
                            onChange={handleEditChange('email')}
                            placeholder="student@student.iiit.ac.in"
                            maxLength={100}
                            required
                            style={{
                              width: '100%',
                              borderColor: editErrors.email ? '#ef4444' : undefined,
                            }}
                          />
                          {editErrors.email ? (
                            <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                              {editErrors.email}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginTop: 4 }}>
                              Must be a unique, valid email address. Used for official college notifications.
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <X size={14} /> Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={isSaving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            {isSaving ? (
                              <>
                                <RefreshCw size={14} className="spin-icon" /> Saving to MySQL...
                              </>
                            ) : (
                              <>
                                <Save size={14} /> Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* ── Read-Only Display ── */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--navy-50)',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--navy-200)'}`,
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginBottom: 2 }}>
                            Department / Academic Discipline
                          </div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                            {profile?.department || 'Not specified'}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--navy-50)',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--navy-200)'}`,
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginBottom: 2 }}>
                            Registered Email Address
                          </div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                            {profile?.email || 'No email registered'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card B: Personal Identity Information (Read-Only) */}
                  <div className="card" style={{ padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: 14 }}>
                      <div className="card-title">
                        <Lock size={18} style={{ color: 'var(--navy-500)' }} />
                        <span>Registered Identity (Read-Only)</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(14, 165, 233, 0.1)',
                          color: '#0ea5e9',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        Institutional Record
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--navy-500)', marginBottom: 18, lineHeight: 1.5 }}>
                      Official student identities and credentials are administrator-managed to prevent identity spoofing
                      and guarantee complaint integrity.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--navy-100)' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>Full Name</span>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--navy-800)' }}>{profile?.full_name}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--navy-100)' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>Student ID / IRN</span>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--navy-800)', fontFamily: 'monospace' }}>
                          {profile?.student_id}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--navy-100)' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>Portal Role</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize', color: '#0ea5e9' }}>
                          {profile?.role} Member
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--navy-500)' }}>Account Status</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#10b981' }}>
                          {profile?.is_active ? 'Active & Verified' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Account Security & Password Management ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Card: Student Profile Picture */}
                  <div className="card" style={{ padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: 16 }}>
                      <div className="card-title">
                        <Camera size={18} style={{ color: '#0ea5e9' }} />
                        <span>Student Profile Picture</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: currentAvatarUrl ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.1)',
                          color: currentAvatarUrl ? '#10b981' : '#0ea5e9',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: currentAvatarUrl ? '#10b981' : '#0ea5e9',
                          }}
                        />
                        {currentAvatarUrl ? 'Custom Photo Active' : 'Default Initials'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--navy-500)', marginBottom: 18, lineHeight: 1.5 }}>
                      Upload and manage your student profile photo. Your picture will be displayed across your Topbar avatar, profile security popup, and campus water issue submissions.
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                        padding: '16px',
                        borderRadius: 12,
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--navy-50)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--navy-200)'}`,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '1.75rem',
                          fontWeight: 800,
                          boxShadow: '0 6px 20px rgba(14, 165, 233, 0.3)',
                          overflow: 'hidden',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        {currentAvatarUrl ? (
                          <img
                            src={currentAvatarUrl}
                            alt={displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          initials
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 2 }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: '0.78125rem', color: 'var(--navy-500)', marginBottom: 10, fontFamily: 'monospace' }}>
                          {displayStudentId}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78125rem' }}
                          >
                            {isUploadingAvatar ? (
                              <>
                                <RefreshCw size={13} className="spin-icon" /> Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud size={13} /> {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
                              </>
                            )}
                          </button>
                          {currentAvatarUrl && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={handleRemoveAvatar}
                              disabled={isUploadingAvatar}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.78125rem',
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                              }}
                              title="Revert to system initials avatar"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Drag and drop upload zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) uploadAvatarFile(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '16px',
                        borderRadius: 10,
                        border: `2px dashed ${
                          dragOver ? '#0ea5e9' : isDark ? 'rgba(255, 255, 255, 0.15)' : 'var(--navy-200)'
                        }`,
                        background: dragOver
                          ? 'rgba(14, 165, 233, 0.08)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.02)'
                          : '#fafafa',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <ImageIcon size={22} style={{ color: '#0ea5e9', margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 2 }}>
                        Click to browse or drag & drop student image here
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: 'var(--navy-400)' }}>
                        Supported: JPG, PNG, WebP or GIF (Up to 5MB)
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Card C: Change Password */}
                  <div className="card" style={{ padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: 16 }}>
                      <div className="card-title">
                        <Key size={18} style={{ color: '#f59e0b' }} />
                        <span>Security & Password</span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: '0.75rem', color: isDark ? '#fcd34d' : '#92400e', lineHeight: 1.4 }}>
                        Updating your password will hash your new credentials with <strong>bcrypt</strong> and securely
                        terminate your current session, requiring you to sign in again.
                      </div>
                    </div>

                    {pwdError && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 16,
                        }}
                      >
                        <AlertCircle size={16} />
                        <span>{pwdError}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} noValidate>
                      {/* Current Password */}
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: 4 }}>
                          Current Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPwd.current ? 'text' : 'password'}
                            className="form-control"
                            value={pwdForm.currentPassword}
                            onChange={handlePwdChange('currentPassword')}
                            placeholder="Enter your current password"
                            required
                            style={{
                              width: '100%',
                              paddingRight: 40,
                              borderColor: pwdErrors.currentPassword ? '#ef4444' : undefined,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd((p) => ({ ...p, current: !p.current }))}
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--navy-400)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={showPwd.current ? 'Hide password' : 'Show password'}
                          >
                            {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {pwdErrors.currentPassword && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                            {pwdErrors.currentPassword}
                          </div>
                        )}
                      </div>

                      {/* New Password */}
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: 4 }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPwd.new ? 'text' : 'password'}
                            className="form-control"
                            value={pwdForm.newPassword}
                            onChange={handlePwdChange('newPassword')}
                            placeholder="At least 8 characters"
                            required
                            style={{
                              width: '100%',
                              paddingRight: 40,
                              borderColor: pwdErrors.newPassword ? '#ef4444' : undefined,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd((p) => ({ ...p, new: !p.new }))}
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--navy-400)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={showPwd.new ? 'Hide password' : 'Show password'}
                          >
                            {showPwd.new ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {pwdErrors.newPassword ? (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                            {pwdErrors.newPassword}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', marginTop: 4 }}>
                            Minimum 8 characters. Must be different from your current password.
                          </div>
                        )}
                      </div>

                      {/* Confirm New Password */}
                      <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label" style={{ fontSize: '0.8125rem', marginBottom: 4 }}>
                          Confirm New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPwd.confirm ? 'text' : 'password'}
                            className="form-control"
                            value={pwdForm.confirmPassword}
                            onChange={handlePwdChange('confirmPassword')}
                            placeholder="Re-enter your new password"
                            required
                            style={{
                              width: '100%',
                              paddingRight: 40,
                              borderColor: pwdErrors.confirmPassword ? '#ef4444' : undefined,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd((p) => ({ ...p, confirm: !p.confirm }))}
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--navy-400)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={showPwd.confirm ? 'Hide password' : 'Show password'}
                          >
                            {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {pwdErrors.confirmPassword && (
                          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                            {pwdErrors.confirmPassword}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isChangingPwd}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 16px',
                        }}
                      >
                        {isChangingPwd ? (
                          <>
                            <RefreshCw size={15} className="spin-icon" /> Updating Password...
                          </>
                        ) : (
                          <>
                            <Key size={15} /> Update Password & Re-login
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Card D: Report Ownership Guarantee Note */}
                  <div
                    className="card"
                    style={{
                      padding: '20px',
                      background: isDark ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc',
                      border: '1px solid var(--navy-200)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <CheckCircle size={18} color="#10b981" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy-800)', margin: 0 }}>
                        Complaint History Guarantee
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--navy-600)', lineHeight: 1.5, margin: 0 }}>
                      All complaints you have submitted are linked to your permanent internal database ID. Updating your
                      department, email, or login password will never remove or alter your existing reports.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
