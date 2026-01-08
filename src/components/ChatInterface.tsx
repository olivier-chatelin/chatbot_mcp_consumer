import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { useChat } from '../hooks/useChat';

export const ChatInterface: React.FC = () => {
  const { messages, isLoading, error, sendUserMessage, clearMessages } = useChat();

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      <Card className="shadow">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">💻 Code Assistant</h4>
          {messages.length > 0 && (
            <Button
              variant="light"
              size="sm"
              onClick={clearMessages}
              disabled={isLoading}
            >
              Nouvelle conversation
            </Button>
          )}
        </Card.Header>
        <Card.Body className="p-0 d-flex flex-column" style={{ height: 'calc(100vh - 200px)' }}>
          {error && (
            <Alert variant="danger" className="m-3 mb-0" dismissible>
              {error}
            </Alert>
          )}
          <MessageList messages={messages} isLoading={isLoading} />
        </Card.Body>
        <InputArea onSendMessage={sendUserMessage} disabled={isLoading} />
      </Card>
    </Container>
  );
};
