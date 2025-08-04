# Deployment Guide for Admin Panel

## Current Status

✅ **Admin Panel**: Ready for deployment
✅ **Admin User**: Created on live backend (admin@eraiiz.com / admin123)
⚠️ **Admin Routes**: Need to be deployed to live backend

## What's Working

- Admin authentication (login works)
- Frontend admin panel is built and ready
- Live backend at https://eraiiz-backend.onrender.com

## What Needs Deployment

The admin routes I created need to be deployed to your live backend:

### New Files to Deploy to Live Backend:

1. **Admin Routes:**
   - `backend/routes/admin.js` - Dashboard analytics
   - `backend/routes/adminUsers.js` - User management
   - `backend/routes/adminProducts.js` - Product management  
   - `backend/routes/adminOrders.js` - Order management
   - `backend/routes/adminReviews.js` - Review moderation
   - `backend/routes/adminNotifications.js` - Notification management

2. **Updated Files:**
   - `backend/server.js` - Added admin route imports and mounts
   - `backend/models/Review.js` - Added moderation fields

3. **Admin Scripts:**
   - `backend/scripts/seed-admin-user.js` - Admin user creation (already run)

## Deployment Steps

### Option 1: Deploy via Git (Recommended)

```bash
# 1. Commit all admin changes to your repository
git add .
git commit -m "Add admin panel backend routes and functionality"
git push origin main

# 2. Your live backend (Render) should auto-deploy
# Wait for deployment to complete
```

### Option 2: Manual File Upload

If you're not using Git auto-deployment:

1. Upload all the new admin route files to your live backend
2. Update server.js with the admin route imports
3. Restart your backend service

## Testing After Deployment

Once deployed, test these endpoints:

```bash
# 1. Login to get token
curl https://eraiiz-backend.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eraiiz.com","password":"admin123"}'

# 2. Test admin dashboard (replace TOKEN with actual token)
curl https://eraiiz-backend.onrender.com/api/admin/dashboard-stats \
  -H "Authorization: Bearer TOKEN"

# 3. Test user management
curl https://eraiiz-backend.onrender.com/api/admin/users \
  -H "Authorization: Bearer TOKEN"
```

## Admin Panel Access

Once backend is deployed:

1. **Start Admin Panel:**
   ```bash
   cd admin-panel
   npm run dev
   ```

2. **Access at:** http://localhost:3000

3. **Login with:**
   - Email: admin@eraiiz.com
   - Password: admin123

## Features Available After Deployment

### ✅ Real-time Dashboard
- Live user, product, order statistics
- Revenue analytics
- Sales charts
- Category distribution

### ✅ User Management
- View all users with filtering
- Edit user details and roles
- Verify/block users
- Bulk operations

### ✅ Product Management
- Product approval workflow
- Sustainability tracking
- Bulk approve/reject operations

### ✅ Order Management
- Real-time order tracking
- Status updates with notifications
- Tracking number management

### ✅ Review Moderation
- Review approval system
- Flag inappropriate content
- Priority-based moderation

### ✅ Notification Center
- Send system notifications
- Track delivery status
- Notification analytics

## Environment Variables

Make sure your live backend has these environment variables:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5000
```

## CORS Configuration

The backend is already configured to allow requests from:
- http://localhost:3000 (admin panel)
- Your frontend domain

## Troubleshooting

### If admin routes return 404:
1. Check if deployment completed successfully
2. Verify all admin route files are uploaded
3. Check server.js includes admin route imports
4. Restart backend service

### If authentication fails:
1. Verify admin user exists in database
2. Check JWT_SECRET environment variable
3. Ensure passwords match

### If CORS errors occur:
1. Add your admin panel domain to CORS origins
2. Check admin panel is using correct API URL

## Next Steps

1. **Deploy backend changes** to live server
2. **Test admin endpoints** work with authentication
3. **Access admin panel** at http://localhost:3000
4. **Login with admin credentials**
5. **Start managing your platform!**

---

The admin panel provides comprehensive real-time management of your entire Eraiiz platform once the backend routes are deployed.