import React, { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "./hooks/useAuth";
import Layout from "./components/Layout";
import LoginForm from "./components/LoginForm";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import Assignments from "./pages/Assignments";
import Bases from "./pages/Bases";
import Audit from "./pages/Audit";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || 'dashboard';
      setCurrentPage(path);
    };

    // Set initial page
    handlePopState();

    // Listen for navigation changes
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <Assets />;
      case 'purchases':
        return <Purchases />;
      case 'transfers':
        return <Transfers />;
      case 'assignments':
        return <Assignments />;
      case 'bases':
        return <Bases />;
      case 'audit':
        return <Audit />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
