import React, { useState, FormEvent } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="p-3 border-top bg-light">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Posez votre question sur le code..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          autoFocus
        />
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || !input.trim()}
        >
          Envoyer
        </Button>
      </InputGroup>
    </Form>
  );
};
