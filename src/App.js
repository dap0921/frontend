
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import EditExpense from './components/EditExpense';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import UserDetails from './components/UserDetails';
import MonthlyBudget from './components/MonthlyBudget';
import ChatBot from './components/ChatBot';
import SharedExpenses from './components/SharedExpenses';

import './App.css';

function ProtectedRoute({ children }) {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    if (!user.token || !user.id) {
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    return children;
  } catch (error) {
    console.error('Invalid user session:', error);
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}

function AdminRoute({ children }) {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    if (!user.token || !user.id) {
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (error) {
    console.error('Invalid admin session:', error);
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/budget"
        element={
          <ProtectedRoute>
            <MonthlyBudget />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses/add"
        element={
          <ProtectedRoute>
            <AddExpense />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses/edit/:id"
        element={
          <ProtectedRoute>
            <EditExpense />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chatbot"
        element={
          <ProtectedRoute>
            <ChatBot />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shared-expenses"
        element={
          <ProtectedRoute>
            <SharedExpenses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <AdminRoute>
            <UserDetails />
          </AdminRoute>
        }
      />

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
