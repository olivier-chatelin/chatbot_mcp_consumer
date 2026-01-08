import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  return (
    <div className="min-vh-100 bg-light">
      <ChatInterface />
    </div>
  );
};

export default App;
