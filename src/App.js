import React from 'react';
import PublisherKitClient from '@7t/publisher-kit-client';
import {
  Card,
  CardContent,
  Container,
  TextField,
  Switch,
  FormControlLabel,
  Button,
} from '@material-ui/core';
import moment from 'moment';
import './App.css';
import { ArrowDownward, ArrowUpward, Refresh } from '@material-ui/icons';
const publisherKitClient = new PublisherKitClient();
function parseJwt(token) {
  try {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}
function useForm() {
  const [url, setUrl] = React.useState('');
  const [appId, setAppId] = React.useState('');
  const [clientApiKey, setClientApiKey] = React.useState('');
  const [token, setToken] = React.useState('');
  const [expandNewValues, setExpandNewValues] = React.useState(false);
  const [needsReload, setNeedsReload] = React.useState(false);
  const [showForm, setShowForm] = React.useState(true);
  const [parsed, setParsed] = React.useState({});

  React.useEffect(() => {
    // Load values from local storage on initial render
    const savedUrl = localStorage.getItem('url');
    const savedAppId = localStorage.getItem('appId');
    const savedClientApiKey = localStorage.getItem('clientApiKey');
    const savedToken = localStorage.getItem('token');
    const savedExpandNewValues = localStorage.getItem('expandNewValues');
    const savedShowForm = localStorage.getItem('showForm');

    if (savedUrl) {
      setUrl(savedUrl);
    }
    if (savedAppId) {
      setAppId(savedAppId);
    }
    if (savedClientApiKey) {
      setClientApiKey(savedClientApiKey);
    }

    if (savedToken) {
      setToken(savedToken);
      setParsed(savedToken ? parseJwt(savedToken) : {});
    }

    // if (savedExpandNewValues) {
    setExpandNewValues(savedExpandNewValues === 'true');
    setShowForm(savedShowForm !== 'false');
    // }
  }, []);

  const handleTokenChange = (event) => {
    const newValue = event.target.value;
    setToken(newValue);
    setParsed(token ? parseJwt(token) : {});

    setNeedsReload(true);
    localStorage.setItem('token', newValue);
  };

  const handleExpandNewValuesChange = (event) => {
    const newValue = event.target.checked;
    setExpandNewValues(!!newValue);
    // setNeedsReload(true);
    localStorage.setItem('expandNewValues', newValue ? 'true' : 'false');
  };

  const handleAppIdChange = (event) => {
    const newValue = event.target.value;
    setAppId(newValue);
    setNeedsReload(true);
    localStorage.setItem('appId', newValue);
  };

  const handleClientApiKeyChange = (event) => {
    const newValue = event.target.value;
    setClientApiKey(newValue);
    setNeedsReload(true);
    localStorage.setItem('clientApiKey', newValue);
  };

  const handleUrlChange = (event) => {
    const newValue = event.target.value;
    setUrl(newValue);
    setNeedsReload(true);
    localStorage.setItem('url', newValue);
  };

  const handleSetShowForm = (bool) => {
    setShowForm(bool);
    localStorage.setItem('showForm', bool ? 'true' : 'false');
  };

  return {
    url,
    appId,
    clientApiKey,
    token,
    expandNewValues,
    showForm,
    parsed,
    handleTokenChange,
    handleExpandNewValuesChange,
    handleAppIdChange,
    handleClientApiKeyChange,
    handleUrlChange,
    handleSetShowForm,
    needsReload,
  };
}

function App() {
  // const [expandDefault, setExpandDefault] = React.useState(false);
  const {
    url,
    appId,
    clientApiKey,
    token,
    expandNewValues,
    needsReload,
    showForm,
    parsed,
    handleTokenChange,
    handleExpandNewValuesChange,
    handleAppIdChange,
    handleClientApiKeyChange,
    handleUrlChange,
    handleSetShowForm,
  } = useForm();
  const [messageList, setMessageList] = React.useState([]);
  const [canConnect, setCanConnect] = React.useState(false);
  const addMessage = React.useCallback(
    (message) => {
      setMessageList((mList) => [
        ...mList,
        {
          ...message,
          time: moment().format('dddd, MMMM Do YYYY, h:mm:ss a'),
          expand: expandNewValues,
        },
      ]);
    },
    [expandNewValues]
  );

  const toggle = (message) => {
    const indx = messageList.findIndex((m) => m === message);
    if (indx !== -1) {
      const copyMessageList = [...messageList];
      const foundMessage = copyMessageList[indx];
      foundMessage.expand = !foundMessage.expand;
      setMessageList(copyMessageList);
    }
  };

  React.useEffect(() => {
    if (!token || !clientApiKey || !appId || !url) {
      console.error(
        'Please specify all required parameters, token, clientApiKey, appId, url. - expand is optional'
      );
      return;
    }

    const success = publisherKitClient.initialize({
      publisherUrl: url,
      clientApiKey: clientApiKey,
      appId: appId,
      appToken: token,
    });

    success && setCanConnect(true);
  }, [token, clientApiKey, appId, url]);

  React.useEffect(() => {
    if (!canConnect) {
      return;
    }

    publisherKitClient
      .onConnect(() => {
        addMessage({ event: 'Connected!', type: 'connect' });
      })
      .onMessage(({ event, payload }) => {
        addMessage({ event, payload, type: 'message' });
      })
      .onDisconnect((reason) => {
        addMessage({ event: 'Disconnected!', payload: { reason }, type: 'disconnect' });
      })
      .onError((errMsg) => {
        addMessage({ event: 'Error!', payload: { message: errMsg }, type: 'error' });
        console.error(errMsg);
      });

    !publisherKitClient.isConnected() && publisherKitClient.connect();
  }, [canConnect, addMessage]);

  return (
    <Container className="app">
      <Button
        variant="contained"
        color="primary"
        startIcon={!showForm ? <ArrowDownward /> : <ArrowUpward />}
        label={showForm ? 'Hide Information' : 'Edit Information'}
        onClick={() => handleSetShowForm(!showForm)}
      >
        {showForm ? 'Hide Information' : 'Edit Information'}
      </Button>

      {showForm ? (
        <Card className="form">
          <div className="formWrap">
            <TextField label="url" value={url} onChange={handleUrlChange} />
            <TextField label="appId" value={appId} onChange={handleAppIdChange} />
            <TextField
              label="clientApiKey"
              value={clientApiKey}
              onChange={handleClientApiKeyChange}
            />
            <TextField label="PubToken" value={token} onChange={handleTokenChange} />

            <FormControlLabel
              control={<Switch checked={expandNewValues} onChange={handleExpandNewValuesChange} />}
              label="Expand New Events"
            />
            {needsReload ? (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Refresh />}
                label="Reload"
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
            ) : null}
          </div>
          <pre>{JSON.stringify(parsed, null, 2)}</pre>
        </Card>
      ) : null}
      {messageList
        .map((message, indx) => {
          return (
            <Card key={indx} className={['messageBox', message.type].join(' ')}>
              {/* <ListItemText primary="Drafts" /> */}
              <CardContent>
                <p className="eventType">{message.event}</p>

                {message.payload && (
                  <div className="toggle" onClick={() => toggle(message)}>
                    {message.expand ? 'hide' : 'show'} payload
                  </div>
                )}
                {message.payload && message.expand && (
                  <div className="payload">
                    {typeof message.payload === 'object'
                      ? JSON.stringify(message.payload, null, 2)
                      : message.payload}
                  </div>
                )}
                <p className="time">{message.time}</p>
              </CardContent>
            </Card>
          );
        })
        .reverse()}
    </Container>
  );
}
export default App;
