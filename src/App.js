import React from 'react';
import PublisherKitClient from '@7t/publisher-kit-client';
import { Card, CardContent, Container } from '@material-ui/core';
import InboxIcon from '@material-ui/icons/Inbox';
import moment from 'moment';
import './App.css';
function App() {
  let expandDefault = false;
  const [messageList, setMessageList] = React.useState([]);
  const addMessage = React.useCallback((message) => {
    setMessageList((mList) => [
      ...mList,
      { ...message, time: moment().format('dddd, MMMM Do YYYY, h:mm:ss a'), expand: expandDefault },
    ]);
  });

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
    const env = urlParams.get('env');
    const token = urlParams.get('token');
    const clientApiKey = urlParams.get('clientApiKey');
    const appId = urlParams.get('appId');
    expandDefault = urlParams.get('expand') === 'true';
    let publisherUrl = 'http://localhost:3001';
    if (env === 'dev') {
      publisherUrl = 'https://publisher-dev.seventablets.com';
    } else if (env === 'stg') {
      publisherUrl = 'https://publisher-stg.seventablets.com';
    } else if (env === 'prod') {
      publisherUrl = 'https://publisher.seventablets.com';
    }

    PublisherKitClient.initialize({
      publisherUrl,
      clientApiKey: clientApiKey,
      appId: appId,
      appToken: token,
    });
    PublisherKitClient.onConnect(() => {
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
