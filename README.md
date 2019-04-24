# tübular
> Single page web app for watching YouTube videos in sync and real-time chatting with other users.

This is web app for watching YouTube video in sync and real-time chatting with multiple users built with a JavaScript frontend and Rails as an API backend. It utilizes an ActionCable websocket for sending messages to other user, and for keeping YouTube videos in sync with other users via YouTube's iFrame API.

This is the frontend, the backend can be found [here](https://github.com/jordanmmartin/mod-3-final-project-backend).

## Development Setup

### Frontend

OS X & Linux:

```sh
node server.js
```

### Backend

OS X & Linux:

```sh
bundle install
rails db:create
rails db:migrate
rails s
```

## Usage example

There is no user auth, just enter a username and you're good to go. You can find rooms or create a room, and chat with other users. "Host" is given to whoever is the user in the room that's been there the longest, which gives them the ability to pause/scrub/skip, etc the current YouTube video, which is reflected on other users clients. Anyone can add a video by pasting the YouTube video id, and it'll be added to the end of the playlist. The Host moves to the next oldest user if the current host leaves. A host can give host powers to everyone currently in the chat room by enabling "Party Mode", if you want pure chaos for some reason.



## Contributing

1. Fork it (<https://github.com/jordanmmartin/mod-3-final-project-frontend/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request
