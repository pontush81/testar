import React, { useState, useEffect, useRef } from 'react';
import CustomReactQuill from './CustomReactQuill';
import 'react-quill/dist/quill.snow.css';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RichTextEditorProps {
  content: string;
  pageId: string;
  onClose: () => void;
  onSave: (content: string) => void;
  darkMode: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  pageId, 
  onClose, 
  onSave,
  darkMode 
}) => {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Add class to body to prevent scrolling when editor is open
    document.body.classList.add('overflow-hidden');
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('Saving content for page:', pageId);
      
      // Check if the page exists
      const { data: pageExists, error: checkError } = await supabase
        .from('pages')
        .select('id')
        .eq('id', pageId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking if page exists:', checkError);
        throw checkError;
      }
      
      // If page doesn't exist, create it
      if (!pageExists) {
        console.log('Page does not exist, creating it:', pageId);
        const { error: insertError } = await supabase
          .from('pages')
          .insert({ 
            id: pageId,
            content: value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating page:', insertError);
          throw insertError;
        }
      } else {
        // Update existing page
        const { error: updateError } = await supabase
          .from('pages')
          .update({ 
            content: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', pageId);
        
        if (updateError) {
          console.error('Error updating page:', updateError);
          throw updateError;
        }
      }
      
      console.log('Content saved successfully for page:', pageId);
      
      onSave(value);
      onClose();
    } catch (err: any) {
      console.error('Error saving content:', err);
      setError(err.message || 'Ett fel uppstod när innehållet skulle sparas');
    } finally {
      setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4">
      <div className={`w-full max-w-4xl rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[95vh]`}>
        <div className={`flex justify-between items-center p-3 md:p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg md:text-xl font-bold">Redigera innehåll</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-700"
            aria-label="Stäng"
          >
            <X size={24} />
          </button>
        </div>
        
        {error && (
          <div className={`m-2 md:m-4 p-3 rounded-md flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className={`p-2 md:p-4 flex-grow overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className={`${darkMode ? 'quill-dark' : ''} quill-container h-[50vh] md:h-[60vh]`}>
            <CustomReactQuill 
              ref={quillRef}
              value={value} 
              onChange={setValue}
              modules={modules}
              formats={formats}
              className={`h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}
              placeholder="Skriv innehåll här..."
            />
          </div>
        </div>
        
        <div className={`flex justify-end gap-2 p-3 md:p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-3 md:px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Sparar...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Spara
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;