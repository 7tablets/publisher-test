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
const publisherKitClient = new PublisherKitClient();

function useForm() {
  const [url, setUrl] = React.useState('');
  const [appId, setAppId] = React.useState('');
  const [clientApiKey, setClientApiKey] = React.useState('');
  const [token, setToken] = React.useState('');
  const [expandNewValues, setExpandNewValues] = React.useState(false);
  const [needsReload, setNeedsReload] = React.useState(false);

  React.useEffect(() => {
    // Load values from local storage on initial render
    const savedUrl = localStorage.getItem('url');
    const savedAppId = localStorage.getItem('appId');
    const savedClientApiKey = localStorage.getItem('clientApiKey');
    const savedToken = localStorage.getItem('token');
    const savedExpandNewValues = localStorage.getItem('expandNewValues');

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
    }

    // if (savedExpandNewValues) {
    setExpandNewValues(savedExpandNewValues === 'true');
    // }
  }, []);

  const handleTokenChange = (event) => {
    const newValue = event.target.value;
    setToken(newValue);
    setNeedsReload(true);
    localStorage.setItem('token', newValue);
  };

  const handleExpandNewValuesChange = (event) => {
    const newValue = event.target.checked;
    console.log(newValue, typeof newValue);
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

  return {
    url,
    appId,
    clientApiKey,
    token,
    expandNewValues,
    handleTokenChange,
    handleExpandNewValuesChange,
    handleAppIdChange,
    handleClientApiKeyChange,
    handleUrlChange,
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
    handleTokenChange,
    handleExpandNewValuesChange,
    handleAppIdChange,
    handleClientApiKeyChange,
    handleUrlChange,
  } = useForm();
  const [messageList, setMessageList] = React.useState([]);
  const [canConnect, setCanConnect] = React.useState(false);
  const addMessage = React.useCallback(
    (message) => {
      console.log({ expandNewValues });
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
    // const urlParams = new URLSearchParams(window.location.search);
    // // const env = urlParams.get('env');
    // const token = urlParams.get('token');
    // const clientApiKey = urlParams.get('clientApiKey');
    // const appId = urlParams.get('appId');
    // const url = decodeURIComponent(urlParams.get('url'));
    // const ed = urlParams.get('expand') === 'true';
    // setExpandDefault(ed);
    if (!token || !clientApiKey || !appId || !url) {
      return;
      // alert(
      //   'Please specify all required parameters, token, clientApiKey, appId, url. - expand is optional'
      // );
    }
    // let publisherUrl = 'http://localhost:3001';
    // if (env === 'dev') {
    //   publisherUrl = 'https://publisher-dev.seventablets.com';
    // } else if (env === 'stg') {
    //   publisherUrl = 'https://publisher-stg.seventablets.com';
    // } else if (env === 'prod') {
    //   publisherUrl = 'https://publisher.seventablets.com';
    // }
    // if (!url) {
    //   alert('Invalid url. Please specify and encodeURIComponent "url" in the query parameter ');
    // }
    const success = publisherKitClient.initialize({
      publisherUrl: url,
      clientApiKey: clientApiKey,
      appId: appId,
      appToken: token,
    });
    // if (publisherKitClient.isConnected()) publisherKitClient.disconnect();
    console.log('here', url, success);
    success && setCanConnect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // setMessageList([...messageList, { event: '!', payload: { reason } }]);
        addMessage({ event: 'Disconnected!', payload: { reason }, type: 'disconnect' });
      })
      .onError((errMsg) => {
        addMessage({ event: 'Error!', payload: { message: errMsg }, type: 'error' });
        console.error(errMsg);
      });

    !publisherKitClient.isConnected() && publisherKitClient.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canConnect, addMessage]);
  return (
    <Container className="app">
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
              variant="outlined"
              color="primary"
              label="Reload"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          ) : null}
        </div>
      </Card>

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
