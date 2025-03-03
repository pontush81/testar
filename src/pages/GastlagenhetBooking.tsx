import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, Mail, Clock, Check, X, AlertCircle, Settings, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getWeekNumber } from '../utils/dateUtils';

interface Booking {
  id: string;
  apartment_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'rejected';
  guest_name: string;
  phone_number: string;
  notes: string;
  created_at: string;
  user_email?: string;
  user_full_name?: string;
  apartment_name?: string;
}

interface Apartment {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  price_low_season: number;
  price_high_season: number;
  price_tennis_season: number;
}

interface SeasonSetting {
  id: string;
  year: number;
  low_season_price: number;
  high_season_price: number;
  tennis_season_price: number;
}

interface SeasonWeek {
  id: string;
  season_setting_id: string;
  week_number: number;
  season_type: 'low' | 'high' | 'tennis';
}

const GastlagenhetBooking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings'>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    apartment_id: '',
    guest_name: '',
    phone_number: '',
    notes: ''
  });
  const [seasonSettings, setSeasonSettings] = useState<SeasonSetting[]>([]);
  const [seasonWeeks, setSeasonWeeks] = useState<SeasonWeek[]>([]);
  const [showSeasonSettingsForm, setShowSeasonSettingsForm] = useState(false);
  const [editingSeasonSetting, setEditingSeasonSetting] = useState<SeasonSetting | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // Fetch apartments, bookings, and season settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch apartments
        const { data: apartmentsData, error: apartmentsError } = await supabase
          .from('apartments')
          .select('*');
          
        if (apartmentsError) throw apartmentsError;
        setApartments(apartmentsData || []);
        
        // Set default apartment ID for new bookings if apartments exist
        if (apartmentsData && apartmentsData.length > 0) {
          setNewBooking(prev => ({...prev, apartment_id: apartmentsData[0].id}));
        }
        
        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings_with_users')
          .select('*')
          .order('start_date', { ascending: true });
          
        if (bookingsError) throw bookingsError;
        setBookings(bookingsData || []);
        
        // Fetch season settings
        const { data: seasonSettingsData, error: seasonSettingsError } = await supabase
          .from('season_settings')
          .select('*')
          .order('year', { ascending: false });
          
        if (seasonSettingsError) throw seasonSettingsError;
        setSeasonSettings(seasonSettingsData || []);
        
        // Fetch season weeks
        const { data: seasonWeeksData, error: seasonWeeksError } = await supabase
          .from('season_weeks')
          .select('*');
          
        if (seasonWeeksError) throw seasonWeeksError;
        setSeasonWeeks(seasonWeeksData || []);
        
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(`Kunde inte hämta data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleDateClick = (date: Date) => {
    if (!selectedDates.start) {
      // First click - set start date
      setSelectedDates({start: date, end: null});
    } else if (!selectedDates.end) {
      // Second click - set end date (ensure it's after start date)
      if (date >= selectedDates.start) {
        setSelectedDates({...selectedDates, end: date});
        setShowBookingForm(true);
      } else {
        // If clicked date is before start date, reset and set as new start date
        setSelectedDates({start: date, end: null});
      }
    } else {
      // Reset selection and start new selection
      setSelectedDates({start: date, end: null});
      setShowBookingForm(false);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Helper function to format a date to YYYY-MM-DD without timezone issues
  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleBookingSubmit = async () => {
    if (!selectedDates.start || !selectedDates.end || !newBooking.apartment_id || !newBooking.guest_name) {
      setError('Vänligen fyll i alla obligatoriska fält');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format dates for database using our helper function to avoid timezone issues
      const startDate = formatDateForDatabase(selectedDates.start);
      const endDate = formatDateForDatabase(selectedDates.end);
      
      console.log(`Booking dates: ${startDate} to ${endDate}`);
      
      // Check for overlapping bookings
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('apartment_id', newBooking.apartment_id)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .not('status', 'eq', 'rejected'); // Exclude rejected bookings
        
      if (checkError) throw checkError;
      
      // Filter out bookings that don't actually overlap
      const overlappingBookings = existingBookings?.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);
        
        // Check if the booking overlaps with the new booking
        // Allow booking to start on the same day another booking ends
        // or to end on the same day another booking starts
        return (
          (newStart < bookingEnd && newEnd > bookingStart) &&
          !(newStart.toISOString().split('T')[0] === bookingEnd.toISOString().split('T')[0] ||
            newEnd.toISOString().split('T')[0] === bookingStart.toISOString().split('T')[0])
        );
      });
      
      if (overlappingBookings && overlappingBookings.length > 0) {
        setError('Det finns redan en bokning för dessa datum');
        return;
      }
      
      // Insert booking
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            apartment_id: newBooking.apartment_id,
            user_id: user.id,
            start_date: startDate,
            end_date: endDate,
            status: 'confirmed', // Auto-confirm bookings
            guest_name: newBooking.guest_name,
            phone_number: newBooking.phone_number,
            notes: newBooking.notes
          }
        ])
        .select();
        
      if (insertError) throw insertError;
      
      // Reset form and refresh bookings
      setSelectedDates({start: null, end: null});
      setNewBooking({
        apartment_id: apartments[0]?.id || '',
        guest_name: '',
        phone_number: '',
        notes: ''
      });
      setShowBookingForm(false);
      
      // Refresh bookings list
      const { data: updatedBookings, error: refreshError } = await supabase
        .from('bookings_with_users')
        .select('*')
        .order('start_date', { ascending: true });
        
      if (refreshError) throw refreshError;
      setBookings(updatedBookings || []);
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setError(`Kunde inte skapa bokning: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteBooking = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setShowDeleteConfirmation(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Deleting booking with ID:', bookingToDelete);
      
      // Delete the booking
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToDelete);
        
      if (deleteError) {
        console.error('Error deleting booking:', deleteError);
        throw deleteError;
      }
      
      console.log('Booking deleted successfully');
      
      // Close the confirmation modal
      setShowDeleteConfirmation(false);
      setBookingToDelete(null);
      
      // Refresh bookings list
      const { data: updatedBookings, error: refreshError } = await supabase
        .from('bookings_with_users')
        .select('*')
        .order('start_date', { ascending: true });
        
      if (refreshError) throw refreshError;
      setBookings(updatedBookings || []);
      
    } catch (error: any) {
      console.error('Error canceling booking:', error);
      setError(`Kunde inte avboka: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSeasonSettings = async () => {
    if (!editingSeasonSetting) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Update season settings
      const { error: updateError } = await supabase
        .from('season_settings')
        .update({
          low_season_price: editingSeasonSetting.low_season_price,
          high_season_price: editingSeasonSetting.high_season_price,
          tennis_season_price: editingSeasonSetting.tennis_season_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSeasonSetting.id);
        
      if (updateError) throw updateError;
      
      // Refresh season settings
      const { data: updatedSettings, error: refreshError } = await supabase
        .from('season_settings')
        .select('*')
        .order('year', { ascending: false });
        
      if (refreshError) throw refreshError;
      setSeasonSettings(updatedSettings || []);
      
      setShowSeasonSettingsForm(false);
      setEditingSeasonSetting(null);
      
    } catch (error: any) {
      console.error('Error updating season settings:', error);
      setError(`Kunde inte uppdatera säsongsinställningar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeasonSettings = async () => {
    if (!editingSeasonSetting) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if year already exists
      const { data: existingSettings, error: checkError } = await supabase
        .from('season_settings')
        .select('id')
        .eq('year', editingSeasonSetting.year);
        
      if (checkError) throw checkError;
      
      if (existingSettings && existingSettings.length > 0) {
        setError(`Säsongsinställningar för ${editingSeasonSetting.year} finns redan`);
        return;
      }
      
      // Insert new season settings
      const { data, error: insertError } = await supabase
        .from('season_settings')
        .insert([{
          year: editingSeasonSetting.year,
          low_season_price: editingSeasonSetting.low_season_price,
          high_season_price: editingSeasonSetting.high_season_price,
          tennis_season_price: editingSeasonSetting.tennis_season_price
        }])
        .select();
        
      if (insertError) throw insertError;
      
      // Refresh season settings
      const { data: updatedSettings, error: refreshError } = await supabase
        .from('season_settings')
        .select('*')
        .order('year', { ascending: false });
        
      if (refreshError) throw refreshError;
      setSeasonSettings(updatedSettings || []);
      
      setShowSeasonSettingsForm(false);
      setEditingSeasonSetting(null);
      
    } catch (error: any) {
      console.error('Error creating season settings:', error);
      setError(`Kunde inte skapa säsongsinställningar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days in month
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    // Adjust for Monday as first day of week
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Create array of days
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Check if a date is booked
    const isDateBooked = (date: Date) => {
      if (bookings.length === 0) return false;
      
      const dateStr = formatDateForDatabase(date);
      
      // Check if this date is the end date of one booking and the start date of another
      const isEndDateOfBooking = bookings.some(booking => {
        if (booking.status === 'rejected') return false;
        return booking.end_date === dateStr;
      });
      
      const isStartDateOfBooking = bookings.some(booking => {
        if (booking.status === 'rejected') return false;
        return booking.start_date === dateStr;
      });
      
      // If it's both an end date and a start date, it's available for booking
      if (isEndDateOfBooking && isStartDateOfBooking) {
        return false;
      }
      
      return bookings.some(booking => {
        if (booking.status === 'rejected') return false; // Skip rejected bookings
        
        const startDate = booking.start_date;
        const endDate = booking.end_date;
        
        return dateStr >= startDate && dateStr <= endDate;
      });
    };
    
    // Check if a date is selected
    const isDateSelected = (date: Date) => {
      if (!selectedDates.start) return false;
      
      // Reset hours to compare dates properly
      const dateToCheck = new Date(date);
      const startDate = new Date(selectedDates.start);
      dateToCheck.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (!selectedDates.end) return dateToCheck.getTime() === startDate.getTime();
      
      const endDate = new Date(selectedDates.end);
      endDate.setHours(0, 0, 0, 0);
      
      return dateToCheck >= startDate && dateToCheck <= endDate;
    };
    
    // Get week number for a date
    const getWeekNumberForDate = (date: Date) => {
      return getWeekNumber(date);
    };
    
    // Group days into weeks
    const weeks = [];
    let week = [];
    
    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      
      if (week.length === 7 || i === days.length - 1) {
        weeks.push(week);
        week = [];
      }
    }
    
    return (
      <div className="bg-gray-800 rounded-md overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-gray-700">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-gray-600"
          >
            &lt;
          </button>
          <h3 className="text-lg font-bold">
            {currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-600"
          >
            &gt;
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            <div className="text-center text-sm font-medium">Mån</div>
            <div className="text-center text-sm font-medium">Tis</div>
            <div className="text-center text-sm font-medium">Ons</div>
            <div className="text-center text-sm font-medium">Tor</div>
            <div className="text-center text-sm font-medium">Fre</div>
            <div className="text-center text-sm font-medium">Lör</div>
            <div className="text-center text-sm font-medium">Sön</div>
          </div>
          
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={dayIndex} className="h-14 bg-gray-700/30 rounded-md"></div>;
                }
                
                const isBooked = isDateBooked(day);
                const isSelected = isDateSelected(day);
                const weekNumber = getWeekNumberForDate(day);
                const isToday = new Date().toDateString() === day.toDateString();
                
                return (
                  <div 
                    key={dayIndex}
                    onClick={() => !isBooked && handleDateClick(day)}
                    className={`h-14 rounded-md flex flex-col justify-between p-1 cursor-pointer relative ${
                      isBooked 
                        ? 'bg-red-900/30 cursor-not-allowed' 
                        : isSelected
                          ? 'bg-blue-600'
                          : isToday
                            ? 'bg-gray-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm">{day.getDate()}</span>
                      <span className="text-xs text-gray-400">v{weekNumber}</span>
                    </div>
                    {isBooked && (
                      <div className="text-xs text-center mt-1 text-red-300">Bokad</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const calculateBookingPrice = (booking: Booking) => {
    // Get the apartment
    const apartment = apartments.find(a => a.id === booking.apartment_id);
    if (!apartment) return 'N/A';
    
    // Calculate number of nights
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Use default price for now
    return `${nights * apartment.price_per_night} kr`;
  };

  // Helper function to format dates correctly
  const formatDate = (dateString: string) => {
    // Create a new date object with the date string
    // This ensures we're working with the actual date from the database
    const date = new Date(dateString);
    
    // Format the date in Swedish locale (YYYY-MM-DD)
    return date.toLocaleDateString('sv-SE');
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-md">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`py-2 px-4 whitespace-nowrap ${activeTab === 'calendar' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('calendar')}
          >
            Bokningar
          </button>
          <button
            className={`py-2 px-4 whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('settings')}
          >
            Inställningar
          </button>
        </div>

        {activeTab === 'calendar' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Kalender</h2>
                {renderCalendar()}
                
                {showBookingForm && selectedDates.start && selectedDates.end && (
                  <div className="mt-6 bg-gray-700 p-4 rounded-md">
                    <h3 className="text-lg font-bold mb-4">Boka gästlägenhet</h3>
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Valda datum:</p>
                      <p className="font-medium">
                        {selectedDates.start.toLocaleDateString('sv-SE')} - {selectedDates.end.toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Gästens namn *</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={newBooking.guest_name}
                          onChange={(e) => setNewBooking({...newBooking, guest_name: e.target.value})}
                          className="w-full pl-10 p-2 bg-gray-600 border border-gray-500 rounded-md"
                          placeholder="Ange gästens namn"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Telefonnummer</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={newBooking.phone_number}
                          onChange={(e) => setNewBooking({...newBooking, phone_number: e.target.value})}
                          className="w-full pl-10 p-2 bg-gray-600 border border-gray-500 rounded-md"
                          placeholder="Ange telefonnummer"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-1">Anteckningar</label>
                      <textarea
                        value={newBooking.notes}
                        onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md"
                        placeholder="Övrig information"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedDates({start: null, end: null});
                          setShowBookingForm(false);
                        }}
                        className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500"
                      >
                        Avbryt
                      </button>
                      <button
                        onClick={handleBookingSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Bokar...
                          </>
                        ) : (
                          <>
                            <Check size={18} className="mr-2" />
                            Boka
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-4">Alla bokningar</h2>
                <div className="bg-gray-700 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Datum</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Gäst</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Pris</th>
                          <th className="py-3 px-4 text-right text-xs font-medium uppercase tracking-wider">Åtgärd</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 px-4 text-center text-gray-400">
                              Inga bokningar hittades
                            </td>
                          </tr>
                        ) : (
                          bookings.map((booking) => (
                            <tr key={booking.id}>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {booking.guest_name}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {calculateBookingPrice(booking)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => confirmDeleteBooking(booking.id)}
                                  className="p-1.5 bg-red-900/30 text-red-300 rounded-md hover:bg-red-800/50"
                                  title="Avboka"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Inställningar</h2>
            
            <div className="bg-gray-700 p-4 rounded-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Säsongspriser</h3>
                <button
                  onClick={() => {
                    setEditingSeasonSetting({
                      id: '',
                      year: new Date().getFullYear() + 1,
                      low_season_price: 350,
                      high_season_price: 450,
                      tennis_season_price: 550
                    });
                    setShowSeasonSettingsForm(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Lägg till år
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">År</th>
                      <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Lågsäsong</th>
                      <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Högsäsong</th>
                      <th className="py-2 px-4 text-left text-xs font-medium uppercase tracking-wider">Tennissäsong</th>
                      <th className="py-2 px-4 text-right text-xs font-medium uppercase tracking-wider">Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {seasonSettings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-gray-400">
                          Inga säsongsinställningar hittades
                        </td>
                      </tr>
                    ) : (
                      seasonSettings.map((setting) => (
                        <tr key={setting.id}>
                          <td className="py-2 px-4 whitespace-nowrap">{setting.year}</td>
                          <td className="py-2 px-4 whitespace-nowrap">{setting.low_season_price} kr</td>
                          <td className="py-2 px-4 whitespace-nowrap">{setting.high_season_price} kr</td>
                          <td className="py-2 px-4 whitespace-nowrap">{setting.tennis_season_price} kr</td>
                          <td className="py-2 px-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => {
                                setEditingSeasonSetting(setting);
                                setShowSeasonSettingsForm(true);
                              }}
                              className="p-1.5 bg-gray-600 rounded-md hover:bg-gray-500"
                              title="Redigera"
                            >
                              <Edit size={16} />
                            </button>
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
      </div>
      
      {/* Season Settings Form Modal */}
      {showSeasonSettingsForm && editingSeasonSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Säsongspriser {editingSeasonSetting.year}</h3>
              <button
                onClick={() => {
                  setShowSeasonSettingsForm(false);
                  setEditingSeasonSetting(null);
                }}
                className="p-1 rounded-full hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">År</label>
              <input
                type="number"
                value={editingSeasonSetting.year}
                onChange={(e) => setEditingSeasonSetting({...editingSeasonSetting, year: parseInt(e.target.value)})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                disabled={editingSeasonSetting.id !== ''}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pris lågsäsong (kr/natt)</label>
              <input
                type="number"
                value={editingSeasonSetting.low_season_price}
                onChange={(e) => setEditingSeasonSetting({...editingSeasonSetting, low_season_price: parseInt(e.target.value)})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                min={0}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pris högsäsong (kr/natt)</label>
              <input
                type="number"
                value={editingSeasonSetting.high_season_price}
                onChange={(e) => setEditingSeasonSetting({...editingSeasonSetting, high_season_price: parseInt(e.target.value)})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                min={0}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Pris tennissäsong (kr/natt)</label>
              <input
                type="number"
                value={editingSeasonSetting.tennis_season_price}
                onChange={(e) => setEditingSeasonSetting({...editingSeasonSetting, tennis_season_price: parseInt(e.target.value)})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                min={0}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSeasonSettingsForm(false);
                  setEditingSeasonSetting(null);
                }}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Avbryt
              </button>
              <button
                onClick={editingSeasonSetting.id ? handleSaveSeasonSettings : handleCreateSeasonSettings}
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
                    <Check size={18} className="mr-2" />
                    Spara
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bekräfta avbokning</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setBookingToDelete(null);
                }}
                className="p-1 rounded-full hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-6">
              Är du säker på att du vill avboka denna bokning? Denna åtgärd kan inte ångras.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setBookingToDelete(null);
                }}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Avbryt
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={loading}
                className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Avbokar...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" />
                    Avboka
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

export default GastlagenhetBooking;