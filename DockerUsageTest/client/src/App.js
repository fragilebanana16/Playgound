import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';


function App() {
  const [data, setData] = useState("");
  useEffect(() => {
    fetch('http://localhost:3001/api/hello')
    .then(response => response.json())
    .then(json => {
      console.log(json)    
      setData(json.message)
  })
    .catch(error => console.log('failed: ' + error.message));

    
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>fetched data 12345{data}</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
