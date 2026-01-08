import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Alert, Badge } from 'react-bootstrap';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { useChat } from '../hooks/useChat';
import { fetchHealth, HealthResponse } from '../services/healthService';

export const ChatInterface: React.FC = () => {
  const { messages, isLoading, error, sendUserMessage, clearMessages } = useChat();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    // Fetch health info on mount
    fetchHealth().then(setHealth);
  }, []);

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      <div className="d-flex gap-3">
        {/* Main chat area */}
        <Card className="shadow flex-grow-1">
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

        {/* Info sidebar */}
        <div style={{ width: '280px' }}>
          {health && (
            <Card className="shadow mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">🤖 Modèle</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-2">
                  <strong>Provider:</strong>
                  <div className="text-muted">{health.provider.name}</div>
                </div>
                <div>
                  <strong>Modèle:</strong>
                  <div className="text-muted small">{health.provider.model}</div>
                </div>
              </Card.Body>
            </Card>
          )}

          {health?.mcp.connected && health.mcp.tools.length > 0 && (
            <Card className="shadow">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">🔧 Outils MCP</h6>
              </Card.Header>
              <Card.Body>
                <ul className="list-unstyled mb-0">
                  {health.mcp.tools.map((tool, index) => (
                    <li key={index} className="mb-2">
                      <Badge bg="secondary" className="w-100 text-start py-2">
                        {tool}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
};
