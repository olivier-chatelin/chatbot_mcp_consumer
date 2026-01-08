import React, { useEffect, useRef } from 'react';
import { Message } from './Message';
import { Message as MessageType } from '../types/chat.types';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-grow-1 overflow-auto p-3"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {messages.length === 0 ? (
        <div className="text-center text-muted mt-5">
          <h5>👋 Bienvenue!</h5>
          <p>Posez-moi vos questions sur le code et les bonnes pratiques de développement.</p>
        </div>
      ) : (
        <>
          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              L'assistant réfléchit...
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
