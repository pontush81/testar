import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { marked } from 'marked';
import MarkdownHelp from './MarkdownHelp';

interface MarkdownEditorProps {
  content: string;
  pageId: string;
  onClose: () => void;
  onSave: (content: string) => void;
  darkMode: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  content, 
  pageId, 
  onClose, 
  onSave,
  darkMode 
}) => {
  // Convert HTML to Markdown for initial content
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  
  // Convert HTML to Markdown on component mount
  useEffect(() => {
    // If content is HTML, we'll use a simple approach to convert it
    // This is a basic conversion and might not handle all HTML perfectly
    let markdown = content;
    
    // If content looks like HTML (contains tags)
    if (content.includes('<')) {
      // Replace common HTML elements with markdown
      markdown = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
        .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&');
      
      // Remove any remaining HTML tags
      markdown = markdown.replace(/<[^>]*>/g, '');
      
      // Fix double spaces and normalize line breaks
      markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
    }
    
    setValue(markdown);
  }, [content]);

  useEffect(() => {
    // Add class to body to prevent scrolling when editor is open
    document.body.classList.add('overflow-hidden');
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  useEffect(() => {
    if (preview) {
      // Convert markdown to HTML for preview
      setPreviewHtml(marked(value));
    }
  }, [value, preview]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Convert markdown to HTML for storage
      const htmlContent = marked(value);
      
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
            content: htmlContent,
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
            content: htmlContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', pageId);
        
        if (updateError) {
          console.error('Error updating page:', updateError);
          throw updateError;
        }
      }
      
      console.log('Content saved successfully for page:', pageId);
      
      onSave(htmlContent);
      onClose();
    } catch (err: any) {
      console.error('Error saving content:', err);
      setError(err.message || 'Ett fel uppstod när innehållet skulle sparas');
    } finally {
      setSaving(false);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    setValue(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length + selectedText.length + after.length,
        start + before.length + selectedText.length + after.length
      );
    }, 0);
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'h1':
        insertText('# ');
        break;
      case 'h2':
        insertText('## ');
        break;
      case 'h3':
        insertText('### ');
        break;
      case 'ul':
        insertText('- ');
        break;
      case 'ol':
        insertText('1. ');
        break;
      case 'link':
        insertText('[', '](https://)');
        break;
      case 'help':
        setShowHelp(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4">
      <div className={`w-full max-w-4xl rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[95vh]`}>
        <div className={`flex justify-between items-center p-3 md:p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg md:text-xl font-bold">Redigera innehåll</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className={`px-3 py-1 rounded-md text-sm ${
                preview 
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              {preview ? 'Redigera' : 'Förhandsgranska'}
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-700"
              aria-label="Stäng"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {error && (
          <div className={`m-2 md:m-4 p-3 rounded-md flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {!preview && (
          <div className={`p-2 md:p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleToolbarAction('bold')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Fet text (Ctrl+B)"
              >
                <Bold size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('italic')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Kursiv text (Ctrl+I)"
              >
                <Italic size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('h1')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Rubrik 1"
              >
                <Heading1 size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('h2')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Rubrik 2"
              >
                <Heading2 size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('h3')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Rubrik 3"
              >
                <Heading3 size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('ul')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Punktlista"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('ol')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Numrerad lista"
              >
                <ListOrdered size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('link')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Länk"
              >
                <LinkIcon size={18} />
              </button>
              <button 
                onClick={() => handleToolbarAction('help')}
                className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Hjälp med Markdown"
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
        )}
        
        <div className={`p-2 md:p-4 flex-grow overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          {preview ? (
            <div 
              className={`h-[50vh] md:h-[60vh] overflow-y-auto p-4 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div 
                className="prose prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: previewHtml }} 
              />
            </div>
          ) : (
            <textarea
              id="markdown-editor"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`w-full h-[50vh] md:h-[60vh] p-4 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-900'
              }`}
              placeholder="Skriv innehåll här med markdown-formatering..."
            />
          )}
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
      
      {showHelp && (
        <MarkdownHelp onClose={() => setShowHelp(false)} darkMode={darkMode} />
      )}
    </div>
  );
};

export default MarkdownEditor;