import React, { useRef, useEffect, forwardRef } from 'react';
import Quill from 'quill';
import 'react-quill/dist/quill.snow.css';

// This is a wrapper component that properly handles refs for ReactQuill
// to avoid the findDOMNode warning in React 18's Strict Mode
const CustomReactQuill = forwardRef<any, any>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a new Quill instance directly
    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules: props.modules || {},
      formats: props.formats || [],
      placeholder: props.placeholder || '',
    });
    
    // Set initial value
    if (props.value) {
      quill.clipboard.dangerouslyPasteHTML(props.value);
    }
    
    // Handle change events
    quill.on('text-change', () => {
      if (props.onChange) {
        const html = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        props.onChange(html);
      }
    });
    
    // Expose the quill instance via ref
    quillInstanceRef.current = quill;
    
    if (ref) {
      if (typeof ref === 'function') {
        ref(quill);
      } else {
        ref.current = quill;
      }
    }
    
    return () => {
      // Clean up
      if (quillInstanceRef.current) {
        // No need to explicitly destroy Quill, but we should clean up our ref
        quillInstanceRef.current = null;
      }
    };
  }, []);
  
  // Update content if value changes externally
  useEffect(() => {
    if (quillInstanceRef.current && props.value) {
      const currentContent = containerRef.current?.querySelector('.ql-editor')?.innerHTML;
      if (currentContent !== props.value) {
        quillInstanceRef.current.clipboard.dangerouslyPasteHTML(props.value);
      }
    }
  }, [props.value]);
  
  return (
    <div className={`quill-container ${props.className || ''}`}>
      <div ref={containerRef} className="quill-editor" />
    </div>
  );
});

CustomReactQuill.displayName = 'CustomReactQuill';

export default CustomReactQuill;