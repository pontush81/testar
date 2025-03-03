import React, { useState } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface DeletePageModalProps {
  pageId: string;
  pageName: string;
  onClose: () => void;
  onDelete: () => void;
  darkMode: boolean;
}

const DeletePageModal: React.FC<DeletePageModalProps> = ({ 
  pageId, 
  pageName, 
  onClose, 
  onDelete,
  darkMode 
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      console.log('Attempting to delete page with ID:', pageId);
      
      // First check if the page exists
      const { data: pageExists, error: checkError } = await supabase
        .from('pages')
        .select('id')
        .eq('id', pageId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking if page exists:', checkError);
        throw checkError;
      }
      
      if (!pageExists) {
        console.log('Page not found in database, nothing to delete');
        onDelete();
        onClose();
        return;
      }
      
      // Delete from Supabase
      const { error: deleteError } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);
      
      if (deleteError) {
        console.error('Error from Supabase when deleting:', deleteError);
        throw deleteError;
      }
      
      console.log('Page successfully deleted:', pageId);
      
      // Call the onDelete callback to update the UI
      onDelete();
      onClose();
    } catch (err: any) {
      console.error('Error deleting page:', err);
      setError(err.message || 'Ett fel uppstod när sidan skulle raderas');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-sm md:max-w-md rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-bold">Radera sida</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-700"
            aria-label="Stäng"
          >
            <X size={24} />
          </button>
        </div>
        
        {error && (
          <div className={`m-4 p-3 rounded-md flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className={`p-3 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <Trash2 size={24} className={darkMode ? 'text-red-300' : 'text-red-500'} />
            </div>
          </div>
          
          <p className="text-center mb-6">
            Är du säker på att du vill radera sidan <span className="font-bold">{pageName}</span>?
          </p>
          
          <p className={`text-center mb-6 text-sm ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
            Denna åtgärd kan inte ångras.
          </p>
        </div>
        
        <div className={`flex justify-end gap-2 p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Avbryt
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Raderar...
              </>
            ) : (
              <>
                <Trash2 size={18} className="mr-2" />
                Radera
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePageModal;