import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { encode } from 'gpt-tokenizer';

const URL = 'http://localhost:3001/';
const initialConversation = {
  messages: [
    { role: 'user', content: '' },
    { role: 'assistant', content: '' }
  ]
};

function App() {
  const [prompts, setPrompts] = useState([]);
  const [initialPrompts, setInitialPrompts] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);

  const updateTotalTokens = () => {
    let total = 0;
    for (const prompt of prompts) {
      for (const message of prompt.messages) {
        const tokenCount = encode(message.content).length;
        total += tokenCount;
      }
    }
    setTotalTokens(total);
  };  

  const handleChange = (callback) => {
    setHasUnsavedChanges(true);
    callback();
  };

  const addConversation = () => {
    const newConversation = {
      messages: [
        { role: 'user', content: '' },
        { role: 'assistant', content: '' }
      ]
    };
    setPrompts([...prompts, newConversation]);
    setHasUnsavedChanges(true);
  };

  const removeConversation = (indexToRemove) => {
    const newPrompts = prompts.filter((_, index) => index !== indexToRemove);
    setPrompts(newPrompts);
    setHasUnsavedChanges(true);
  };

  const addLine = (convIndex) => {
    const newPrompts = [...prompts];
    newPrompts[convIndex].messages.push({ role: '', content: '' });
    setPrompts(newPrompts);
    setHasUnsavedChanges(true);
  };

  const removeLine = (convIndex, lineIndex) => {
    const newPrompts = [...prompts];
    newPrompts[convIndex].messages.splice(lineIndex, 1);
    setPrompts(newPrompts);
    setHasUnsavedChanges(true);
  };

  const cancelChanges = () => {
    setPrompts(JSON.parse(JSON.stringify(initialPrompts)));
    setHasUnsavedChanges(false);
  };

  // Fetch prompts when the component mounts
  useEffect(() => {
    const saveContent = (e) => {
      if (e.keyCode === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener("keydown", saveContent);
  
    axios.get(URL)
      .then(response => {
        console.log('Prompts received:', response.data);
        setPrompts(response.data);
        setInitialPrompts(JSON.parse(JSON.stringify(response.data)));
        updateTotalTokens();
      })
      .catch(error => {
        console.log('Error fetching prompts:', error);
      });
  
    return () => {
      window.removeEventListener("keydown", saveContent);
    };
  }, []);

  useEffect(() => {
    updateTotalTokens();
  }, [prompts]);
  

  const handleSave = () => {
    axios.post('http://localhost:3001/generate-jsonl', { prompts })
      .then(response => {
        alert('File saved successfully');
        setInitialPrompts(JSON.parse(JSON.stringify(prompts)));
      })
      .catch(error => {
        alert('An error occurred while saving the file');
      });
      setHasUnsavedChanges(false);
  };

  return (
    <div className="page-content">
      <nav className="navbar bg-dark fixed-top" data-bs-theme="dark">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Fine-tuning Prompts</span>
          <span className="navbar-text">Total Conversations: {prompts.length} | Total Tokens: {totalTokens}</span>
          <div className="d-flex">
            <button onClick={cancelChanges} className="btn btn-secondary me-2">Dismiss changes</button>
            <button onClick={handleSave} className="btn btn-success" disabled={!hasUnsavedChanges}>Save changes</button>
          </div>
        </div>
      </nav>
      <div className="container">
        {prompts.length === 0 ? (
          <h4>This looks like an empty file. Care to add some content to it?</h4>
        ) : prompts.map((prompt, index) => (
          <div className="card mb-4" key={index}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mt-2">Conversation {index + 1}</h4>
              <span className="badge bg-secondary">{prompt.messages.length} message lines</span>
            </div>
            <ul className="list-group list-group-flush">
              {prompt.messages.map((message, messageIndex) => (
                <li className="list-group-item" key={`message-${index}-${messageIndex}`}>
                  <div className="row mb-2" key={messageIndex}>
                    <div className="col col-2">
                      <label htmlFor={`role-${index}-${messageIndex}`}>Role:</label>
                      <div className="input-group">
                        <span className="input-group-text">@</span>
                        <select 
                          value={message.role}
                          onChange={(e) => handleChange(() => {
                            const newPrompts = [...prompts];
                            newPrompts[index].messages[messageIndex].role = e.target.value;
                            setPrompts(newPrompts);
                          })}
                          id={`role-${index}-${messageIndex}`}
                          className="form-select"
                        >
                          <option value="system">System</option>
                          <option value="user">User</option>
                          <option value="assistant">Assistant</option>
                        </select>
                      </div>
                    </div>
                    <div className="col col-9">
                      <label htmlFor={`content-${index}-${messageIndex}`}>Content:</label>
                      <textarea
                        value={message.content}
                        onChange={(e) => handleChange(() => {
                          const newPrompts = [...prompts];
                          newPrompts[index].messages[messageIndex].content = e.target.value;
                          setPrompts(newPrompts);
                        }, e.target.value)}
                        id={`content-${index}-${messageIndex}`}
                        className="form-control"
                      ></textarea>
                    </div>
                    <div className="col col-1">
                      <button onClick={() => removeLine(index, messageIndex)} className="btn btn-light">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
              <li className="list-group-item">
                <button onClick={() => addLine(index)} className="btn btn-primary">Add Line</button>
              </li>
              <div className="card-body">
                <button onClick={() => removeConversation(index)} className="btn btn-danger">Remove Conversation</button>
              </div>
            </ul>
          </div>
        ))}
        <div className="card">
          <div className="card-body">
            <button onClick={addConversation} className="btn btn-secondary">Add Conversation</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;