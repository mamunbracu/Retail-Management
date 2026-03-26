import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AdminApp } from './admin/AdminApp';
import { StoreApp } from './store/StoreApp';
import { StoreProvider } from './store/StoreContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StoreProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminApp />} />
              
              {/* Store Routes */}
              <Route path="/*" element={<StoreApp />} />
            </Routes>
          </Router>
        </StoreProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
