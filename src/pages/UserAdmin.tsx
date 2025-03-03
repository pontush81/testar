import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../lib/supabaseClient';
import { User, Search, UserPlus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    apartment: '',
    role: 'member' as const
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      setError('Kunde inte hämta användare: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      setLoading(true);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            apartment: newUser.apartment,
            role: newUser.role
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: authData.user.id,
              email: newUser.email,
              full_name: newUser.full_name,
              apartment: newUser.apartment,
              role: newUser.role
            }
          ]);
          
        if (profileError) throw profileError;
        
        // Reset form and close modal
        setNewUser({
          email: '',
          password: '',
          full_name: '',
          apartment: '',
          role: 'member'
        });
        setShowAddModal(false);
        
        // Refresh user list
        fetchUsers();
      }
    } catch (error: any) {
      setError('Kunde inte lägga till användare: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: currentUser.full_name,
          apartment: currentUser.apartment,
          role: currentUser.role
        })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      setShowEditModal(false);
      fetchUsers();
    } catch (error: any) {
      setError('Kunde inte uppdatera användare: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', currentUser.id);
        
      if (profileError) throw profileError;
      
      setShowDeleteModal(false);
      fetchUsers();
      
      // Note: We can't delete the auth user directly as it requires admin privileges
      // The user will remain in Auth but without a profile
      setError('Användaren har tagits bort från systemet, men kontot finns kvar i autentiseringssystemet.');
    } catch (error: any) {
      setError('Kunde inte ta bort användare: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes( searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.apartment && user.apartment.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-md">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div className="relative w-full md:w-64">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Sök användare..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          />
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto justify-center md:justify-start"
        >
          <UserPlus size={18} />
          Lägg till användare
        </button>
      </div>
      
      {loading && users.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden md:rounded-md">
              <table className="min-w-full">
                <thead className="bg-gray-600">
                  <tr>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Användare</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">E-post</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Lägenhet</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Roll</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Registrerad</th>
                    <th scope="col" className="py-3 px-4 text-right text-xs font-medium uppercase tracking-wider">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-gray-400">
                        Inga användare hittades
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-600 rounded-full p-2 mr-3 flex-shrink-0">
                              <User size={16} className="text-gray-300" />
                            </div>
                            <div className="flex flex-col md:hidden">
                              <span className="font-medium">{user.full_name || 'Ej angivet'}</span>
                              <span className="text-gray-400 text-sm">{user.email}</span>
                              <span className="text-gray-400 text-sm">Lgh: {user.apartment || 'Ej angivet'}</span>
                            </div>
                            <span className="hidden md:block">{user.full_name || 'Ej angivet'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">{user.email}</td>
                        <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">{user.apartment || 'Ej angivet'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-purple-800 text-purple-200' : 'bg-blue-800 text-blue-200'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Medlem'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">
                          {new Date(user.created_at).toLocaleDateString('sv-SE')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setCurrentUser(user);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 bg-gray-600 rounded-md hover:bg-gray-500"
                              title="Redigera"
                              aria-label="Redigera användare"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 bg-gray-600 rounded-md hover:bg-red-700"
                              title="Ta bort"
                              aria-label="Ta bort användare"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Lägg till användare</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">E-post</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Lösenord</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fullständigt namn</label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Lägenhetsnummer</label>
              <input
                type="text"
                value={newUser.apartment}
                onChange={(e) => setNewUser({...newUser, apartment: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Roll</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'member'})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              >
                <option value="member">Medlem</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Avbryt
              </button>
              <button
                onClick={handleAddUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Sparar...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-1" />
                    Spara
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Redigera användare</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">E-post</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md opacity-70"
              />
              <p className="text-xs mt-1 text-gray-400">E-post kan inte ändras</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fullständigt namn</label>
              <input
                type="text"
                value={currentUser.full_name || ''}
                onChange={(e) => setCurrentUser({...currentUser, full_name: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Lägenhetsnummer</label>
              <input
                type="text"
                value={currentUser.apartment || ''}
                onChange={(e) => setCurrentUser({...currentUser, apartment: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Roll</label>
              <select
                value={currentUser.role}
                onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as 'admin' | 'member'})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              >
                <option value="member">Medlem</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Sparar...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-1" />
                    Spara
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Modal */}
      {showDeleteModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Ta bort användare</h3>
            
            <p className="mb-6">
              Är du säker på att du vill ta bort användaren <span className="font-semibold">{currentUser.email}</span>? 
              Denna åtgärd kan inte ångras.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 flex items-center"
              >
                <X size={18} className="mr-1" />
                Avbryt
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Tar bort...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-1" />
                    Ta bort
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdmin;