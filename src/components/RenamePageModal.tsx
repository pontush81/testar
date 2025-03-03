import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RenamePageModalProps {
  pageId: string;
  pageTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => void;
  darkMode: boolean;
}

const RenamePageModal: React.FC<RenamePageModalProps> = ({ 
  pageId, 
  pageTitle, 
  onClose, 
  onRename,
  darkMode 
}) => {
  const [title, setTitle] = useState(pageTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        setError('Titeln kan inte vara tom');
        return;
      }
      
      setSaving(true);
      setError(null);
      
      // Get the current page content
      const { data, error: fetchError } = await supabase
        .from('pages')
        .select('content')
        .eq('id', pageId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!data || !data.content) {
        throw new Error('Kunde inte hitta sidans innehåll');
      }
      
      // Update the title in the content
      let newContent = data.content;
      const titleRegex = /<h1[^>]*>(.*?)<\/h1>/i;
      
      if (titleRegex.test(newContent)) {
        // Replace existing h1 tag
        newContent = newContent.replace(titleRegex, `<h1>${title}</h1>`);
      } else {
        // Add h1 tag at the beginning
        newContent = `<h1>${title}</h1>${newContent}`;
      }
      
      // Update the page content
      const { error: updateError } = await supabase
        .from('pages')
        .update({ 
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId);
      
      if (updateError) throw updateError;
      
      // Call the callback with the new title
      onRename(title);
      onClose();
    } catch (err: any) {
      console.error('Error updating page title:', err);
      setError(err.message || 'Ett fel uppstod när titeln skulle uppdateras');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-bold">Byt namn på sidan</h2>
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Sidans titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } border focus:ring-2 focus:ring-blue-500`}
              placeholder="Ange sidans titel"
              required
            />
          </div>
          
          <p className="text-sm text-gray-500">
            Detta ändrar endast sidans titel, inte sidans URL (ID).
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
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
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

export default RenamePageModal;