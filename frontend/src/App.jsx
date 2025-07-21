// ✅ src/App.jsx
import './style.css';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
  const isLoggedIn = localStorage.getItem("token");
  return (
    <div className="container">
      {isLoggedIn ? <Dashboard /> : <AuthPage />}
    </div>
  );
}

export default App;
