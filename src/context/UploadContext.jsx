import React, { createContext, useContext, useState } from 'react';
import { uploadApi } from '../api/axios';

const UploadContext = createContext();

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState(() => {
    try {
      const saved = localStorage.getItem('active_uploads');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // If we reloaded while uploading, mark as error/interrupted
      return parsed.map(u => 
        u.status === 'uploading' 
          ? { ...u, status: 'error', error: 'Yuklash toʻxtatildi (sahifa yangilandi)' } 
          : u
      );
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem('active_uploads', JSON.stringify(uploads));
  }, [uploads]);

  const startUpload = async (url, formData, metadata, method = 'post', onComplete = null) => {
    const uploadId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    const newUpload = {
      id: uploadId,
      progress: 0,
      buffer: 10,
      metadata,
      status: 'uploading'
    };

    setUploads(prev => [...prev, newUpload]);

    try {
      const axiosConfig = {
        _isUpload: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: percentCompleted, buffer: Math.min(percentCompleted + 10, 100) } : u
          ));
        }
      };

      const response = method.toLowerCase() === 'put' 
        ? await uploadApi.put(url, formData, axiosConfig)
        : await uploadApi.post(url, formData, axiosConfig);

      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
      ));

      if (onComplete) {
        onComplete(response.data);
      }

      // Auto-remove after 10 seconds (increased from 5 for visibility)
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }, 10000);

      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'error', error: error.response?.data?.message || error.message } : u
      ));
      return { error };
    }
  };

  return (
    <UploadContext.Provider value={{ uploads, setUploads, startUpload }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  return useContext(UploadContext);
}
