import { useState } from 'react';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { useStreamClient } from '../hooks/useStreamClient';
import useAuthStore from '../contexts/authStore'; // or wherever you keep user
import useUserStore from '../contexts/userStore';

export default function ChatApp() {
  const { user } = useUserStore(); 
  console.log(user);        // { id, name }
  const client = useStreamClient(user._id, user.username);
  const [activeChannel, setActiveChannel] = useState(null);

  if (!client) return <div>Loading chat…</div>;

  const filters = { type: 'messaging', members: { $in: [String(user._id)] } };
  const sort    = { last_message_at: -1 };
  const options = { limit: 10 };

  return (
    <Chat client={client} theme="str-chat__theme-light">
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={setActiveChannel}
      />
      <Channel channel={activeChannel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
}
