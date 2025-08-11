import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Search, 
  Download, 
  RotateCcw, 
  Trash2, 
  FileText, 
  Calendar,
  HardDrive,
  Plus,
  Upload
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/axios';
import { nanoid } from "nanoid"; 
import FileUploadButton from '@/components/FileUploadButton';
// Simple toast hook (since sonner might be causing issues)


const InvoiceBackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: '',
    item: null
  });
  const { toast } = useToast();
  

  // Mock data for testing - Remove this when connecting to real API
  useEffect(() => {
    // Simulate loading state
    setLoading(true);
    
    // Mock data
    fetchBackups();
    setLoading(false);
    
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await api.get('/database/backups');
      
      
      if (response.statusText === 'OK') {
        const data = response.data.backups;
        // add every object a id
        data.forEach((item) => {
          item.id = nanoid();
        });
        setBackups(Array.isArray(data) ? data : []);
      } else {
        toast({title:'Error',
          description:"Failed to fetch backups ",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({title:'Error',
          description:"Error loading backups: " + error.message,
          variant: 'destructive',
        });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupAll = async () => {
    setLoading(true);
    try {
      const response = await api.post('/database/backup');

      if (response.statusText === 'OK') {
        toast({title:'Success',
          description:"Backup process started successfully",
          variant: 'default',
        });
        fetchBackups();
      } else {
        toast({title:'Error',
          description:"Failed to start backup process",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast({title:'Error',
          description:'Error creating backup: ' + error.message,
          variant: 'destructive',
        });
    } finally {
      setLoading(false);
    }
  };

 const handleDownload = async (item) => {
  setLoading(true);
  try {
    const filename = item.filename; // e.g. "backup_2025-07-14_06-05-58.sqlite"

    const response = await api.get(`/database/download/${filename}`, {
      responseType: 'blob', // important: tells axios to treat it as a binary blob
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Create a link and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Download Success',
      description: `Downloaded ${filename}`,
      variant: 'default',
    });
  } catch (error) {
    console.error('Download error:', error);
    toast({
      title: 'Error',
      description: 'Failed to download backup: ' + error.message,
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
    setConfirmDialog({ open: false, type: '', item: null });
  }
};
  const handleDelete = async (item) => {
    setLoading(true);
    try {
      
      const response = await api.delete(`/backup/${item.filename}`);
      console.log(response);
      
      if (response.status === 200) {
        toast({title:'Success',
          description:`Successfully Deleted ${item.filename}` ,
          variant: 'default',
        });
        setBackups(prev => prev.filter(backup => backup.id !== item.id));
      } else {
        toast.error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({title:'Error',
          description:'Failed to Delete backup: ' + error.message,
          variant: 'destructive',
        });
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, type: '', item: null });
    }
  };

  const handleUpload = async (file: File) => {
  const formData = new FormData()
  formData.append("backup", file)

  try {
    const res = await api.post("/database/restore/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    console.log("Uploaded:", res.data)
    return res.data
  } catch (error) {
    console.error("Upload failed:", error)
    throw error
  }
}

  const openConfirmDialog = (type, item) => {
    setConfirmDialog({ open: true, type, item });
  };

  // function for bytes to mb converter
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };
 

  const filteredBackups = (backups || []).filter(backup =>
    backup?.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Invoice Backups</h1>
              <p className="text-slate-600 mt-1">Manage your invoice backup files</p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleBackupAll}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {/* <Plus className="w-4 h-4 mr-2" /> */}
                Create Backup
              </Button>
              
               <FileUploadButton
                onUpload={async (file) => {
    try {
      const result = await handleUpload(file)
      toast({ title: "Success", description: "File uploaded successfully." })
    } catch (err) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" })
    }
  }}
                />
            </div>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search invoice backups... (e.g., SGP/0084/2025)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Backup List */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-pulse">Loading backups...</div>
                </CardContent>
              </Card>
            ) : filteredBackups.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No invoice backups found</p>
                </CardContent>
              </Card>
            ) : (
              filteredBackups.map((backup, index) => (
                <Card key={backup?.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {backup?.filename || 'Unknown'}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                            <div className="flex items-center">
                              <HardDrive className="w-4 h-4 mr-1" />
                              {formatFileSize(backup?.size) || 'N/A'}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {backup?.created_at ? new Date(backup.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                            <span className="text-slate-400">•</span>
                            <span>JSON Format</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* {getStatusBadge(backup?.status)} */}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openConfirmDialog('download', backup)}
                            disabled={loading || backup?.status === 'in-progress'}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openConfirmDialog('delete', backup)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: '', item: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'delete' ? 'Delete Backup' : 'Download Backup'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'delete' 
                ? `Are you sure you want to delete "${confirmDialog.item?.filename}"? This action cannot be undone.`
                : confirmDialog.item === 'all'
                ? 'Are you sure you want to restore all backups? This will replace current data.'
                : `Are you sure you want to restore "${confirmDialog.item?.filename}"? This will replace current data.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog({ open: false, type: '', item: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
              onClick={() => {
                if (confirmDialog.type === 'delete') {
                  handleDelete(confirmDialog.item);
                } else {
                  handleDownload(confirmDialog.item);
                }
              }}
              disabled={loading}
            >
              {confirmDialog.type === 'delete' ? 'Delete' : 'Download'}
            </Button>
           

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceBackupPage;
