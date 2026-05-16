import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const UploadContext = createContext();

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState([]);

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
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: percentCompleted, buffer: Math.min(percentCompleted + 10, 100) } : u
          ));
        }
      };

      const response = method.toLowerCase() === 'put' 
        ? await api.put(url, formData, axiosConfig)
        : await api.post(url, formData, axiosConfig);

      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
      ));

      // Call the completion callback if provided
      if (onComplete) {
        onComplete(response.data);
      }

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }, 5000);

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
    <UploadContext.Provider value={{ uploads, startUpload }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  return useContext(UploadContext);
}
