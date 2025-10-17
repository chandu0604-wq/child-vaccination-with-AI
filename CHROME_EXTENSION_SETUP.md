# Chrome Extension Setup Guide

## Fixing Cache Issues (Updated for v1.0.2)

If your Chrome extension is showing old features, follow these steps:

### Method 1: Quick Reload (Recommended)
1. Go to `chrome://extensions/`
2. Find your "Child Vaccination Management" extension
3. Click the refresh/reload button (circular arrow icon)
4. The extension should now load with version 1.0.2

### Method 2: Complete Cache Clear
1. Open Chrome Developer Tools (F12) in the extension popup
2. Go to Application tab
3. Click on "Storage" in the left sidebar
4. Click "Clear storage" button
5. Go back to `chrome://extensions/` and reload the extension

### Method 3: Advanced Cache Clearing
1. Open Chrome Developer Tools (F12)
2. Go to Console tab
3. Copy and paste the contents of `clear-cache.js` file
4. Press Enter to execute the comprehensive cache clearing script
5. The page will automatically reload after clearing

### Method 4: Force Service Worker Update
1. Open Chrome Developer Tools (F12)
2. Go to Application tab
3. Click on "Service Workers" in the left sidebar
4. Click "Unregister" on any old service workers
5. Refresh the extension in `chrome://extensions/`

## SMS Configuration

### Setting up Twilio for Indian SMS

1. **Create Twilio Account**
   - Go to https://www.twilio.com/
   - Sign up for an account
   - Get your Account SID and Auth Token

2. **Configure Environment Variables**
   Create a `.env` file in the `server` directory:
   ```
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_NUMBER=+1234567890
   PORT=8080
   ```

3. **Indian Phone Number Formats**
   The system accepts these formats:
   - `9876543210` (10 digits starting with 6,7,8,9)
   - `+919876543210` (with country code)
   - `919876543210` (without + sign)

4. **Test SMS**
   - Use the SMS form in the Dashboard
   - Enter a valid Indian phone number
   - Send a test message

## New Features Added

1. **SMS Notifications**
   - Send SMS to parents/guardians
   - Indian phone number validation
   - Template messages
   - Quick SMS from children table

2. **Improved Caching**
   - Cache busting with timestamps
   - Force service worker updates
   - Better offline support

3. **Enhanced UI**
   - SMS form in Dashboard
   - Send SMS button in Children table
   - Phone number validation feedback

## Troubleshooting

### Extension Not Loading New Features
1. Clear browser cache completely
2. Uninstall and reinstall the extension
3. Check console for errors

### SMS Not Sending
1. Verify Twilio credentials
2. Check phone number format
3. Ensure sufficient Twilio credits
4. Check server logs for errors

### Phone Number Validation Issues
- Use 10-digit Indian mobile numbers
- Numbers must start with 6, 7, 8, or 9
- Country code +91 is automatically added
