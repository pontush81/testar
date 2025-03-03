import React, { useState } from 'react';
import { Calendar, Upload, File, X } from 'lucide-react';

interface Booking {
  id: number;
  name: string;
  email: string;
  startDate: string;
  endDate: string;
  apartment: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  uploadDate: string;
  type: string;
}

const Gastlagenhet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'booking' | 'files'>('info');
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      name: 'Anna Andersson',
      email: 'anna@example.com',
      startDate: '2025-06-10',
      endDate: '2025-06-12',
      apartment: 'Lägenhet 1',
      status: 'confirmed'
    },
    {
      id: 2,
      name: 'Erik Svensson',
      email: 'erik@example.com',
      startDate: '2025-06-15',
      endDate: '2025-06-17',
      apartment: 'Lägenhet 2',
      status: 'pending'
    }
  ]);

  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: 1,
      name: 'Regler för gästlägenhet.pdf',
      size: '245 KB',
      uploadDate: '2025-01-15',
      type: 'pdf'
    },
    {
      id: 2,
      name: 'Prislista 2025.xlsx',
      size: '128 KB',
      uploadDate: '2025-01-10',
      type: 'xlsx'
    },
    {
      id: 3,
      name: 'Inventarielista.docx',
      size: '78 KB',
      uploadDate: '2024-12-05',
      type: 'docx'
    }
  ]);

  const [newBooking, setNewBooking] = useState({
    name: '',
    email: '',
    startDate: '',
    endDate: '',
    apartment: 'Lägenhet 1'
  });

  const [dragActive, setDragActive] = useState(false);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const booking: Booking = {
      id: bookings.length + 1,
      ...newBooking,
      status: 'pending'
    };
    setBookings([...bookings, booking]);
    setNewBooking({
      name: '',
      email: '',
      startDate: '',
      endDate: '',
      apartment: 'Lägenhet 1'
    });
    alert('Bokning skickad! Vänta på bekräftelse.');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle the file upload
      const file = e.dataTransfer.files[0];
      const newFile: UploadedFile = {
        id: files.length + 1,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
        type: file.name.split('.').pop() || ''
      };
      setFiles([...files, newFile]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFile: UploadedFile = {
        id: files.length + 1,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
        type: file.name.split('.').pop() || ''
      };
      setFiles([...files, newFile]);
    }
  };

  const deleteFile = (id: number) => {
    setFiles(files.filter(file => file.id !== id));
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-md">
      <div className="mb-6">
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`py-2 px-4 whitespace-nowrap ${activeTab === 'info' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
          <button
            className={`py-2 px-4 whitespace-nowrap ${activeTab === 'booking' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('booking')}
          >
            Bokning
          </button>
          <button
            className={`py-2 px-4 whitespace-nowrap ${activeTab === 'files' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('files')}
          >
            Filer
          </button>
        </div>

        {activeTab === 'info' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Information om gästlägenheten</h2>
            <p className="mb-4">Föreningen har två gästlägenheter som medlemmar kan boka för sina gäster.</p>
            <p className="mb-4">Lägenhet 1 har plats för upp till 4 personer med en dubbelsäng och en bäddsoffa.</p>
            <p className="mb-4">Lägenhet 2 har plats för upp till 2 personer med en dubbelsäng.</p>
            <p className="mb-4">Båda lägenheterna har eget badrum och pentry.</p>
            <p className="mb-4">Pris per natt:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Lägenhet 1: 350 kr</li>
              <li>Lägenhet 2: 250 kr</li>
            </ul>
            <p>Bokning sker via bokningsformuläret. Betalning sker via faktura efter vistelsen.</p>
          </div>
        )}

        {activeTab === 'booking' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Boka gästlägenhet</h2>
            
            <form onSubmit={handleBookingSubmit} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Namn</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                    value={newBooking.name}
                    onChange={(e) => setNewBooking({...newBooking, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-post</label>
                  <input
                    type="email"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                    value={newBooking.email}
                    onChange={(e) => setNewBooking({...newBooking, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ankomstdatum</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-2 top-2.5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full p-2 pl-8 bg-gray-700 border border-gray-600 rounded-md"
                      value={newBooking.startDate}
                      onChange={(e) => setNewBooking({...newBooking, startDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Avresedatum</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-2 top-2.5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full p-2 pl-8 bg-gray-700 border border-gray-600 rounded-md"
                      value={newBooking.endDate}
                      onChange={(e) => setNewBooking({...newBooking, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Lägenhet</label>
                <select
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                  value={newBooking.apartment}
                  onChange={(e) => setNewBooking({...newBooking, apartment: e.target.value})}
                  required
                >
                  <option value="Lägenhet 1">Lägenhet 1 (4 personer)</option>
                  <option value="Lägenhet 2">Lägenhet 2 (2 personer)</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Skicka bokningsförfrågan
              </button>
            </form>
            
            <h3 className="text-lg font-bold mb-2">Aktuella bokningar</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="min-w-full bg-gray-700 rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-gray-600">
                    <th className="py-2 px-4 text-left">Lägenhet</th>
                    <th className="py-2 px-4 text-left">Datum</th>
                    <th className="py-2 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-600">
                      <td className="py-2 px-4">{booking.apartment}</td>
                      <td className="py-2 px-4">{booking.startDate} till {booking.endDate}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'confirmed' ? 'bg-green-800 text-green-200' :
                          booking.status === 'rejected' ? 'bg-red-800 text-red-200' :
                          'bg-yellow-800 text-yellow-200'
                        }`}>
                          {booking.status === 'confirmed' ? 'Bekräftad' :
                           booking.status === 'rejected' ? 'Avvisad' : 'Väntar'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Filer och dokument</h2>
            
            <div 
              className={`border-2 border-dashed p-8 rounded-md text-center mb-6 ${
                dragActive ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={40} className="mx-auto mb-2 text-gray-400" />
              <p className="mb-2">Dra och släpp filer här eller</p>
              <label className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer">
                Välj filer
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>
            
            <div className="bg-gray-700 rounded-md overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-600 py-2 px-4 text-sm font-medium">
                <div className="col-span-6 md:col-span-6">Filnamn</div>
                <div className="col-span-2 hidden md:block">Storlek</div>
                <div className="col-span-3 hidden md:block">Uppladdad</div>
                <div className="col-span-6 md:col-span-1 text-right">Åtgärd</div>
              </div>
              
              {files.map((file) => (
                <div key={file.id} className="grid grid-cols-12 py-3 px-4 border-t border-gray-600 items-center">
                  <div className="col-span-6 md:col-span-6 flex items-center truncate">
                    <File size={18} className="mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="col-span-2 hidden md:block text-gray-400">{file.size}</div>
                  <div className="col-span-3 hidden md:block text-gray-400">{file.uploadDate}</div>
                  <div className="col-span-6 md:col-span-1 flex justify-end">
                    <button 
                      onClick={() => deleteFile(file.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Ta bort fil"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
              
              {files.length === 0 && (
                <div className="py-4 text-center text-gray-400">
                  Inga filer uppladdade
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gastlagenhet;