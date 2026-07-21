import React from 'react';

const dispatchWhisper = (title: string, message: string, type: string = 'system') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', { 
            detail: { id: Date.now(), type, title, message } 
        }));
    }
};

export const toast = Object.assign(
    (message: string | React.ReactNode, data?: any) => {
        dispatchWhisper('Notification', String(message), 'system');
    },
    {
        success: (message: string | React.ReactNode, data?: any) => {
            dispatchWhisper('Success', String(message), 'success');
        },
        error: (message: string | React.ReactNode, data?: any) => {
            dispatchWhisper('Error', String(message), 'error');
        },
        info: (message: string | React.ReactNode, data?: any) => {
            dispatchWhisper('Info', String(message), 'system');
        },
        warning: (message: string | React.ReactNode, data?: any) => {
            dispatchWhisper('Warning', String(message), 'warning');
        },
        loading: (message: string | React.ReactNode, data?: any) => {
            dispatchWhisper('Loading', String(message), 'system');
            return 'loading-toast-id'; // Return mock ID for dismiss
        },
        dismiss: (id?: string) => {
            dispatchWhisper('Done', 'Action completed', 'system');
        },
        promise: (promise: Promise<any>, data: { loading: string, success: string | ((data: any) => string), error: string | ((error: any) => string) }) => {
            dispatchWhisper('Processing', data.loading, 'system');
            promise
                .then((res) => {
                    const successMsg = typeof data.success === 'function' ? data.success(res) : data.success;
                    dispatchWhisper('Success', successMsg, 'success');
                })
                .catch((err) => {
                    const errorMsg = typeof data.error === 'function' ? data.error(err) : data.error;
                    dispatchWhisper('Error', errorMsg, 'error');
                });
            return promise;
        }
    }
);
