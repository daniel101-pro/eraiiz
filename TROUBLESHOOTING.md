# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 🌐 Network Error on Login

**Error:** `AxiosError: Network Error` when trying to login

**Cause:** The backend server (hosted on Render's free tier) goes into hibernation mode after periods of inactivity.

**Solutions:**

#### ✅ **Wait for Server Wake-up**
1. The server is automatically waking up from hibernation
2. This can take 30-60 seconds on the first request
3. The login page now shows a **Server Status** indicator
4. Wait for the status to show "Server is online and ready"

#### ✅ **Manual Wake-up**
1. Open a new browser tab
2. Visit: `https://eraiiz-backend.onrender.com/api/auth/login`
3. Wait for the page to load (even if it shows an error)
4. Return to the admin panel and try logging in again

#### ✅ **Retry Logic**
The admin panel now automatically:
- Detects hibernation (503 errors)
- Waits 3 seconds and retries once
- Shows helpful error messages

### 🔑 Login Credentials

**For Demo/Testing:**
- Super Admin: `admin@eraiiz.com` / `admin123`
- Moderator: `moderator@eraiiz.com` / `mod123`

**For Production:**
- Credentials are shared with authorized personnel only
- Contact your administrator for access

### 🎨 Theme Issues

**Dark Mode Not Working:**
1. Check if browser supports CSS custom properties
2. Clear browser cache and localStorage
3. Try manually toggling theme in top-right corner

**Colors Not Matching Eraiiz Brand:**
- Ensure you're using the latest version
- Check if CSS variables are loading properly
- Try hard refresh (Cmd/Ctrl + Shift + R)

### 📱 Responsive Issues

**Layout Broken on Mobile:**
1. Check if viewport meta tag is present
2. Try rotating device orientation
3. Ensure zoom level is at 100%

**Sidebar Not Collapsing:**
1. Click the menu icon in the sidebar header
2. Check if JavaScript is enabled
3. Try refreshing the page

### 🔧 Development Issues

**Build Errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

**TypeScript Errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions
npm update @types/react @types/node
```

**API Connection Issues:**
1. Check if `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. Verify CORS configuration on backend
3. Ensure backend is running and accessible

### 🚀 Performance Issues

**Slow Loading:**
1. Check network connection
2. Verify backend server status
3. Clear browser cache
4. Disable browser extensions

**High Memory Usage:**
1. Close unused browser tabs
2. Check for memory leaks in browser dev tools
3. Restart the browser

### 🛡️ Security Issues

**Authentication Failing:**
1. Check if JWT tokens are valid
2. Verify token expiration times
3. Clear localStorage and try again

**CORS Errors:**
1. Ensure admin panel URL is in backend CORS origins
2. Check if requests include proper headers
3. Verify protocol (HTTP vs HTTPS) consistency

### 📊 Data Not Loading

**Dashboard Empty:**
1. Check if user has proper permissions
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure backend database is connected

**Real-time Updates Not Working:**
1. Check if WebSocket connections are supported
2. Verify firewall/proxy settings
3. Ensure stable internet connection

### 🔄 Automatic Solutions

The admin panel includes several automatic fixes:

#### **Server Hibernation Detection**
- Automatically detects 503 errors
- Waits and retries failed requests
- Shows user-friendly status messages

#### **Token Refresh**
- Automatically refreshes expired JWT tokens
- Redirects to login when refresh fails
- Maintains session across page reloads

#### **Error Recovery**
- Graceful error handling for network issues
- Fallback UI states for failed requests
- Automatic retry mechanisms

### 📞 Getting Help

If issues persist:

1. **Check Browser Console:** Look for detailed error messages
2. **Network Tab:** Verify API requests and responses
3. **Clear Data:** Try incognito/private browsing mode
4. **Update Browser:** Ensure you're using a modern browser
5. **Contact Support:** Reach out with error details and screenshots

### 🌐 Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Features Requiring Modern Browsers:**
- CSS Custom Properties (Dark Mode)
- Fetch API (Network Requests)
- Local Storage (Settings Persistence)
- CSS Grid (Layout)

### 🔧 Quick Fixes

**Reset Everything:**
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Force Server Wake-up:**
```bash
# Run in terminal
curl https://eraiiz-backend.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

**Check API Status:**
```javascript
// Run in browser console
fetch('https://eraiiz-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test', password: 'test' })
}).then(r => console.log('Status:', r.status));
```

---

**Remember:** Many issues resolve automatically as the backend wakes up from hibernation. The **Server Status** indicator on the login page provides real-time feedback about server availability.