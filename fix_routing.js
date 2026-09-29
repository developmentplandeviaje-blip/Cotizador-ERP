const fs = require('fs');
const file = 'react-frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the useState for activeRoute
const oldState = "const [activeRoute, setActiveRoute] = useState('dashboard');";
const newState = `const [activeRoute, setActiveRouteState] = useState(() => {
    return window.location.hash ? window.location.hash.substring(1) : 'dashboard';
  });

  const setActiveRoute = (route) => {
    window.location.hash = route;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveRouteState(hash);
      } else {
        setActiveRouteState('dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);`;

code = code.replace(oldState, newState);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed routing in App.jsx');
