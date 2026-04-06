import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    File, Upload, X, Check, 
    Download, Trash2, FileText, 
    Image as ImageIcon, MoreVertical 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const TaskFileVault = ({ taskId, attachments = [], onUploadSuccess, onDeleteSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pastedFiles, setPastedFiles] = useState([]);

    const handleFileUpload = async (files) => {
        if (files.length === 0) return;
        setUploading(true);
        const token = localStorage.getItem('token');

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch(`${API}/api/tasks/${taskId}/files`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (!res.ok) throw new Error('Upload failed');
                
                const data = await res.json();
                onUploadSuccess(data.attachment);
                toast.success(`Uploaded: ${file.name}`);
            }
        } catch (error) {
            toast.error('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/tasks/${taskId}/files/${fileId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');
            onDeleteSuccess(fileId);
            toast.success('File removed');
        } catch (error) {
            toast.error('Failed to delete file');
        }
    };

    const getFileIcon = (type) => {
        if (type?.includes('image')) return <ImageIcon size={18} />;
        if (type?.includes('pdf')) return <FileText size={18} />;
        return <File size={18} />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 2;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 800 }}>The Vault</h3>
                <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{attachments.length} Assets</span>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileUpload(e.dataTransfer.files);
                }}
                style={{
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    background: isDragging ? 'rgba(245,158,11,0.05)' : 'rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                onClick={() => document.getElementById(`file-input-${taskId}`).click()}
            >
                <input 
                    type="file" 
                    id={`file-input-${taskId}`} 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleFileUpload(e.target.files)}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                        width: '42px', height: '42px', borderRadius: '12px', 
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#F59E0B'
                    }}>
                        {uploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload size={20} /></motion.div> : <Upload size={20} />}
                    </div>
                    <div>
                        <div style={{ color: '#CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}>Drag & Drop Assets</div>
                        <div style={{ color: '#64748B', fontSize: '0.7rem', marginTop: '0.25rem' }}>PDF, Images, or Text (Max 10MB)</div>
                    </div>
                </div>
            </div>

            {/* File List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                <AnimatePresence>
                    {attachments.map((file) => (
                        <motion.div
                            key={file._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -4, background: 'rgba(255,255,255,0.05)' }}
                            style={{
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px', padding: '0.75rem', position: 'relative', overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ color: '#F59E0B' }}>{getFileIcon(file.type)}</div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(file._id); }}
                                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.2rem' }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <div style={{ 
                                color: '#F8FAFC', fontSize: '0.75rem', fontWeight: 600, 
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                marginBottom: '0.2rem'
                            }}>
                                {file.name}
                            </div>
                            <div style={{ color: '#64748B', fontSize: '0.6rem' }}>{formatSize(file.size)}</div>

                            {/* Download Button overlayed or quick action */}
                            <a 
                                href={file.url.startsWith('/') ? `${API}${file.url}` : file.url} 
                                target="_blank" rel="noopener noreferrer"
                                style={{
                                    position: 'absolute', inset: 0, opacity: 0, zIndex: 1
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TaskFileVault;
