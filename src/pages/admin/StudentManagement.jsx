import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Mail,
  Building2,
  KeyRound,
  IdCard,
  User,
  Filter,
  Check,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import adminService from '../../services/adminService';

const DEFAULT_DEPARTMENTS = [
  'Computer Engineering (Comp)',
  'Information Technology (IT)',
  'Electronics and Telecommunication (ENTC)',
];

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formDepartment, setFormDepartment] = useState('Computer Engineering (Comp)');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success notification toast
  const [successToast, setSuccessToast] = useState(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);

  // Delete modal state
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fullNameInputRef = useRef(null);

  const loadStudents = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setLoadError(null);
    const res = await adminService.getStudents();
    if (res && res.success) {
      setStudents(res.students || []);
    } else {
      setLoadError(res?.error || 'Unable to load registered students. Please check the server connection and try again.');
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadStudents(true);
  }, []);

  // Focus the first field when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => fullNameInputRef.current?.focus(), 80);
    }
  }, [isModalOpen]);

  const handleOpenModal = () => {
    setFormFullName('');
    setFormStudentId('');
    setFormDepartment('Computer Engineering (Comp)');
    setFormEmail('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleConfirmDelete = (student) => {
    setStudentToDelete(student);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setStudentToDelete(null);
    setDeleteError(null);
  };

  const handleExecuteDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const targetId = studentToDelete.id || studentToDelete.student_id;
    const res = await adminService.deleteStudent(targetId);

    if (res && res.success) {
      setIsDeleting(false);
      const deletedName = studentToDelete.full_name;
      const deletedCode = studentToDelete.student_id;
      setStudentToDelete(null);
      setSuccessToast(
        res.message || `Student account for ${deletedName} (${deletedCode}) has been completely deleted.`
      );
      await loadStudents(false);
    } else {
      setIsDeleting(false);
      setDeleteError(res?.error || 'Failed to completely delete the student account. Please try again.');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    const trimmedName = formFullName.trim();
    const trimmedId = formStudentId.trim().toUpperCase();
    const trimmedEmail = formEmail.trim().toLowerCase();
    const chosenDept = formDepartment || DEFAULT_DEPARTMENTS[0];

    if (!trimmedName) {
      setFormError('Full Name is required.');
      return;
    }
    if (!trimmedId) {
      setFormError('Student ID is required.');
      return;
    }
    if (!trimmedEmail) {
      setFormError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formPassword) {
      setFormError('Initial password is required.');
      return;
    }
    if (formPassword.length < 8) {
      setFormError('Initial password must be at least 8 characters long.');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setFormError('Initial password and password confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      full_name: trimmedName,
      student_id: trimmedId,
      department: chosenDept,
      email: trimmedEmail,
      password: formPassword,
      confirmPassword: formConfirmPassword,
    };

    const res = await adminService.createStudent(payload);

    if (res && res.success) {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setNewlyCreatedId(trimmedId);
      setSuccessToast(
        res.message || 'Student account created successfully. The student can now log in using their Student ID and initial password.'
      );
      await loadStudents(false);
    } else {
      setIsSubmitting(false);
      let errMsg = res?.error || 'Unable to create the student account. Please check the server connection and try again.';
      // Normalize duplicate error messages
      if (errMsg.toLowerCase().includes('student id')) {
        errMsg = 'This Student ID is already registered.';
      } else if (errMsg.toLowerCase().includes('email')) {
        errMsg = 'This email address is already associated with an account.';
      }
      setFormError(errMsg);
    }
  };

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.student_id || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q);

      const matchDept =
        deptFilter === 'all' ||
        (s.department || '').toLowerCase() === deptFilter.toLowerCase() ||
        (deptFilter === 'Computer Engineering (Comp)' && ((s.department || '').toLowerCase().includes('computer') || (s.department || '').toLowerCase() === 'comp')) ||
        (deptFilter === 'Information Technology (IT)' && ((s.department || '').toLowerCase().includes('information') || (s.department || '').toLowerCase() === 'it')) ||
        (deptFilter === 'Electronics and Telecommunication (ENTC)' && ((s.department || '').toLowerCase().includes('telecom') || (s.department || '').toLowerCase().includes('entc') || (s.department || '').toLowerCase().includes('e&tc')));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active);

      return matchSearch && matchDept && matchStatus;
    });
  }, [students, search, deptFilter, statusFilter]);

  // Dynamic statistics
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.is_active).length;
  const distinctDepts = new Set(students.map((s) => s.department).filter(Boolean)).size;

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Topbar
          title="Student Management"
          subtitle="Register new student credentials and manage authorized student accounts"
        />

        <div className="page-body">
          {/* ── Page Header & Quick Actions ── */}
          <div className="page-header" style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={18} style={{ color: '#10b981' }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Student Management</h2>
                </div>
                <p style={{ margin: 0, color: 'var(--navy-500)', fontSize: '0.875rem' }}>
                  Admin-controlled student credential registration. Registered students can log in immediately.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setIsRefreshing(true);
                    loadStudents(false);
                  }}
                  disabled={isRefreshing || isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Refresh student directory"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  id="add-student-btn"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    borderColor: '#10b981',
                    fontWeight: 700,
                  }}
                >
                  <UserPlus size={15} />
                  <span>Add Student</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Success Toast Banner ── */}
          {successToast && (
            <div
              style={{
                marginBottom: 20,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                animation: 'fadeUp 0.25s ease both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{successToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessToast(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#10b981',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ── Metrics Summary Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                  {totalCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', fontWeight: 600, marginTop: 3 }}>
                  Total Registered Students
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(14, 165, 233, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0ea5e9',
                }}
              >
                <CheckCircle size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                  {activeCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', fontWeight: 600, marginTop: 3 }}>
                  Active Accounts
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                  {distinctDepts}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--navy-500)', fontWeight: 600, marginTop: 3 }}>
                  Academic Departments
                </div>
              </div>
            </div>
          </div>

          {/* ── Filters & Search Bar ── */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
              }}
            >
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--navy-400)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by student name, ID, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--navy-900)',
                    fontSize: '0.8125rem',
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--navy-400)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Department filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 160 }}>
                <Filter size={14} style={{ color: 'var(--navy-400)' }} />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--navy-800)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Departments</option>
                  {DEFAULT_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--navy-800)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Main Content / Table Area ── */}
          {loadError ? (
            <div className="card" style={{ padding: '36px 24px', textAlign: 'center', borderColor: 'var(--red-400)' }}>
              <ShieldAlert size={44} style={{ color: 'var(--red-500)', margin: '0 auto 12px' }} />
              <h4 style={{ color: 'var(--red-600)', marginBottom: 8 }}>Server Connection Issue</h4>
              <p style={{ color: 'var(--navy-500)', maxWidth: 460, margin: '0 auto 16px' }}>{loadError}</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => loadStudents(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> Retry Loading
              </button>
            </div>
          ) : isLoading ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <RefreshCw size={32} className="spin-icon" style={{ color: '#10b981', margin: '0 auto 14px' }} />
              <p style={{ color: 'var(--navy-500)', fontSize: '0.9375rem', margin: 0 }}>
                Loading registered student directory from database...
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="card empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Users size={48} style={{ color: 'var(--navy-300)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--navy-800)' }}>No students registered yet.</h4>
              <p style={{ color: 'var(--navy-500)', maxWidth: 420, margin: '0 auto 18px', fontSize: '0.875rem' }}>
                No student accounts currently exist in the database. Use the button below to register the first student.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  borderColor: '#10b981',
                }}
              >
                <UserPlus size={15} /> Add Student
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="card empty-state" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <Search size={40} style={{ color: 'var(--navy-300)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--navy-800)' }}>No students match your search</h4>
              <p style={{ color: 'var(--navy-500)', margin: '0 auto 16px', fontSize: '0.875rem' }}>
                No registered student matches &quot;{search}&quot;. Try adjusting your filter parameters.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setDeptFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--navy-50)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Student ID
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Full Name
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Department
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Email
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Registered On
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-600)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => {
                      const isNewlyAdded = newlyCreatedId && s.student_id === newlyCreatedId;
                      return (
                        <tr
                          key={s.id || s.student_id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: isNewlyAdded ? 'rgba(16, 185, 129, 0.08)' : undefined,
                            transition: 'background 0.2s ease',
                          }}
                        >
                          {/* Student ID */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.8125rem',
                                  fontWeight: 700,
                                  color: 'var(--teal-700)',
                                  background: 'rgba(14, 165, 233, 0.1)',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  border: '1px solid rgba(14, 165, 233, 0.2)',
                                }}
                              >
                                {s.student_id || '—'}
                              </span>
                              {isNewlyAdded && (
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    fontWeight: 800,
                                    color: '#fff',
                                    background: '#10b981',
                                    padding: '1px 6px',
                                    borderRadius: 8,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px',
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Full Name */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {(s.full_name || 'S')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.875rem' }}>
                                {s.full_name}
                              </span>
                            </div>
                          </td>

                          {/* Department */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--navy-700)', fontWeight: 500 }}>
                              {s.department || 'General'}
                            </span>
                          </td>

                          {/* Email */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--navy-600)' }}>
                              <Mail size={13} style={{ color: 'var(--navy-400)', flexShrink: 0 }} />
                              <a
                                href={`mailto:${s.email}`}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {s.email || '—'}
                              </a>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                background: s.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: s.is_active ? '#10b981' : '#ef4444',
                                border: `1px solid ${s.is_active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: s.is_active ? '#10b981' : '#ef4444',
                                }}
                              />
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Registered On */}
                          <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--navy-500)' }}>
                            {formatDate(s.created_at)}
                          </td>

                          {/* Actions: Delete Student */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-delete-student"
                              onClick={() => handleConfirmDelete(s)}
                              title={`Completely delete ${s.full_name} (${s.student_id})`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 10px',
                                borderRadius: 7,
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer status */}
              <div
                style={{
                  padding: '12px 18px',
                  background: 'var(--navy-50)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--navy-500)',
                }}
              >
                <span>
                  Showing {filteredStudents.length} of {totalCount} registered student{totalCount === 1 ? '' : 's'}
                </span>
                <span>Role: student · MySQL-backed identity persistence</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADD STUDENT MODAL
          ══════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.18s ease both',
          }}
        >
          <div
            className="modal-dialog card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 16,
              padding: 0,
              border: '1px solid var(--border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              animation: 'fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <UserPlus size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800 }}>Register New Student</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--navy-500)' }}>
                Create a database credential for student login and persistent complaint reporting.
              </p>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--navy-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStudent} style={{ padding: '20px 24px' }}>
              {/* Error Banner */}
              {formError && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Field 1: Full Name */}
              <div style={{ marginBottom: 14 }}>
                <label
                  htmlFor="student-full-name"
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--navy-700)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--navy-400)',
                    }}
                  />
                  <input
                    id="student-full-name"
                    ref={fullNameInputRef}
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--card-bg)',
                      color: 'var(--navy-900)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              {/* Field 2 & 3: Student ID and Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {/* Student ID */}
                <div>
                  <label
                    htmlFor="student-id-input"
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--navy-700)',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Student ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <IdCard
                      size={14}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--navy-400)',
                      }}
                    />
                    <input
                      id="student-id-input"
                      type="text"
                      required
                      placeholder="e.g. STU-2024-003"
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* Department Selection */}
                <div>
                  <label
                    htmlFor="student-dept-select"
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--navy-700)',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Department
                  </label>
                  <select
                    id="student-dept-select"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--card-bg)',
                      color: 'var(--navy-900)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {DEFAULT_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4: Email Address */}
              <div style={{ marginBottom: 14 }}>
                <label
                  htmlFor="student-email-input"
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--navy-700)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--navy-400)',
                    }}
                  />
                  <input
                    id="student-email-input"
                    type="email"
                    required
                    placeholder="e.g. rahul@example.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--card-bg)',
                      color: 'var(--navy-900)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              {/* Field 5 & 6: Initial Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {/* Initial Password */}
                <div>
                  <label
                    htmlFor="student-init-pwd"
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--navy-700)',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Initial Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={14}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--navy-400)',
                      }}
                    />
                    <input
                      id="student-init-pwd"
                      type="password"
                      required
                      placeholder="Min 8 characters"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="student-confirm-pwd"
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--navy-700)',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={14}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--navy-400)',
                      }}
                    />
                    <input
                      id="student-confirm-pwd"
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={formConfirmPassword}
                      onChange={(e) => setFormConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)',
                        color: 'var(--navy-900)',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Password Matching Live Indicator */}
              {formPassword && formConfirmPassword && (
                <div
                  style={{
                    marginTop: -12,
                    marginBottom: 16,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: formPassword === formConfirmPassword ? '#10b981' : '#ef4444',
                  }}
                >
                  {formPassword === formConfirmPassword ? (
                    <>
                      <Check size={13} /> Passwords match
                    </>
                  ) : (
                    <>
                      <X size={13} /> Passwords do not match
                    </>
                  )}
                </div>
              )}

              {/* Modal Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="submit-student-btn"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    borderColor: '#10b981',
                    fontWeight: 700,
                    minWidth: 130,
                    justifyContent: 'center',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Create Student</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE STUDENT CONFIRMATION MODAL
          ══════════════════════════════════════════════════════════ */}
      {studentToDelete && (
        <div
          className="modal-backdrop"
          onClick={handleCloseDeleteModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.18s ease both',
          }}
        >
          <div
            className="modal-dialog card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              borderRadius: 16,
              padding: 0,
              border: '1px solid var(--border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              animation: 'fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                    Delete Student Account
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--navy-500)' }}>
                    Permanent removal from database
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  background: 'none',
                  border: 'none',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  color: 'var(--navy-400)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                }}
                title="Cancel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--navy-700)', lineHeight: 1.5 }}>
                Are you sure you want to completely delete student{' '}
                <strong style={{ color: 'var(--navy-900)' }}>{studentToDelete.full_name}</strong>?
              </p>

              {/* Student Summary Card */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--navy-50)',
                  border: '1px solid var(--border)',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--navy-400)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Student ID
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                    {studentToDelete.student_id}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--navy-400)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Department
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                    {studentToDelete.department || 'General'}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--navy-400)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Email Address
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                    {studentToDelete.email}
                  </div>
                </div>
              </div>

              {/* Warning Alert */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#dc2626',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  This action is permanent and cannot be undone. Active login sessions will be immediately terminated and the student will no longer have access to the system.
                </span>
              </div>

              {deleteError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid #ef4444',
                    color: '#dc2626',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginTop: 12,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 10,
                padding: '14px 24px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--navy-50)',
              }}
            >
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-delete-student-btn"
                className="btn btn-sm"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#fff',
                  fontWeight: 700,
                  minWidth: 150,
                  justifyContent: 'center',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Delete Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
