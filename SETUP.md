# Admin Panel Setup Guide

This guide will help you set up and run the Eraiiz Admin Panel with the backend API.

## Prerequisites

1. **Backend API Running**: Make sure the backend server is running on port 5000
2. **MongoDB**: Ensure MongoDB is connected and running
3. **Node.js**: Version 18+ required
4. **Admin User**: Admin users must be created in the database

## Quick Start

### 1. Create Admin Users

Run the seed script to create admin users:

```bash
cd backend
node scripts/seed-admin-user.js
```

This will create:
- **Super Admin**: admin@eraiiz.com / admin123
- **Moderator**: moderator@eraiiz.com / mod123

### 2. Start Backend Server

Make sure your backend server is running:

```bash
cd backend
npm start
# or
npm run dev
```

The backend should be running on http://localhost:5000

### 3. Configure Environment Variables

In the admin panel directory, copy the environment file:

```bash
cd admin-panel
cp .env.local.example .env.local
```

Update `.env.local` with your settings:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### 4. Install Dependencies

```bash
cd admin-panel
npm install
```

### 5. Start Admin Panel

```bash
npm run dev
```

The admin panel will be available at http://localhost:3000

## Login Credentials

### Super Admin
- **Email**: admin@eraiiz.com
- **Password**: admin123
- **Permissions**: Full access to all features

### Moderator
- **Email**: moderator@eraiiz.com  
- **Password**: mod123
- **Permissions**: Limited access for content moderation

## Features Available

### ✅ Real-time Dashboard
- Live user, product, and order statistics
- Revenue analytics from actual database
- Sales charts with real data
- Category distribution from products
- Recent activity feed

### ✅ User Management
- View all users with filtering and search
- Edit user details and roles
- Verify/block users
- Bulk user operations
- User statistics and activity

### ✅ Product Management
- Product approval workflow
- View pending products for approval
- Approve/reject products with reasons
- Edit product details
- Bulk product operations
- Sustainability metrics tracking

### ✅ Order Management
- Real-time order tracking
- Update order status (pending → processing → shipped → delivered)
- Add tracking numbers
- Cancel orders with reasons
- Bulk order operations
- Order analytics

### ✅ Review Moderation
- Review approval system
- Flag inappropriate content
- Priority-based review queue
- Bulk review operations
- Review statistics

### ✅ Notification Center
- System notification management
- Send notifications to users
- Track delivery status
- Notification analytics

### ✅ Analytics & Reporting
- Sales performance tracking
- User growth analytics
- Product performance metrics
- Revenue insights
- Category analysis

## API Integration

The admin panel is fully integrated with the backend API:

### Available Endpoints

**Authentication**
- `POST /api/auth/login` - Admin login
- `GET /api/auth/session` - Session validation

**Dashboard Analytics**
- `GET /api/admin/dashboard-stats` - Key metrics
- `GET /api/admin/sales-analytics` - Sales data
- `GET /api/admin/category-analytics` - Category distribution
- `GET /api/admin/top-products` - Best performing products
- `GET /api/admin/recent-activity` - Recent platform activity

**User Management**
- `GET /api/admin/users` - List users with filters
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/verify` - Verify user
- `PATCH /api/admin/users/:id/block` - Block/unblock user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/bulk` - Bulk operations

**Product Management**
- `GET /api/admin/products` - List products with filters
- `GET /api/admin/products/:id` - Get product details
- `PATCH /api/admin/products/:id/approve` - Approve product
- `PATCH /api/admin/products/:id/reject` - Reject product
- `PATCH /api/admin/products/:id/status` - Update status
- `POST /api/admin/products/bulk` - Bulk operations

**Order Management**
- `GET /api/admin/orders` - List orders with filters
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status
- `PATCH /api/admin/orders/:id/tracking` - Add tracking number
- `PATCH /api/admin/orders/:id/cancel` - Cancel order
- `POST /api/admin/orders/bulk` - Bulk operations

**Review Management**
- `GET /api/admin/reviews` - List reviews with filters
- `PATCH /api/admin/reviews/:id/approve` - Approve review
- `PATCH /api/admin/reviews/:id/reject` - Reject review
- `PATCH /api/admin/reviews/:id/flag` - Flag review
- `POST /api/admin/reviews/bulk` - Bulk operations

**Notification Management**
- `GET /api/admin/notifications` - List notifications
- `POST /api/admin/notifications` - Create notification
- `POST /api/admin/notifications/:id/send` - Send notification
- `DELETE /api/admin/notifications/:id` - Delete notification

## Real-time Features

### WebSocket Integration
The backend includes WebSocket support for real-time updates:
- Live order status changes
- Real-time user activity
- Instant notifications
- Live dashboard metrics

### Auto-refresh
The admin panel automatically refreshes data every 30 seconds for:
- Dashboard statistics
- Recent activity
- Pending items count

## Troubleshooting

### Common Issues

**1. "Network Error" or API calls failing**
- Check if backend server is running on port 5000
- Verify CORS settings in backend allow admin panel origin
- Check `.env.local` file has correct API URL

**2. "Access Denied" errors**
- Ensure you're logged in with admin credentials
- Check user role in database (should be 'admin')
- Clear browser storage and login again

**3. "No data available"**
- Check if database has data
- Verify MongoDB connection
- Run database seed scripts if needed

**4. Authentication issues**
- Verify admin users exist in database
- Check JWT_SECRET environment variable
- Ensure passwords are correctly hashed

### Development Tips

**Enable Debug Mode**
Add to `.env.local`:
```env
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

**API Monitoring**
Monitor API calls in browser developer tools Network tab

**Database Inspection**
Use MongoDB Compass or similar tool to inspect data

## Production Deployment

### Environment Variables
Update for production:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
NODE_ENV=production
```

### Security Considerations
1. Change default admin passwords
2. Use strong JWT secrets
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up rate limiting
6. Enable audit logging

### Performance Optimization
1. Enable caching for static data
2. Implement pagination for large datasets
3. Use CDN for static assets
4. Monitor API response times
5. Optimize database queries

## Support

For technical support:
1. Check this setup guide
2. Review backend API documentation
3. Check browser console for errors
4. Verify database connectivity
5. Contact development team

---

**Built with ❤️ for sustainable commerce on the Eraiiz platform.**