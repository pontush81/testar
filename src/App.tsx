import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Sun, Moon, User as UserIcon, LogOut, Edit, Trash2, Menu, X as XIcon, Plus, Edit2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Aktivitetsrum from './pages/Aktivitetsrum';
import Gastlagenhet from './pages/Gastlagenhet';
import GastlagenhetBooking from './pages/GastlagenhetBooking';
import Login from './pages/Login';
import Register from './pages/Register';
import UserAdmin from './pages/UserAdmin';
import MarkdownEditor from './components/MarkdownEditor';
import DeletePageModal from './components/DeletePageModal';
import CreatePageModal from './components/CreatePageModal';
import RenamePageModal from './components/RenamePageModal';
import { supabase } from './lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('aktivitetsrum');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allPages, setAllPages] = useState<string[]>([]);
  const [pageTitle, setPageTitle] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for current session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch all page IDs
    const fetchAllPages = async () => {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('id');
        
        if (error) {
          console.error('Error fetching pages:', error);
          return;
        }
        
        if (data) {
          setAllPages(data.map(page => page.id));
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    };

    if (user) {
      fetchAllPages();
    }
  }, [user]);

  useEffect(() => {
    // Update current page based on URL path
    const path = location.pathname.split('/')[1];
    if (path && path !== 'login' && path !== 'register') {
      setCurrentPage(path);
      fetchPageContent(path);
    }
  }, [location.pathname]);

  const fetchPageContent = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('content')
        .eq('id', pageId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows are found
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching page content:', error);
      }
      
      setPageContent(data?.content || null);
      
      // Extract title from content if available
      if (data?.content) {
        const titleMatch = data.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (titleMatch && titleMatch[1]) {
          setPageTitle(titleMatch[1]);
        } else {
          setPageTitle(getPageDisplayName(pageId));
        }
      } else {
        setPageTitle(getPageDisplayName(pageId));
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      setPageContent(null);
      setPageTitle(getPageDisplayName(pageId));
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    navigate(`/${page}`);
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  const handleEditContent = () => {
    setShowEditor(true);
  };

  const handleDeletePage = () => {
    // Only protect the users page from deletion
    if (currentPage === 'users') {
      alert('Denna sida kan inte raderas');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleCreatePage = () => {
    setShowCreateModal(true);
  };

  const handleRenamePage = () => {
    setShowRenameModal(true);
  };

  const handlePageCreated = (pageId: string) => {
    // Refresh the list of pages
    setAllPages(prev => [...prev, pageId]);
    // Navigate to the new page
    setCurrentPage(pageId);
    navigate(`/${pageId}`);
  };

  const handlePageRenamed = (newTitle: string) => {
    // Update the page title
    setPageTitle(newTitle);
    // Refresh the page content
    fetchPageContent(currentPage);
  };

  const handlePageDeleted = () => {
    console.log('Page deleted, navigating to users');
    // Remove the page from the list
    setAllPages(prev => prev.filter(id => id !== currentPage));
    // Navigate to users after deletion
    setCurrentPage('users');
    navigate('/users');
  };

  const handleSaveContent = async (content: string) => {
    setPageContent(content);
    // The actual saving to Supabase is handled in the MarkdownEditor component
    // Refresh the page content after saving
    fetchPageContent(currentPage);
  };

  const getPageDisplayName = (pageId: string) => {
    const pageItem = menuItems.find(item => item.id === pageId);
    return pageItem ? pageItem.label : pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-/g, ' ');
  };

  // Define which pages are protected from deletion
  const protectedPages = ['users'];

  // Create menu items from all pages
  const menuItems = [
    // Default menu items that are always shown, even if the page doesn't exist yet
    { id: 'users', label: 'Användare', icon: <UserIcon size={20} /> },
    { id: 'gastlagenhet-booking', label: 'Gästlägenhet Bokning', icon: <Home size={20} /> },
    
    // Add all pages from the database
    ...allPages
      .filter(pageId => pageId !== 'users' && pageId !== 'gastlagenhet-booking') // Exclude special pages
      .map(pageId => ({
        id: pageId,
        label: pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-/g, ' '),
        icon: <FileText size={20} />
      }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not logged in and not on login or register page, redirect to login
  if (!user && !location.pathname.includes('/login') && !location.pathname.includes('/register')) {
    return <Navigate to="/login" />;
  }

  // Login and Register routes
  if (location.pathname.includes('/login') || location.pathname.includes('/register')) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <header className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-800' : 'bg-blue-600 text-white'} sticky top-0 z-40`}>
          <div className="flex items-center">
            <Home className="mr-2" />
            <h1 className="text-xl font-bold">BRF Gulmåran</h1>
          </div>
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-700">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        <Routes>
          <Route path="/login" element={<Login darkMode={darkMode} />} />
          <Route path="/register" element={<Register darkMode={darkMode} />} />
        </Routes>
      </div>
    );
  }

  // If no pages exist yet, redirect to users page
  if (allPages.length === 0 && currentPage !== 'users' && currentPage !== 'gastlagenhet-booking') {
    return <Navigate to="/users" />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-800' : 'bg-blue-600 text-white'} sticky top-0 z-40`}>
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button 
            className="mr-2 md:hidden" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Stäng meny" : "Öppna meny"}
          >
            {sidebarOpen ? <XIcon size={24} /> : <Menu size={24} />}
          </button>
          <Home className="mr-2" />
          <h1 className="text-xl font-bold">BRF Gulmåran</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleDarkMode} 
            className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-700"
            aria-label={darkMode ? "Ljust läge" : "Mörkt läge"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* User info - hidden on small screens */}
          <div className="hidden md:flex items-center gap-2">
            <UserIcon size={20} />
            <span className="hidden md:inline">{user?.email}</span>
          </div>
          
          {/* Users link */}
          <div 
            className="flex items-center gap-1 cursor-pointer" 
            onClick={() => handlePageChange('users')}
          >
            <UserIcon size={20} />
            <span className="hidden md:inline">Användare</span>
          </div>
          
          {/* Logout button */}
          <div 
            className="flex items-center gap-1 cursor-pointer" 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="hidden md:inline">Logga ut</span>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar - fixed position on mobile, normal on desktop */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          fixed md:static top-[65px] bottom-0 left-0 z-30
          w-64 transition-transform duration-300 ease-in-out
          ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}
          overflow-y-auto
        `}>
          <Sidebar 
            menuItems={menuItems} 
            currentPage={currentPage} 
            setCurrentPage={handlePageChange} 
            darkMode={darkMode}
          />
          
          {/* Create new page button */}
          <div className="p-4">
            <button
              onClick={handleCreatePage}
              className={`flex items-center justify-center w-full p-3 rounded-md transition-colors ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <Plus size={18} className="mr-2" />
              Skapa ny sida
            </button>
          </div>
        </div>

        {/* Main Content - adjust padding when sidebar is hidden */}
        <main className="flex-1 p-4 md:p-6 md:ml-0 overflow-x-hidden">
          {currentPage !== 'users' && currentPage !== 'gastlagenhet-booking' && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {pageTitle}
                </h1>
                <button
                  onClick={handleRenamePage}
                  className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white"
                  title="Byt namn på sidan"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-blue-700 flex-1 md:flex-none justify-center"
                  onClick={handleEditContent}
                >
                  <Edit size={18} />
                  <span className="md:inline">Redigera</span>
                </button>
                <button 
                  className={`flex items-center gap-1 bg-red-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-red-700 flex-1 md:flex-none justify-center ${
                    protectedPages.includes(currentPage) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleDeletePage}
                  disabled={protectedPages.includes(currentPage)}
                >
                  <Trash2 size={18} />
                  <span className="md:inline">Radera</span>
                </button>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to={allPages.length > 0 ? `/${allPages[0]}` : "/users"} />} />
            <Route path="/users" element={<UserAdmin />} />
            <Route path="/gastlagenhet-booking" element={<GastlagenhetBooking />} />
            <Route path="*" element={
              pageContent ? (
                <div className="bg-gray-800 p-4 md:p-8 rounded-md">
                  <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: pageContent }} />
                </div>
              ) : (
                <div className="p-4 md:p-8 bg-gray-800 text-white rounded-md">
                  <h2 className="text-xl font-bold mb-4">Sidan finns inte</h2>
                  <p className="mb-4">Denna sida har inte skapats ännu eller har blivit raderad.</p>
                  <button
                    onClick={handleCreatePage}
                    className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    Skapa ny sida
                  </button>
                </div>
              )
            } />
          </Routes>
        </main>
      </div>

      {/* Markdown Editor Modal */}
      {showEditor && (
        <MarkdownEditor 
          content={pageContent || ''}
          pageId={currentPage}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveContent}
          darkMode={darkMode}
        />
      )}

      {/* Delete Page Modal */}
      {showDeleteModal && (
        <DeletePageModal 
          pageId={currentPage}
          pageName={pageTitle}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handlePageDeleted}
          darkMode={darkMode}
        />
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <CreatePageModal 
          onClose={() => setShowCreateModal(false)}
          onPageCreated={handlePageCreated}
          darkMode={darkMode}
          existingPageIds={allPages}
        />
      )}

      {/* Rename Page Modal */}
      {showRenameModal && (
        <RenamePageModal
          pageId={currentPage}
          pageTitle={pageTitle}
          onClose={() => setShowRenameModal(false)}
          onRename={handlePageRenamed}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default App;