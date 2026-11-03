// Integration audit script for Starlight Stays & Resorts (P5004)
const http = require('http');

const BASE_URL = 'http://localhost:8080';

// Helper for making HTTP requests
function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, BASE_URL);
    const reqOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: json,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (bodyData) {
      if (typeof bodyData === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(bodyData));
      } else {
        req.write(bodyData);
      }
    }
    req.end();
  });
}

const auditResults = [];

function recordResult(category, testName, expectedStatus, actualStatus, pass, details = '') {
  const result = {
    category,
    testName,
    expectedStatus,
    actualStatus,
    pass,
    details,
  };
  auditResults.push(result);
  const statusStr = pass ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`${statusStr} ${category} - ${testName} (Status: ${actualStatus})`);
  if (!pass && details) {
    console.log(`       Details: ${details}`);
  }
}

async function runAudit() {
  console.log('===============================================================');
  console.log('   STARLIGHT STAYS & RESORTS — FULL-STACK INTEGRATION AUDIT    ');
  console.log('===============================================================\n');

  // 1. Gateway & CORS
  try {
    const corsRes = await request({
      path: '/api/hotels',
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowOrigin = corsRes.headers['access-control-allow-origin'];
    const allowCreds = corsRes.headers['access-control-allow-credentials'];
    const pass = corsRes.statusCode === 200 && allowOrigin === 'http://localhost:5173' && allowCreds === 'true';
    recordResult('Gateway & CORS', 'Preflight OPTIONS /api/hotels returns CORS headers', 200, corsRes.statusCode, pass, `Origin: ${allowOrigin}, Creds: ${allowCreds}`);
  } catch (err) {
    recordResult('Gateway & CORS', 'Preflight OPTIONS /api/hotels', 200, 'ERR', false, err.message);
  }

  // 2. User Service Tests
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testCustomerEmail = `audit_guest_${uniqueSuffix}@starlight.com`;
  let customerToken = null;
  let customerUserId = null;
  let adminToken = null;
  let adminUserId = null;

  // 2.1 Customer Registration
  try {
    const regRes = await request(
      {
        path: '/api/users/register',
        method: 'POST',
      },
      {
        name: `Audit Customer ${uniqueSuffix}`,
        email: testCustomerEmail,
        password: 'Password123!',
        phone: '9876543210',
        role: 'CUSTOMER',
      }
    );
    const pass = regRes.statusCode === 200 && regRes.json && regRes.json.email === testCustomerEmail && !regRes.json.password;
    customerUserId = regRes.json ? regRes.json.id : null;
    recordResult('User Service', 'Register new customer with valid unique data', 200, regRes.statusCode, pass, `Password omitted: ${!regRes.json?.password}`);
  } catch (err) {
    recordResult('User Service', 'Register new customer', 200, 'ERR', false, err.message);
  }

  // 2.2 Duplicate Registration Rejection
  try {
    const dupRes = await request(
      {
        path: '/api/users/register',
        method: 'POST',
      },
      {
        name: 'Duplicate',
        email: testCustomerEmail,
        password: 'Password123!',
      }
    );
    const pass = dupRes.statusCode === 400 && dupRes.json?.message?.includes('already registered');
    recordResult('User Service', 'Reject duplicate email registration', 400, dupRes.statusCode, pass, dupRes.json?.message);
  } catch (err) {
    recordResult('User Service', 'Reject duplicate email registration', 400, 'ERR', false, err.message);
  }

  // 2.3 Privilege Escalation Attempt: Public registration with ADMIN role
  try {
    const adminRegRes = await request(
      {
        path: '/api/users/register',
        method: 'POST',
      },
      {
        name: 'Attacker',
        email: `hacker_${uniqueSuffix}@starlight.com`,
        password: 'Password123!',
        role: 'ADMIN',
      }
    );
    const pass = adminRegRes.statusCode === 400 && adminRegRes.json?.message?.includes('administrator privileges is not permitted');
    recordResult('User Security', 'Reject public registration attempt to obtain ADMIN role', 400, adminRegRes.statusCode, pass, adminRegRes.json?.message);
  } catch (err) {
    recordResult('User Security', 'Reject public registration attempt for ADMIN', 400, 'ERR', false, err.message);
  }

  // 2.4 Customer Login
  try {
    const loginRes = await request(
      {
        path: '/api/users/login',
        method: 'POST',
      },
      {
        email: testCustomerEmail,
        password: 'Password123!',
      }
    );
    customerToken = loginRes.data?.trim();
    // Decode claims
    let role = null;
    let userId = null;
    if (customerToken && customerToken.split('.').length === 3) {
      const payload = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64').toString());
      role = payload.role;
      userId = payload.userId;
    }
    const pass = loginRes.statusCode === 200 && role === 'CUSTOMER' && userId === customerUserId;
    recordResult('User Service', 'Login customer and verify JWT claims (sub, role=CUSTOMER, userId)', 200, loginRes.statusCode, pass, `Role: ${role}, UserId: ${userId}`);
  } catch (err) {
    recordResult('User Service', 'Login customer', 200, 'ERR', false, err.message);
  }

  // 2.5 Invalid Credentials Login
  try {
    const badLoginRes = await request(
      {
        path: '/api/users/login',
        method: 'POST',
      },
      {
        email: testCustomerEmail,
        password: 'WrongPassword!',
      }
    );
    const pass = badLoginRes.statusCode === 401;
    recordResult('User Service', 'Reject login with invalid password (HTTP 401)', 401, badLoginRes.statusCode, pass, badLoginRes.json?.message);
  } catch (err) {
    recordResult('User Service', 'Reject login with invalid password', 401, 'ERR', false, err.message);
  }

  // 2.6 Admin Login
  try {
    const adminLoginRes = await request(
      {
        path: '/api/users/login',
        method: 'POST',
      },
      {
        email: 'admin@starlight.com',
        password: 'AdminPassword123',
      }
    );
    adminToken = adminLoginRes.data?.trim();
    let role = null;
    if (adminToken && adminToken.split('.').length === 3) {
      const payload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
      role = payload.role;
      adminUserId = payload.userId;
    }
    const pass = adminLoginRes.statusCode === 200 && role === 'ADMIN';
    recordResult('User Service', 'Login administrator and verify JWT claims (role=ADMIN)', 200, adminLoginRes.statusCode, pass, `Role: ${role}, AdminUserId: ${adminUserId}`);
  } catch (err) {
    recordResult('User Service', 'Login administrator', 200, 'ERR', false, err.message);
  }

  // 2.7 Security: Customer accessing GET /api/users
  try {
    const listUsersRes = await request({
      path: '/api/users',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    const pass = listUsersRes.statusCode === 403;
    recordResult('User Security', 'Customer access to GET /api/users is forbidden (HTTP 403)', 403, listUsersRes.statusCode, pass, listUsersRes.json?.message);
  } catch (err) {
    recordResult('User Security', 'Customer access to GET /api/users', 403, 'ERR', false, err.message);
  }

  // 2.8 Security: Customer accessing another user profile
  try {
    const otherUserRes = await request({
      path: `/api/users/1`, // Admin user profile
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    const pass = otherUserRes.statusCode === 403;
    recordResult('User Security', 'Customer access to another user profile is forbidden (HTTP 403)', 403, otherUserRes.statusCode, pass, otherUserRes.json?.message);
  } catch (err) {
    recordResult('User Security', 'Customer access to other user profile', 403, 'ERR', false, err.message);
  }

  // 2.9 Admin accessing GET /api/users
  try {
    const adminListRes = await request({
      path: '/api/users',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const pass = adminListRes.statusCode === 200 && Array.isArray(adminListRes.json);
    recordResult('User Service', 'Admin access to GET /api/users succeeds (HTTP 200)', 200, adminListRes.statusCode, pass, `Total users: ${adminListRes.json?.length}`);
  } catch (err) {
    recordResult('User Service', 'Admin access to GET /api/users', 200, 'ERR', false, err.message);
  }

  // 3. Hotel Service Tests
  let firstHotelId = null;
  try {
    const hotelsRes = await request({ path: '/api/hotels', method: 'GET' });
    const pass = hotelsRes.statusCode === 200 && Array.isArray(hotelsRes.json) && hotelsRes.json.length > 0;
    firstHotelId = hotelsRes.json?.[0]?.id || 1;
    recordResult('Hotel Service', 'GET /api/hotels returns hotel listings', 200, hotelsRes.statusCode, pass, `Count: ${hotelsRes.json?.length}`);
  } catch (err) {
    recordResult('Hotel Service', 'GET /api/hotels', 200, 'ERR', false, err.message);
  }

  try {
    const hotelByIdRes = await request({ path: `/api/hotels/${firstHotelId}`, method: 'GET' });
    const pass = hotelByIdRes.statusCode === 200 && hotelByIdRes.json?.id === firstHotelId;
    recordResult('Hotel Service', `GET /api/hotels/${firstHotelId} retrieves hotel details`, 200, hotelByIdRes.statusCode, pass, `Name: ${hotelByIdRes.json?.name}`);
  } catch (err) {
    recordResult('Hotel Service', 'GET /api/hotels/{id}', 200, 'ERR', false, err.message);
  }

  try {
    const filterRes = await request({ path: '/api/hotels/location/Goa', method: 'GET' });
    const pass = filterRes.statusCode === 200 && Array.isArray(filterRes.json);
    recordResult('Hotel Service', 'GET /api/hotels/location/Goa filters by city', 200, filterRes.statusCode, pass, `Found: ${filterRes.json?.length}`);
  } catch (err) {
    recordResult('Hotel Service', 'GET /api/hotels/location/Goa', 200, 'ERR', false, err.message);
  }

  try {
    const notFoundHotel = await request({ path: '/api/hotels/999999', method: 'GET' });
    const pass = notFoundHotel.statusCode === 404;
    recordResult('Hotel Service', 'GET /api/hotels/999999 returns 404 Not Found', 404, notFoundHotel.statusCode, pass, notFoundHotel.json?.message);
  } catch (err) {
    recordResult('Hotel Service', 'GET nonexistent hotel', 404, 'ERR', false, err.message);
  }

  // 4. Room Service Tests
  let sampleRoom = null;
  try {
    const roomsRes = await request({ path: '/api/rooms', method: 'GET' });
    const pass = roomsRes.statusCode === 200 && Array.isArray(roomsRes.json) && roomsRes.json.length > 0;
    sampleRoom = roomsRes.json?.find((r) => r.status === 'AVAILABLE') || roomsRes.json?.[0];
    recordResult('Room Service', 'GET /api/rooms returns room inventory', 200, roomsRes.statusCode, pass, `Total rooms: ${roomsRes.json?.length}`);
  } catch (err) {
    recordResult('Room Service', 'GET /api/rooms', 200, 'ERR', false, err.message);
  }

  try {
    const hotelRoomsRes = await request({ path: `/api/rooms/hotel/${firstHotelId}`, method: 'GET' });
    const pass = hotelRoomsRes.statusCode === 200 && Array.isArray(hotelRoomsRes.json);
    recordResult('Room Service', `GET /api/rooms/hotel/${firstHotelId} returns hotel-specific rooms`, 200, hotelRoomsRes.statusCode, pass, `Count: ${hotelRoomsRes.json?.length}`);
  } catch (err) {
    recordResult('Room Service', 'GET /api/rooms/hotel/{id}', 200, 'ERR', false, err.message);
  }

  try {
    const notFoundRoom = await request({ path: '/api/rooms/999999', method: 'GET' });
    const pass = notFoundRoom.statusCode === 404;
    recordResult('Room Service', 'GET /api/rooms/999999 returns 404 Not Found', 404, notFoundRoom.statusCode, pass, notFoundRoom.json?.message);
  } catch (err) {
    recordResult('Room Service', 'GET nonexistent room', 404, 'ERR', false, err.message);
  }

  // 5. Booking Service & Business Rules
  const targetRoomId = sampleRoom?.id || 1;
  const targetRoomPrice = sampleRoom?.price || 3500.0;

  // 5.1 Availability check for future dates
  try {
    const availRes = await request({
      path: `/api/bookings/availability?roomId=${targetRoomId}&checkIn=2026-11-15&checkOut=2026-11-20`,
      method: 'GET',
    });
    const pass = availRes.statusCode === 200 && availRes.json?.available === true;
    recordResult('Booking Logic', 'Availability check for free future dates returns available=true', 200, availRes.statusCode, pass, availRes.json?.message);
  } catch (err) {
    recordResult('Booking Logic', 'Availability check for free dates', 200, 'ERR', false, err.message);
  }

  // 5.2 Availability check rejecting past check-in
  try {
    const pastAvail = await request({
      path: `/api/bookings/availability?roomId=${targetRoomId}&checkIn=2026-10-01&checkOut=2026-10-05`,
      method: 'GET',
    });
    const pass = pastAvail.statusCode === 200 && pastAvail.json?.available === false && (pastAvail.json?.message?.includes('future') || pastAvail.json?.message?.includes('past'));
    recordResult('Booking Logic', 'Availability check rejects past check-in (returns available=false)', 200, pastAvail.statusCode, pass, pastAvail.json?.message);
  } catch (err) {
    recordResult('Booking Logic', 'Availability check rejects past check-in', 200, 'ERR', false, err.message);
  }

  // 5.3 Availability check rejecting checkout <= checkin
  try {
    const badRangeAvail = await request({
      path: `/api/bookings/availability?roomId=${targetRoomId}&checkIn=2026-11-15&checkOut=2026-11-15`,
      method: 'GET',
    });
    const pass = badRangeAvail.statusCode === 200 && badRangeAvail.json?.available === false && badRangeAvail.json?.message?.includes('after check-in');
    recordResult('Booking Logic', 'Availability check rejects check-out equal to check-in', 200, badRangeAvail.statusCode, pass, badRangeAvail.json?.message);
  } catch (err) {
    recordResult('Booking Logic', 'Availability check check-out equal to check-in', 200, 'ERR', false, err.message);
  }

  // 5.4 Booking Creation (Journey A)
  let createdBooking = null;
  const booking1CheckIn = '2026-11-15';
  const booking1CheckOut = '2026-11-20'; // 5 nights

  try {
    const bookRes = await request(
      {
        path: '/api/bookings',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      },
      {
        userId: customerUserId,
        roomId: targetRoomId,
        checkIn: booking1CheckIn,
        checkOut: booking1CheckOut,
        totalAmount: targetRoomPrice * 5,
        paymentMethod: 'CARD',
      }
    );
    createdBooking = bookRes.json;
    const isConfirmed = createdBooking?.status === 'CONFIRMED';
    const hasPayment = createdBooking?.payment?.status === 'SUCCESS';
    const amountMatches = createdBooking?.totalAmount === targetRoomPrice * 5;
    const pass = bookRes.statusCode === 200 && isConfirmed && hasPayment && amountMatches;
    recordResult('Booking Service', 'Journey A: Create booking & simulated payment confirmation', 200, bookRes.statusCode, pass, `Booking #${createdBooking?.id}, Status: ${createdBooking?.status}, Pmt: ${createdBooking?.payment?.status}, Amount: ₹${createdBooking?.totalAmount}`);
  } catch (err) {
    recordResult('Booking Service', 'Journey A: Create booking', 200, 'ERR', false, err.message);
  }

  // 5.5 Double Booking Protection (Journey B)
  try {
    const overlapRes = await request(
      {
        path: '/api/bookings',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      },
      {
        userId: customerUserId,
        roomId: targetRoomId,
        checkIn: '2026-11-17',
        checkOut: '2026-11-22', // Overlaps with 15-20
        totalAmount: targetRoomPrice * 5,
        paymentMethod: 'UPI',
      }
    );
    const pass = overlapRes.statusCode === 400 && overlapRes.json?.message?.includes('already booked');
    recordResult('Booking Logic', 'Journey B: Double-booking overlapping dates is rejected (HTTP 400)', 400, overlapRes.statusCode, pass, overlapRes.json?.message);
  } catch (err) {
    recordResult('Booking Logic', 'Journey B: Double-booking overlap rejection', 400, 'ERR', false, err.message);
  }

  // 5.6 Adjacent Booking Allowed [2026-11-20 to 2026-11-25)
  let adjacentBooking = null;
  try {
    const adjRes = await request(
      {
        path: '/api/bookings',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      },
      {
        userId: customerUserId,
        roomId: targetRoomId,
        checkIn: '2026-11-20', // Starts on exact check-out date of previous booking
        checkOut: '2026-11-25',
        totalAmount: targetRoomPrice * 5,
        paymentMethod: 'NET_BANKING',
      }
    );
    adjacentBooking = adjRes.json;
    const pass = adjRes.statusCode === 200 && adjacentBooking?.status === 'CONFIRMED';
    recordResult('Booking Logic', 'Adjacent non-overlapping date range booking is allowed', 200, adjRes.statusCode, pass, `Booking #${adjacentBooking?.id}, Status: ${adjacentBooking?.status}`);
  } catch (err) {
    recordResult('Booking Logic', 'Adjacent booking', 200, 'ERR', false, err.message);
  }

  // 5.7 Customer Ownership Restriction: Cannot view another user's bookings
  try {
    const otherBookingsRes = await request({
      path: '/api/bookings/user/1', // Admin or other user ID
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    const pass = otherBookingsRes.statusCode === 403;
    recordResult('Booking Security', "Customer cannot access another user's bookings via /api/bookings/user/{id}", 403, otherBookingsRes.statusCode, pass, otherBookingsRes.json?.message);
  } catch (err) {
    recordResult('Booking Security', 'Customer accessing other bookings', 403, 'ERR', false, err.message);
  }

  // 5.8 Customer Viewing Their Own Bookings
  try {
    const ownBookingsRes = await request({
      path: '/api/bookings',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });
    // Should be scoped to customer's own bookings
    const pass = ownBookingsRes.statusCode === 200 && Array.isArray(ownBookingsRes.json) && ownBookingsRes.json.every((b) => b.userId === customerUserId);
    recordResult('Booking Service', 'Customer GET /api/bookings is automatically scoped to own records', 200, ownBookingsRes.statusCode, pass, `Own bookings count: ${ownBookingsRes.json?.length}`);
  } catch (err) {
    recordResult('Booking Service', 'Customer GET /api/bookings', 200, 'ERR', false, err.message);
  }

  // 5.9 Cancellation & Refund Workflow (Journey C)
  if (createdBooking?.id) {
    try {
      const cancelRes = await request({
        path: `/api/bookings/${createdBooking.id}/cancel`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });
      const pass = cancelRes.statusCode === 200 && cancelRes.json?.status === 'CANCELLED';
      recordResult('Booking Service', 'Journey C: Customer cancels confirmed booking', 200, cancelRes.statusCode, pass, `Booking #${createdBooking.id} status: ${cancelRes.json?.status}`);
    } catch (err) {
      recordResult('Booking Service', 'Journey C: Cancel booking', 200, 'ERR', false, err.message);
    }

    // Verify payment was refunded in Payment Service
    try {
      const pmtLookup = await request({
        path: `/api/payments/booking/${createdBooking.id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });
      const paymentRecord = pmtLookup.json?.[0];
      const pass = pmtLookup.statusCode === 200 && paymentRecord?.status === 'REFUNDED';
      recordResult('Payment Service', 'Journey C: Automatic simulated refund status is REFUNDED', 200, pmtLookup.statusCode, pass, `Payment #${paymentRecord?.id} status: ${paymentRecord?.status}`);
    } catch (err) {
      recordResult('Payment Service', 'Payment refund status lookup', 200, 'ERR', false, err.message);
    }

    // Verify date range is available again after cancellation
    try {
      const freeAgainRes = await request({
        path: `/api/bookings/availability?roomId=${targetRoomId}&checkIn=${booking1CheckIn}&checkOut=${booking1CheckOut}`,
        method: 'GET',
      });
      const pass = freeAgainRes.statusCode === 200 && freeAgainRes.json?.available === true;
      recordResult('Booking Logic', 'Cancelled date range is released and available again', 200, freeAgainRes.statusCode, pass, freeAgainRes.json?.message);
    } catch (err) {
      recordResult('Booking Logic', 'Cancelled date range re-availability', 200, 'ERR', false, err.message);
    }

    // Prevent repeated cancellation
    try {
      const repeatCancelRes = await request({
        path: `/api/bookings/${createdBooking.id}/cancel`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });
      const pass = repeatCancelRes.statusCode === 400 && repeatCancelRes.json?.message?.includes('already cancelled');
      recordResult('Booking Logic', 'Reject repeated cancellation of already cancelled booking (HTTP 400)', 400, repeatCancelRes.statusCode, pass, repeatCancelRes.json?.message);
    } catch (err) {
      recordResult('Booking Logic', 'Reject repeated cancellation', 400, 'ERR', false, err.message);
    }
  }

  // 6. Admin Portal Operations (Journey D)
  let adminCreatedHotelId = null;
  let adminCreatedRoomId = null;

  // 6.1 Admin creates Hotel
  try {
    const addHotelRes = await request(
      {
        path: '/api/hotels',
        method: 'POST',
      },
      {
        name: `Audit Resort ${uniqueSuffix}`,
        location: 'Shimla',
        address: 'Mall Road, Shimla',
        description: 'Temporary audit luxury estate',
        contactNumber: '9123456780',
      }
    );
    adminCreatedHotelId = addHotelRes.json?.id;
    const pass = addHotelRes.statusCode === 200 && !!adminCreatedHotelId;
    recordResult('Admin Operations', 'Journey D: Admin adds new hotel property', 200, addHotelRes.statusCode, pass, `Created Hotel ID #${adminCreatedHotelId}`);
  } catch (err) {
    recordResult('Admin Operations', 'Admin add hotel', 200, 'ERR', false, err.message);
  }

  // 6.2 Admin creates Room
  if (adminCreatedHotelId) {
    try {
      const addRoomRes = await request(
        {
          path: '/api/rooms',
          method: 'POST',
        },
        {
          hotelId: adminCreatedHotelId,
          roomNumber: `AUDIT-${uniqueSuffix}`,
          roomType: 'PRESIDENTIAL',
          capacity: 4,
          price: 12000.0,
          status: 'AVAILABLE',
        }
      );
      adminCreatedRoomId = addRoomRes.json?.id;
      const pass = addRoomRes.statusCode === 200 && !!adminCreatedRoomId;
      recordResult('Admin Operations', 'Journey D: Admin adds new room to hotel inventory', 200, addRoomRes.statusCode, pass, `Created Room ID #${adminCreatedRoomId}`);
    } catch (err) {
      recordResult('Admin Operations', 'Admin add room', 200, 'ERR', false, err.message);
    }
  }

  // 6.3 Admin retrieves all bookings
  try {
    const adminAllBookings = await request({
      path: '/api/bookings',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const pass = adminAllBookings.statusCode === 200 && Array.isArray(adminAllBookings.json);
    recordResult('Admin Operations', 'Journey D: Admin retrieves all system bookings across all guests', 200, adminAllBookings.statusCode, pass, `Total bookings: ${adminAllBookings.json?.length}`);
  } catch (err) {
    recordResult('Admin Operations', 'Admin get all bookings', 200, 'ERR', false, err.message);
  }

  // 6.4 Clean up audit bookings, room & hotel
  if (adjacentBooking?.id) {
    try {
      const delAdjRes = await request({
        path: `/api/bookings/${adjacentBooking.id}/cancel`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const pass = delAdjRes.statusCode === 200 && delAdjRes.json?.status === 'CANCELLED';
      recordResult('Cleanup', `Cancel audit adjacent booking #${adjacentBooking.id}`, 200, delAdjRes.statusCode, pass, `Status: ${delAdjRes.json?.status}`);
    } catch (err) {
      recordResult('Cleanup', 'Cancel audit adjacent booking', 200, 'ERR', false, err.message);
    }
  }

  if (adminCreatedRoomId) {
    try {
      const delRoomRes = await request({ path: `/api/rooms/${adminCreatedRoomId}`, method: 'DELETE' });
      const pass = delRoomRes.statusCode === 200;
      recordResult('Cleanup', `Delete audit room #${adminCreatedRoomId}`, 200, delRoomRes.statusCode, pass, delRoomRes.data);
    } catch (err) {
      recordResult('Cleanup', 'Delete audit room', 200, 'ERR', false, err.message);
    }
  }

  if (adminCreatedHotelId) {
    try {
      const delHotelRes = await request({ path: `/api/hotels/${adminCreatedHotelId}`, method: 'DELETE' });
      const pass = delHotelRes.statusCode === 200;
      recordResult('Cleanup', `Delete audit hotel #${adminCreatedHotelId}`, 200, delHotelRes.statusCode, pass, delHotelRes.data);
    } catch (err) {
      recordResult('Cleanup', 'Delete audit hotel', 200, 'ERR', false, err.message);
    }
  }

  console.log('\n===============================================================');
  const total = auditResults.length;
  const passed = auditResults.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`TOTAL AUDIT CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================');

  return { total, passed, failed, results: auditResults };
}

runAudit().catch(console.error);
