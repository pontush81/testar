import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { marked } from 'marked';

interface CreatePageModalProps {
  onClose: () => void;
  onPageCreated: (pageId: string) => void;
  darkMode: boolean;
  existingPageIds: string[];
  initialPageId?: string;
  initialTitle?: string;
  isEditing?: boolean;
}

const CreatePageModal: React.FC<CreatePageModalProps> = ({ 
  onClose, 
  onPageCreated,
  darkMode,
  existingPageIds,
  initialPageId = '',
  initialTitle = '',
  isEditing = false
}) => {
  const [pageId, setPageId] = useState(initialPageId);
  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [originalPageId] = useState(initialPageId); // Keep track of original ID for updates
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePageId = (title: string) => {
    // Convert to lowercase, replace spaces with dashes, remove special characters
    return title
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPageTitle(newTitle);
    
    // Only auto-generate ID if we're creating a new page or if the ID hasn't been manually edited
    if (!isEditing || pageId === initialPageId) {
      setPageId(generatePageId(newTitle));
    }
  };

  const handlePageIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageId(e.target.value);
  };

  const handleCreate = async () => {
    try {
      // Validate inputs
      if (!pageId.trim()) {
        setError('Sidans ID kan inte vara tomt');
        return;
      }

      if (!pageTitle.trim()) {
        setError('Sidans titel kan inte vara tom');
        return;
      }

      // Check if page ID already exists (only for new pages or when changing ID)
      if (!isEditing || (isEditing && pageId !== originalPageId)) {
        if (existingPageIds.includes(pageId)) {
          setError('En sida med detta ID finns redan');
          return;
        }
      }

      setCreating(true);
      setError(null);
      
      if (isEditing && originalPageId !== pageId) {
        // We're renaming a page - need to get the content first
        const { data: pageData, error: fetchError } = await supabase
          .from('pages')
          .select('content')
          .eq('id', originalPageId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Create a new page with the new ID
        const { error: insertError } = await supabase
          .from('pages')
          .insert({
            id: pageId,
            content: pageData.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
        
        // Delete the old page
        const { error: deleteError } = await supabase
          .from('pages')
          .delete()
          .eq('id', originalPageId);
          
        if (deleteError) throw deleteError;
        
        console.log(`Page renamed from ${originalPageId} to ${pageId}`);
      } else if (!isEditing) {
        // Creating a new page
        console.log('Creating new page with ID:', pageId);
        
        // Create initial content with the title as markdown
        const initialMarkdown = `# ${pageTitle}\n\nInnehåll kommer snart...`;
        
        // Convert markdown to HTML
        const initialContent = marked(initialMarkdown);
        
        // Insert into Supabase
        const { error: insertError } = await supabase
          .from('pages')
          .insert({
            id: pageId,
            content: initialContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      } else {
        // We're just updating the title in the content
        const { data: pageData, error: fetchError } = await supabase
          .from('pages')
          .select('content')
          .eq('id', pageId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Update the title in the content
        let newContent = pageData.content;
        const titleRegex = /<h1[^>]*>(.*?)<\/h1>/i;
        
        if (titleRegex.test(newContent)) {
          // Replace existing h1 tag
          newContent = newContent.replace(titleRegex, `<h1>${pageTitle}</h1>`);
        } else {
          // Add h1 tag at the beginning
          newContent = `<h1>${pageTitle}</h1>${newContent}`;
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
      }
      
      // Call the callback to navigate to the new page
      onPageCreated(pageId);
      onClose();
    } catch (err: any) {
      console.error('Error creating/updating page:', err);
      setError(err.message || 'Ett fel uppstod när sidan skulle skapas');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-bold">{isEditing ? 'Redigera sidans namn' : 'Skapa ny sida'}</h2>
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
              value={pageTitle}
              onChange={handleTitleChange}
              className={`w-full p-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } border focus:ring-2 focus:ring-blue-500`}
              placeholder="T.ex. Grillregler"
              required
            />
            <p className="text-xs mt-1 text-gray-500">Titeln som visas på sidan</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Sidans ID</label>
            <input
              type="text"
              value={pageId}
              onChange={handlePageIdChange}
              className={`w-full p-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } border focus:ring-2 focus:ring-blue-500`}
              placeholder="t-ex-grillregler"
              required
            />
            <p className="text-xs mt-1 text-gray-500">Används i URL:en, inga mellanslag eller specialtecken</p>
            {isEditing && originalPageId !== pageId && (
              <p className="text-xs mt-1 text-yellow-500">OBS! Att ändra sidans ID kommer att skapa en ny sida och radera den gamla.</p>
            )}
          </div>
        </div>
        
        <div className={`flex justify-end gap-2 p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Avbryt
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Uppdaterar...' : 'Skapar...'}
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                {isEditing ? 'Uppdatera' : 'Skapa'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePageModal;