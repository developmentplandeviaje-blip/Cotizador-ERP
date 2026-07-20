import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('Cargando...');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/test`)
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('Error conectando a la API:', error);
        setMessage('Error al conectar con el backend');
      });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Frontend React</h1>
      <p>Respuesta del Backend:</p>
      <strong>{message}</strong>
    </div>
  );
}

export default App;