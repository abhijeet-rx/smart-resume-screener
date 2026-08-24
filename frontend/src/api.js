/**
 * Smart Resume Screener — API Client Layer
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');
    return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

let currentApiKey = localStorage.getItem('srs_api_key') || '';

export function setApiKey(key) {
  currentApiKey = key;
  if (key) {
    localStorage.setItem('srs_api_key', key);
  } else {
    localStorage.removeItem('srs_api_key');
  }
}

export function getApiKey() {
  return currentApiKey;
}

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };

  if (currentApiKey) {
    headers['X-API-Key'] = currentApiKey;
  }

  // Don't set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        if (typeof errData.detail === 'string') {
          errorMessage = errData.detail;
        } else if (Array.isArray(errData.detail)) {
          errorMessage = errData.detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
        }
      }
    } catch {
      // Ignore JSON parse error on non-JSON response
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Jobs
  listJobs: (skip = 0, limit = 20) => request(`/jobs?skip=${skip}&limit=${limit}`),
  
  getJob: (jobId) => request(`/jobs/${jobId}`),

  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),

  createJob: async ({ jdText, jdFile, customTitle, requiredSkills, preferredSkills, experienceRequired, customRequirements }) => {
    const formData = new FormData();
    if (jdText?.trim()) {
      formData.append('jd_text', jdText.trim());
    }
    if (jdFile) {
      formData.append('jd_file', jdFile);
    }
    if (customTitle?.trim()) {
      formData.append('custom_title', customTitle.trim());
    }
    if (requiredSkills?.trim()) {
      formData.append('custom_required_skills', requiredSkills.trim());
    }
    if (preferredSkills?.trim()) {
      formData.append('custom_preferred_skills', preferredSkills.trim());
    }
    if (experienceRequired !== undefined && experienceRequired !== null && experienceRequired !== '') {
      formData.append('custom_experience_years', String(experienceRequired));
    }
    if (customRequirements?.trim()) {
      formData.append('custom_requirements', customRequirements.trim());
    }
    return request('/jobs', {
      method: 'POST',
      body: formData,
    });
  },

  // Screening
  screenResumes: async (jobId, resumeFiles) => {
    const formData = new FormData();
    for (const file of resumeFiles) {
      formData.append('resumes', file);
    }
    return request(`/jobs/${jobId}/screen`, {
      method: 'POST',
      body: formData,
    });
  },

  // Candidates
  listCandidates: (jobId, skip = 0, limit = 50) => 
    request(`/jobs/${jobId}/candidates?skip=${skip}&limit=${limit}`),

  getCandidateDetail: (candidateId) => request(`/candidates/${candidateId}`),
};
