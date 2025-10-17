# Child Vaccination Management System

A complete web application for managing child vaccination records with offline support, biometric verification, and AI assistance.

## 🚀 Quick Start

### Option 1: Double-Click to Run (Easiest)
1. **Double-click** `start-app.bat` 
2. Wait for both servers to start
3. The application will open automatically in your browser

### Option 2: PowerShell Script
1. Right-click on `start-app.ps1`
2. Select "Run with PowerShell"
3. Wait for both servers to start

### Option 3: Command Line
```bash
# Install dependencies (first time only)
npm run install-all

# Start the application
npm start
```

## 📱 Application Features

- **Child Management**: Add, edit, and manage child records
- **Vaccination Scheduling**: Track vaccination schedules and due dates
- **Offline Support**: Works without internet connection
- **Biometric Verification**: Face recognition for identity verification
- **AI Assistant**: Ask questions about vaccination schedules
- **Reports**: Export vaccination data to CSV
- **Dark/Light Theme**: Toggle between themes

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## ⚙️ Configuration

1. Open the application at http://localhost:3000
2. Go to **Settings** tab
3. Set **API Base URL** to: `http://localhost:8080`
4. Click **Save**

## 🛠️ Troubleshooting

### Port Already in Use Error
- Run `start-app.bat` - it automatically kills existing processes
- Or manually run: `taskkill /f /im node.exe`

### Cannot GET / Error
- Make sure you're using `http://localhost:3000` (not `https://`)
- Try refreshing the browser page
- Check that both servers are running

### Application Won't Start
1. Make sure Node.js is installed
2. Run `npm run install-all` to install all dependencies
3. Try running `start-app.bat` again

## 📁 Project Structure

```
child vaccine/
├── index.html          # Main HTML file
├── app.js             # Frontend JavaScript
├── styles.css         # Styling
├── start-app.bat      # Windows batch file to start app
├── start-app.ps1      # PowerShell script to start app
├── package.json       # Root package configuration
└── server/            # Backend server
    ├── server.js      # Main server file
    ├── package.json   # Server dependencies
    └── data/          # Database files
```

## 🔧 Development

### Start Development Mode
```bash
npm run dev
```

### Install Dependencies
```bash
npm run install-all
```

### Run Database Migration
```bash
npm run migrate
```

## 📝 Usage Instructions

1. **Add Children**: Go to "Children" tab → Fill form → Save
2. **View Schedule**: Go to "Schedule" tab → See vaccination timeline
3. **Mark Vaccinations**: Click "Mark done" when vaccines are given
4. **Export Reports**: Go to "Reports" tab → Click "Export CSV"
5. **AI Assistant**: Ask questions about vaccination schedules
6. **Biometric Verification**: Use camera for face recognition

## 🆘 Support

If you encounter any issues:
1. Check that both servers are running (ports 3000 and 8080)
2. Verify the API URL is set correctly in Settings
3. Try refreshing the browser page
4. Restart the application using `start-app.bat`

---

**Made with ❤️ for child health management**
