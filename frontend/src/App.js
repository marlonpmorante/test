import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Import components
import LoginForm from './components/LoginForm';
import MainApp from './pages/main';
// InventoryForm will be rendered as the default home route within MainApp

// Reusable PrivateRoute component to protect routes
const PrivateRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // State to store user role (e.g., 'admin', 'member')
  const [username, setUsername] = useState(null); // State to store the logged-in username

  // This function will be called by LoginForm upon successful login
  const handleLoginSuccess = (role, name) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(name);
  };

  // Handle logout (resets all authentication states)
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername(null);
  };

  return (
    <Router>
      <Routes>
        {/* Login route - LoginForm needs to pass back the user's role and username */}
        <Route
          path="/login"
          element={<LoginForm onLogin={handleLoginSuccess} />}
        />
        <Route
          path="/*" // This path will match any route not explicitly defined before it
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              {/* Pass userRole and username to MainApp */}
              <MainApp onLogout={handleLogout} userRole={userRole} username={username} />
            </PrivateRoute>
          }
        />

        {/* Redirect to /login if the initial path is not recognized and not authenticated */}
        {!isAuthenticated && <Route path="*" element={<Navigate to="/login" />} />}
      </Routes>
    </Router>
  );
};

export default App;