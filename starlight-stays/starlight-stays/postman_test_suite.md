# Starlight Stays & Resorts — Postman Demonstration Suite

All API calls are directed through the **API Gateway** on port `8080` (or directly to individual microservices if isolating testing).

Base URL: `http://localhost:8080`

---

## 1. User Service & JWT Authentication (`/api/users`)

### Test 1.1: Register a Customer
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/users/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@starlight.com",
  "password": "SecretPassword123",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```
- **Expected Status:** `200 OK`
- **Verification:** User created; password is not returned in response.

### Test 1.2: Register an Admin
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/users/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Admin User",
  "email": "admin@starlight.com",
  "password": "AdminPassword123",
  "phone": "9998887776",
  "role": "ADMIN"
}
```
- **Expected Status:** `200 OK`

### Test 1.3: Login & Obtain JWT Token
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/users/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "email": "alice@starlight.com",
  "password": "SecretPassword123"
}
```
- **Expected Status:** `200 OK`
- **Response:** Raw JWT string token. Save this token for subsequent calls.

### Test 1.4: Access Protected Endpoint with JWT
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/users`
- **Headers:** 
  - `Authorization: Bearer <TOKEN>`
- **Expected Status:** `200 OK`
- **Verification:** Returns list of users. Without header, returns `403 Forbidden`.

---

## 2. Hotel Service (`/api/hotels`)

### Test 2.1: Create Hotel
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/hotels`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Starlight Grand Resort",
  "location": "Goa",
  "address": "Calangute Beach Road",
  "description": "5-star luxury seaside resort",
  "contactNumber": "9876543210"
}
```
- **Expected Status:** `200 OK`

### Test 2.2: Get All Hotels
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/hotels`
- **Expected Status:** `200 OK`

---

## 3. Room Service (`/api/rooms`)

### Test 3.1: Create Available Room
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/rooms`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "hotelId": 1,
  "roomNumber": "101",
  "roomType": "DELUXE",
  "capacity": 2,
  "price": 3500.0,
  "status": "AVAILABLE"
}
```
- **Expected Status:** `200 OK`

### Test 3.2: Create Room in Maintenance
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/rooms`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "hotelId": 1,
  "roomNumber": "102",
  "roomType": "SUITE",
  "capacity": 4,
  "price": 7000.0,
  "status": "MAINTENANCE"
}
```
- **Expected Status:** `200 OK`

### Test 3.3: Request Nonexistent Room ID
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/rooms/9999`
- **Expected Status:** `404 Not Found` (Fixed: previously returned HTTP 500)
- **Response:**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Room not found with ID: 9999"
}
```

---

## 4. Booking Service & Inter-Service Flow (`/api/bookings`)

### Test 4.1: Successful Booking with Simulated Payment
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/bookings`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "userId": 2,
  "roomId": 1,
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-15",
  "totalAmount": 17500.0,
  "paymentMethod": "CARD"
}
```
- **Expected Status:** `200 OK`
- **Verification:** 
  - Booking status: `CONFIRMED`
  - Payment status: `SUCCESS`
  - Unique `transactionId` returned in embedded `payment` object.

### Test 4.2: Reject Overlapping Booking
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/bookings`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "userId": 2,
  "roomId": 1,
  "checkIn": "2026-11-12",
  "checkOut": "2026-11-14",
  "totalAmount": 7000.0,
  "paymentMethod": "UPI"
}
```
- **Expected Status:** `400 Bad Request`
- **Response Message:** `"Room is already booked for the selected dates"`

### Test 4.3: Allow Adjacent Booking (Same Checkout / Check-in Date)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/bookings`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "userId": 2,
  "roomId": 1,
  "checkIn": "2026-11-15",
  "checkOut": "2026-11-20",
  "totalAmount": 17500.0,
  "paymentMethod": "UPI"
}
```
- **Expected Status:** `200 OK` (Checkout of previous reservation is checkin of next reservation)

### Test 4.4: Reject Room in Maintenance
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/bookings`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "userId": 2,
  "roomId": 2,
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-15",
  "totalAmount": 7000.0,
  "paymentMethod": "CARD"
}
```
- **Expected Status:** `400 Bad Request`
- **Response Message:** `"Room is currently under maintenance"`

### Test 4.5: Reject Invalid Room ID
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/bookings`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "userId": 2,
  "roomId": 9999,
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-15",
  "totalAmount": 5000.0,
  "paymentMethod": "CARD"
}
```
- **Expected Status:** `400 Bad Request`

### Test 4.6: Date-Based Room Availability Query
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/bookings/availability?roomId=1&checkIn=2026-11-10&checkOut=2026-11-15`
- **Expected Status:** `200 OK`
- **Verification:**
```json
{
  "roomId": 1,
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-15",
  "available": false,
  "message": "Room is already booked for the selected dates"
}
```

### Test 4.7: Cancel Confirmed Booking
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/bookings/1/cancel`
- **Headers:**
  - `Authorization: Bearer <TOKEN>`
- **Expected Status:** `200 OK`
- **Verification:** Booking status transitions to `CANCELLED`, payment is refunded, and dates are freed. Repeated cancellation returns `400 Bad Request` ("Booking is already cancelled").

---

## 5. Payment Service (`/api/payments`)

### Test 5.1: Get Payments for a Booking
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/payments/booking/1`
- **Expected Status:** `200 OK`
- **Verification:** Returns list of payments matching `bookingId = 1`.

### Test 5.2: Refund a Payment
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/payments/1/refund`
- **Expected Status:** `200 OK`
- **Verification:** Status updated from `SUCCESS` to `REFUNDED`.
