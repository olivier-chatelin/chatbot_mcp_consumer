import React from 'react';
import { Card } from 'react-bootstrap';
import { Message as MessageType } from '../types/chat.types';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <Card
        className={`${isUser ? 'bg-primary text-white' : 'bg-light'}`}
        style={{ maxWidth: '75%' }}
      >
        <Card.Body>
          <div className="small mb-1 opacity-75">
            {isUser ? 'Vous' : 'Assistant'}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </div>
          <div className="small mt-2 opacity-50">
            {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
