import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import './App.css';

// Auth Context for managing user state
const AuthContext = createContext(null);

// Custom hook to use the auth context
const useAuth = () => {
  return useContext(AuthContext);
};

// Mock user database hook
const useUserDatabase = () => {
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const addUser = (email, password) => {
    const newUser = { 
      email, 
      password,
      name: 'Raizhi Jane Sarino', // Default values for new users
      course: 'Bachelor of Science in Information Technology',
      quote: '"Growth begins at the end of your comfort zone"',
      academicStats: {
        gpa: '2.0',
        completedCredits: 5,
        currentSemester: '2nd Semester 2024-2025',
        organizationInvolvement: 'City Scholar'
      },
      recentActivities: [
        { id: 1, action: 'Completed Web Development Project', time: '2 hours ago' },
        { id: 2, action: 'IT Club Meeting', time: 'Yesterday' },
        { id: 3, action: 'Submitted Midterm Requirements', time: '3 days ago' }
      ]
    };
    setUsers([...users, newUser]);
    return newUser;  // Return the new user object
  };

  const findUser = (email) => {
    return users.find(user => user.email === email);
  };

  return { users, addUser, findUser };
};

// Auth Provider Component
function AuthProvider({ children }) {
  const { users, addUser, findUser } = useUserDatabase();
  const [currentUser, setCurrentUser] = useState(null);
  
  const login = (email, password) => {
    const user = findUser(email);
    if (user && user.password === password) {
      setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, message: user ? 'Invalid password' : 'User not found' };
  };
  
  const logout = () => {
    setCurrentUser(null);
  };
  
  const signup = (email, password) => {
    if (findUser(email)) {
      return { success: false, message: 'Email already exists' };
    }
    
    // More robust email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|co|us|io|info|biz)$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }
    
    const newUser = addUser(email, password);
    setCurrentUser(newUser);  // Directly set the new user as current user
    return { success: true, user: newUser };
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, login, logout, signup, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Layout Component for consistent UI
function Layout() {
  return (
    <div className="app-container">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// NotFound Component
function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for doesn't exist.</p>
      <Link to="/login" className="link">Return to Login</Link>
    </div>
  );
}

// SignUp Component - Updated with email instead of username
function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isAuthenticated } = useAuth();
  
  // Check if we have a message from the login page
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      
      // Pre-fill email if it was passed from login
      if (location.state.email) {
        setEmail(location.state.email);
      }
    }
  }, [location.state]);

  // If authentication state changes, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignUp = (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Try to sign up
    const result = signup(email, password);
    
    if (!result.success) {
      setError(result.message);
      return;
    }
    
    // The useEffect will handle the redirect now
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSignUp} className="login-form">
        <h2>Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
        <p className="form-footer">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}

// Login Component - Updated with email instead of username
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Check if we have a message from another page
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simple login validation
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    // More robust email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|co|us|io|info|biz)$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Attempt login
    const result = login(email, password);
    
    if (!result.success) {
      if (result.message === 'User not found') {
        // Redirect to signup with the email if user doesn't exist
        navigate('/signup', { 
          state: { 
            message: 'Email not registered. Please sign up.',
            email: email
          } 
        });
        return;
      }
      
      setError(result.message);
      return;
    }
    
    // Navigate to dashboard on successful login
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Annyeong, Chingu!</h2>
        {error && <p className="error-message">{error}</p>}
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">LOG IN</button>
        <p className="form-footer">
          Don't have an account? <Link to="/signup" className="link">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If no current user, show loading or redirect
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser.name}</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      <div className="dashboard-profile">
        <h2>Profile Overview</h2>
        <p>Course: {currentUser.course}</p>
        <p className="user-quote">{currentUser.quote}</p>
      </div>

      <div className="dashboard-stats">
        <h2>Academic Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Current GPA</h3>
            <p>{currentUser.academicStats.gpa}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Credits</h3>
            <p>{currentUser.academicStats.completedCredits}</p>
          </div>
          <div className="stat-card">
            <h3>Current Semester</h3>
            <p>{currentUser.academicStats.currentSemester}</p>
          </div>
          <div className="stat-card">
            <h3>Organization</h3>
            <p>{currentUser.academicStats.organizationInvolvement}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-recent-activity">
        <h2>Recent Activities</h2>
        <ul>
          {currentUser.recentActivities.map((activity) => (
            <li key={activity.id}>
              <span className="activity-action">{activity.action}</span>
              <span className="activity-time">{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Protected Route Component to ensure users are authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;