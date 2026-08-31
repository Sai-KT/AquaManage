/**
 * validation.js — Centralized Input Validation Engine for AquaManage
 */

export const validation = {
  // Validate student/user login
  loginCredentials(role, username, password) {
    const errors = [];
    if (!role || !['admin', 'maintenance', 'student'].includes(role)) {
      errors.push('A valid user role (admin, maintenance, student) is required.');
    }
    if (!username || typeof username !== 'string' || !username.trim()) {
      errors.push('Username / Identifier cannot be empty.');
    }
    if (role !== 'student' && (!password || typeof password !== 'string' || !password.trim())) {
      errors.push('Password cannot be empty.');
    }
    return {
      isValid: errors.length === 0,
      errors,
      errorMessage: errors.join(' '),
    };
  },

  // Validate complaint / report submission
  complaintReport({ type, zone, location, description }) {
    const errors = [];
    const ALLOWED_TYPES = ['Pipe Leak', 'Tap Wastage', 'Pipe Burst', 'Overflow', 'Sprinkler Fault', 'Blocked Drain', 'Other'];
    
    if (!type || typeof type !== 'string' || !ALLOWED_TYPES.includes(type.trim())) {
      errors.push('Please select a valid issue type from the allowed categories.');
    }
    if (!zone || typeof zone !== 'string' || !zone.trim()) {
      errors.push('Please select a campus zone/building.');
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      errors.push('Description must be at least 10 characters detailing the problem.');
    }
    if (description && description.length > 2000) {
      errors.push('Description is too long (maximum 2,000 characters).');
    }
    if (location && location.length > 250) {
      errors.push('Specific location text must be under 250 characters.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      errorMessage: errors.join(' '),
    };
  },

  // Validate maintenance work log
  workLog({ reportId, note, technicianName }) {
    const errors = [];
    if (!reportId || typeof reportId !== 'string' || !reportId.trim()) {
      errors.push('Report ID is required.');
    }
    if (!note || typeof note !== 'string' || note.trim().length < 3) {
      errors.push('Work log note must be at least 3 characters.');
    }
    if (note && note.length > 1000) {
      errors.push('Work log note must be under 1,000 characters.');
    }
    return {
      isValid: errors.length === 0,
      errors,
      errorMessage: errors.join(' '),
    };
  },

  // Validate technician ticket assignment
  ticketAssignment({ reportId, assignedName }) {
    const errors = [];
    if (!reportId || typeof reportId !== 'string') {
      errors.push('Report ID is required.');
    }
    if (!assignedName || typeof assignedName !== 'string') {
      errors.push('Technician name is required.');
    }
    return {
      isValid: errors.length === 0,
      errors,
      errorMessage: errors.join(' '),
    };
  },

  // Validate tank telemetry update
  tankTelemetry({ tankId, currentLitres }) {
    const errors = [];
    if (!tankId || typeof tankId !== 'number') {
      errors.push('Numeric tank ID is required.');
    }
    if (typeof currentLitres !== 'number' || currentLitres < 0) {
      errors.push('Current fill litres must be a positive number.');
    }
    return {
      isValid: errors.length === 0,
      errors,
      errorMessage: errors.join(' '),
    };
  },
};

export default validation;
