import React from 'react';

interface SidebarProps {
  menuItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }>;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  darkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems, currentPage, setCurrentPage, darkMode }) => {
  // Group menu items by type
  const userPage = menuItems.find(item => item.id === 'users');
  const contentPages = menuItems.filter(item => item.id !== 'users');
  
  return (
    <aside className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Innehåll</h2>
        <nav>
          <ul>
            {/* User admin page always at the top */}
            {userPage && (
              <li key={userPage.id} className="mb-4">
                <button
                  onClick={() => setCurrentPage(userPage.id)}
                  className={`flex items-center w-full p-3 rounded-md transition-colors ${
                    currentPage === userPage.id
                      ? darkMode
                        ? 'bg-blue-700 text-white'
                        : 'bg-blue-600 text-white'
                      : darkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-300'
                  }`}
                >
                  <span className="mr-2">{userPage.icon}</span>
                  {userPage.label}
                </button>
              </li>
            )}
            
            {/* Divider */}
            {contentPages.length > 0 && (
              <li className="mb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Sidor</h3>
              </li>
            )}
            
            {/* Content pages */}
            {contentPages.map((item) => (
              <li key={item.id} className="mb-1">
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center w-full p-3 rounded-md transition-colors ${
                    currentPage === item.id
                      ? darkMode
                        ? 'bg-blue-700 text-white'
                        : 'bg-blue-600 text-white'
                      : darkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-300'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            ))}
            
            {contentPages.length === 0 && (
              <li className="text-center py-4 text-gray-500">
                <p>Inga sidor skapade</p>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;