import React from 'react';
import { X } from 'lucide-react';

interface MarkdownHelpProps {
  onClose: () => void;
  darkMode: boolean;
}

const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-hidden`}>
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-bold">Markdown-hjälp</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-700"
            aria-label="Stäng"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="mb-4">
            Markdown är ett enkelt sätt att formatera text. Här är några grundläggande kommandon:
          </p>
          
          <div className={`p-4 rounded-md mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className="font-bold mb-2">Rubriker</h3>
            <pre className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
# Rubrik 1
## Rubrik 2
### Rubrik 3
</pre>
            
            <h3 className="font-bold mb-2 mt-4">Textformatering</h3>
            <pre className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
*kursiv text*
**fet text**
~~genomstruken text~~
</pre>
            
            <h3 className="font-bold mb-2 mt-4">Listor</h3>
            <pre className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
- Punkt 1
- Punkt 2
  - Underpunkt

1. Numrerad punkt 1
2. Numrerad punkt 2
</pre>
            
            <h3 className="font-bold mb-2 mt-4">Länkar</h3>
            <pre className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
[Länktext](https://example.com)
</pre>
            
            <h3 className="font-bold mb-2 mt-4">Bilder</h3>
            <pre className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
![Alternativ text](https://example.com/bild.jpg)
</pre>
            
            <h3 className="font-bold mb-2 mt-4">Citat</h3>
            <pre className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
{'>'} Detta är ett citat
</pre>
          </div>
          
          <p className="text-sm text-gray-500">
            För mer information om Markdown, besök <a href="https://www.markdownguide.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Markdown Guide</a>.
          </p>
        </div>
        
        <div className={`flex justify-end p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownHelp;