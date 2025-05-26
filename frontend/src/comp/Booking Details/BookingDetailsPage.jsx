import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db,auth } from '../../firebase/firebase_config'
import { Calendar, Clock, MapPin, User, Mail, Phone, Ticket, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const BookingDetailsPage = () => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');

  const { bookingId, vendorId } = useParams();

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId, vendorId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!bookingId) {
        throw new Error('No booking ID provided');
      }

      if (!vendorId) {
        throw new Error('No vendor ID provided');
      }

      // Fetch booking document from Firestore
      const bookingDoc = await getDoc(doc(db, 'tickets', bookingId));
      
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      const data = bookingDoc.data();
      
      // Verify vendor ownership - check if vendorId matches ownerId or vendorId field
      if (data.ownerId !== vendorId && data.vendorId !== vendorId) {
        throw new Error('Unauthorized access to this booking');
      }

      // Format the data for display
      const formattedData = {
        ...data,
        bookingDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'N/A',
        eventDate: data.eventDate || 'N/A',
        eventTime: data.eventTime || 'N/A',
        phone: data.phone || 'N/A',
        email: data.email || 'N/A',
        eventName: data.eventName || 'N/A',
        location: data.location || 'N/A',
        // Ensure financial object exists with default values
        financial: {
          convenienceFee: 0,
          discount: 0,
          isFreeEvent: false,
          subtotal: 0,
          tax: 0,
          totalAmount: 0,
          ...data.financial
        },
        // Ensure arrays exist
        ticketSummary: data.ticketSummary || [],
        foodSummary: data.foodSummary || [],
        status: data.status || 'active',
        checkedIn: data.checkedIn || false,
        checkedInTime: data.checkedInTime || null
      };

      setBookingData(formattedData);

    } catch (error) {
      console.error('Error fetching booking:', error);
      setError(error.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
         console.log('Current user:', auth.currentUser?.uid);
    console.log('Vendor ID from URL:', vendorId);
    console.log('Ticket vendor ID:', bookingData.vendorId);
      setCheckingIn(true);

      // Update booking document in Firestore
      await updateDoc(doc(db, 'tickets', bookingId), {
        checkedIn: true,
        checkedInTime: new Date().toISOString()
      });

      // Update local state
      setBookingData(prev => ({
        ...prev,
        checkedIn: true,
        checkedInTime: new Date().toISOString()
      }));

      alert('Successfully checked in!');

    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Booking Details</h1>
          <div className={`px-3 py-1 rounded-full text-sm ${
            bookingData.checkedIn 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {bookingData.checkedIn ? 'Checked In' : 'Pending Check-in'}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Booking ID & Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{bookingData.bookingId}</h2>
            <p className="text-gray-600">Booking Reference</p>
            {bookingData.checkedIn && (
              <div className="mt-4 flex items-center justify-center text-green-600">
                <CheckCircle size={20} className="mr-2" />
                <span className="font-medium">Checked in at {new Date(bookingData.checkedInTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Ticket className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-gray-800">{bookingData.eventName}</p>
                <p className="text-sm text-gray-600">Event Name</p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-gray-800">{bookingData.eventDate}</p>
                <p className="text-sm text-gray-600">Event Date</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-gray-800">{bookingData.eventTime}</p>
                <p className="text-sm text-gray-600">Event Time</p>
              </div>
            </div>

            <div className="flex items-center">
              <MapPin className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-gray-800">{bookingData.location}</p>
                <p className="text-sm text-gray-600">Location</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Mail className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-gray-800">{bookingData.email}</p>
                <p className="text-sm text-gray-600">Email</p>
              </div>
            </div>

            <div className="flex items-center">
              <Phone className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-gray-800">{bookingData.phone}</p>
                <p className="text-sm text-gray-600">Phone</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Summary</h3>
          
          {bookingData.ticketSummary && bookingData.ticketSummary.length > 0 ? (
            bookingData.ticketSummary.map((ticket, index) => (
              <div key={index} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{ticket.type || 'Ticket'}</p>
                    <p className="text-sm text-gray-600">Quantity: {ticket.quantity || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">${ticket.ticket_total || 0}</p>
                    <p className="text-sm text-gray-600">${ticket.price || 0} each</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No tickets found</p>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800">${bookingData.financial.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-800">${bookingData.financial.tax}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Convenience Fee</span>
              <span className="text-gray-800">${bookingData.financial.convenienceFee}</span>
            </div>
            {bookingData.financial.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${bookingData.financial.discount}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${bookingData.financial.totalAmount}</span>
            </div>
            {bookingData.financial.isFreeEvent && (
              <p className="text-center text-green-600 font-medium">Free Event</p>
            )}
          </div>
        </div>

        {/* Check-in Button */}
        {!bookingData.checkedIn && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg ${
                checkingIn 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
              }`}
            >
              {checkingIn ? 'Checking In...' : 'Check In Customer'}
            </button>
          </div>
        )}

        {/* Booking Metadata */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Booked on {bookingData.bookingDate}</p>
          <p>Status: {bookingData.status}</p>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;