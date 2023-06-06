import React from 'react';
import PublisherKitClient from '@7t/publisher-kit-client';
import { Card, CardContent, Container } from '@material-ui/core';
import moment from 'moment';
import './App.css';
const publisherKitClient = new PublisherKitClient();
function App() {
  const [expandDefault, setExpandDefault] = React.useState(false);
  const [messageList, setMessageList] = React.useState([]);
  const addMessage = React.useCallback(
    (message) => {
      setMessageList((mList) => [
        ...mList,
        {
          ...message,
          time: moment().format('dddd, MMMM Do YYYY, h:mm:ss a'),
          expand: expandDefault,
        },
      ]);
    },
    [expandDefault]
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
    const urlParams = new URLSearchParams(window.location.search);
    // const env = urlParams.get('env');
    const token = urlParams.get('token');
    const clientApiKey = urlParams.get('clientApiKey');
    const appId = urlParams.get('appId');
    const url = decodeURIComponent(urlParams.get('url'));
    const ed = urlParams.get('expand') === 'true';
    setExpandDefault(ed);
    if (!token || !clientApiKey || !appId || !url) {
      alert(
        'Please specify all required parameters, token, clientApiKey, appId, url. - expand is optional'
      );
    }
    // let publisherUrl = 'http://localhost:3001';
    // if (env === 'dev') {
    //   publisherUrl = 'https://publisher-dev.seventablets.com';
    // } else if (env === 'stg') {
    //   publisherUrl = 'https://publisher-stg.seventablets.com';
    // } else if (env === 'prod') {
    //   publisherUrl = 'https://publisher.seventablets.com';
    // }
    if (!url) {
      alert('Invalid url. Please specify and encodeURIComponent "url" in the query parameter ');
    }
    publisherKitClient.initialize({
      publisherUrl: url,
      clientApiKey: clientApiKey,
      appId: appId,
      appToken: token,
    });
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
      })
      .connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Container className="app">
      {messageList
        .map((message) => {
          return (
            <Card className={['messageBox', message.type].join(' ')}>
              {/* <ListItemText primary="Drafts" /> */}
              <CardContent>
                <p class="eventType">{message.event}</p>

                {message.payload && (
                  <div class="toggle" onClick={() => toggle(message)}>
                    {message.expand ? 'hide' : 'show'} payload
                  </div>
                )}
                {message.payload && message.expand && (
                  <div class="payload">
                    {typeof message.payload === 'object'
                      ? JSON.stringify(message.payload, null, 2)
                      : message.payload}
                  </div>
                )}
                <p class="time">{message.time}</p>
              </CardContent>
            </Card>
          );
        })
        .reverse()}
    </Container>
  );
}
export default App;
