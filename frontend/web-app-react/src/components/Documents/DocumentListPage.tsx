import React, { useEffect, useState } from 'react';
import { getDocuments, downloadDocument } from '../../services/apiService';
import { Typography, Container, Box, List, ListItem, ListItemText, Button, Paper, CircularProgress, Alert, IconButton } from '@mui/material';
import { Download as DownloadIcon, Visibility as VisibilityIcon } from '@mui/icons-material'; // For view/download icons

interface Document {
  doc_id: number;
  title: string;
  status: string;
  current_version_number: number;
  updated_at: string;
  category_name?: string;
  uploader_username?: string;
}

const DocumentListPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getDocuments();
        setDocuments(response.data);
      } catch (err: any) {
        console.error('Failed to fetch documents:', err);
        setError(err.response?.data?.message || 'Failed to load documents.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleDownload = async (docId: number, fileName: string, version?: number) => {
    try {
      const response = await downloadDocument(docId, version);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Use a more generic filename if original is not available, or pass it if known
      link.setAttribute('download', fileName || `document-${docId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed.');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Document List
        </Typography>
        {documents.length === 0 ? (
          <Typography>No documents found.</Typography>
        ) : (
          <Paper elevation={3}>
            <List>
              {documents.map((doc) => (
                <ListItem
                  key={doc.doc_id}
                  divider
                  secondaryAction={
                    <>
                      {/* <IconButton edge="end" aria-label="view" sx={{ mr: 1 }}>
                        <VisibilityIcon />
                      </IconButton> */}
                      <IconButton
                        edge="end"
                        aria-label="download"
                        onClick={() => handleDownload(doc.doc_id, `${doc.title.replace(/ /g, '_')}_v${doc.current_version_number}.${doc.title.split('.').pop() || 'file'}` , doc.current_version_number)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText
                    primary={doc.title}
                    secondary={`Version: ${doc.current_version_number} | Status: ${doc.status} | Category: ${doc.category_name || 'N/A'} | Uploader: ${doc.uploader_username || 'N/A'} | Last Updated: ${new Date(doc.updated_at).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
         <Box sx={{ mt: 3 }}>
            <Button component="a" href="/dashboard" variant="outlined" color="primary" sx={{ mr: 2 }}>
                Back to Dashboard
            </Button>
            {/* TODO: Add Upload Document Button here, linking to an upload page/modal */}
            {/* <Button variant="contained" color="primary">Upload New Document</Button> */}
        </Box>
      </Box>
    </Container>
  );
};

export default DocumentListPage;
