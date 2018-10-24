document.addEventListener("DOMContentLoaded", () => {
  let webSocket;
  let channelId;
  let currentUser;
  const container = document.querySelector('#container')

  function identifier(channelId) {
    return `{\"channel\":\"VideosChannel\",\"id\":\"${channelId}\"}`
  }

  function showUserSignIn() {
    const form = document.createElement('form')
    form.innerHTML = '<div class="form-group"><label for="username">Display Name:</label><input type="text" name="username" class="form-control" placeholder="Enter a name..."></div><input type="submit" class="btn btn-success" value="Enter">'
    form.addEventListener('submit', handleSignIn)
    container.append(form)
  }

  function handleSignIn(e) {
    e.preventDefault()
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: e.target.username.value
      })
    }
    fetch('http://localhost:3000/users', options)
      .then(r => r.json())
      .then(user => {
        currentUser = { ...user }
        console.log(currentUser.id)
      })
      .then(getChannelList)
      .then(() => webSocket = openConnection())
  }

  function makeForm() {
    const div = document.querySelector('#add-video-container')
    const form = document.createElement('form')
    form.id = 'add-video-form'
    form.className = 'form-inline'
    form.innerHTML = `
    <input type="text" name="textform" placeholder="YouTube Video ID..." class="form-control">
    <input type="submit" value"Add Video" class="btn btn-success">
    `;
    form.addEventListener('submit', addVideoHandler)
    div.append(form)
  }

  function getChannelList() {
    container.innerHTML = ''
    document.querySelector('#page-name')
      .innerHTML = "<h2>Channels</h2>"
    container.append(displayNewChannelForm())
    const ul = document.createElement('ul')
    ul.className = 'channel-list'
    fetch('http://localhost:3000/channels')
      .then(r => r.json())
      .then(channels => channels.forEach(channel => ul.append(displayChannel(channel))))
    container.append(ul)
  }

  function displayChannel(channel) {
    const li = document.createElement('li')
    li.innerText = channel.name
    li.dataset.id = channel.id
    li.addEventListener('click', e => showChannelPage(e.target.dataset.id))
    return li
  }

  function displayNewChannelForm() {
    const showForm = document.createElement('div')
    showForm.innerText = 'New Channel +'
    const form = document.createElement('form')
    form.className = 'form-inline'
    form.innerHTML = '<input type="text" name="channelname" placeholder="Channel name..." class="form-control"><input type="submit" value="Create Channel" class="btn btn-success">'
    form.addEventListener('submit', handleNewChannel)
    form.hidden = true
    showForm.append(form)
    showForm.addEventListener('click', () => form.hidden === true ? form.hidden = false : form.hidden = true)
    return showForm
  }

  function handleNewChannel(e) {
    e.preventDefault()
    //post
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: e.target.channelname.value,
        time: 0,
        state: 0,
        playlist_index: 0
      })
    }
    fetch('http://localhost:3000/channels', options)
      .then(r => r.json())
      .then(channel => showChannelPage(channel.id))
  }

  function addVideoHandler(e) {
    e.preventDefault()
    console.dir(e.target)
    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: e.target.textform.value,
        user_id: currentUser.id,
        channel_id: channelId
      })
    }
    fetch('http://localhost:3000/videos', options)
      .then(r => r.json())
      .then(json => {
        sendAddedPlaylist()
      })

    e.target.textform.value = ''
  }

  function showChannelPage(id) {
    container.innerHTML = ''
    document.querySelector('iframe')
      .hidden = false
    channelId = parseInt(id)
    joinChannel()
  }

  // function updateChannelSync() {
  //   const options = {
  //     method: "PATCH",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({
  //       time: window.player.getCurrentTime()
  //     })
  //   }
  //   return fetch(`http://localhost:3000/channels/${channelId}`, options)
  // }

  function sendAddedPlaylist() {
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"action\": \"add_video\",\"time\": \"${window.player.getCurrentTime()}\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  function showBackButton() {
    const button = document.createElement('button')
    button.id = 'back-button'
    button.innerText = 'Leave Channel'
    button.className = "btn btn-outline-danger btn-sm"
    button.addEventListener('click', () => {
      const unsubscribeMsg = {
        "command": "unsubscribe",
        "identifier": identifier(channelId)
      }
      console.log('unsubscribed')
      webSocket.send(JSON.stringify(unsubscribeMsg))
      clearChannelPage()
      channelId = null
      window.player.stopVideo()
      document.querySelector('iframe')
        .hidden = true

      getChannelList()
    })
    return button
  }

  function joinChannel() {
    makeForm()
    fetch(`http://localhost:3000/channels/${channelId}`)
      .then(r => r.json())
      .then(json => {
        showMessageHistory(json.messages)
        videoInitOnJoin(json)
        const pageName = document.querySelector('#page-name')
        pageName.innerHTML = ''
        const h2 = document.createElement('h2')
        h2.innerText = json.name
        h2.append(showBackButton())
        pageName.append(h2)
      })

    const subscribeMsg = {
      "command": "subscribe",
      "identifier": identifier(channelId)
    }
    webSocket.send(JSON.stringify(subscribeMsg))
    socketListenerInit(webSocket)
  }

  function openConnection() {
    console.log('creating connection')
    return new WebSocket("ws://localhost:3000/cable")
  }

  function initVideo() {
    const youtubeScriptId = 'youtube-api';
    const youtubeScript = document.getElementById(youtubeScriptId);
    const video = document.querySelector('#player')

    if (youtubeScript === null) {
      const tag = document.createElement('script');
      const firstScript = document.getElementsByTagName('script')[0];

      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = youtubeScriptId;
      firstScript.parentNode.insertBefore(tag, firstScript);
    }

    window.onYouTubeIframeAPIReady = function() {
      window.player = new window.YT.Player(video, {
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0
        },
        width: '100%',
        height: '100%',
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
      document.querySelector('iframe')
        .hidden = true
    }
  }

  function onPlayerStateChange(event) {
    // console.log(event)
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"action\": \"sync_videos\",
          \"time\": \"${event.target.j.currentTime}\",
          \"playlist_index\": \"${event.target.j.playlistIndex}\",
          \"state\": \"${event.data}\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  function socketListenerInit(webSocket) {
    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data["type"] !== "ping") {
        console.log(data)
      }
      if (data.message.action === "sync_videos") {
        videoSyncControl(data.message)
      }
      if (data.message.action === "add_video") {
        fetch(`http://localhost:3000/channels/${channelId}`)
          .then(r => r.json())
          .then(e => videoInitOnJoin(e, parseInt(data.message.time)))
      }
      if (data.message.action === "send_message") {
        const ul = document.querySelector('#chat')
        const li = document.createElement('li')
        li.className = 'list-group-item'
        li.innerHTML = `${data.message.username}: ${data.message.content}`
        ul.append(li)
        ul.scrollTop = ul.scrollHeight
      }
    }
  }

  // Message stuff

  function showMessageHistory(messages) {
    const div = document.querySelector('#chat-container')
    const ul = document.createElement('ul')
    ul.id = 'chat'
    ul.className = 'list-group'
    messages.forEach(message => {
      const li = document.createElement('li')
      li.className = 'list-group-item'
      li.innerHTML = `${message.username}: ${message.content}`
      ul.append(li)
    })
    div.append(ul, showMessageForm())
    ul.scrollTop = ul.scrollHeight
  }

  function showMessageForm() {
    const form = document.createElement('form')
    form.id = 'message-form'
    form.className = 'form-inline'
    form.innerHTML = '<input type="text" name="message" class="form-control" placeholder="Send a message..." autocomplete="off"><input type="submit" value="Send" class="btn btn-success">'
    form.addEventListener('submit', handleMessageSubmit)
    return form
  }

  function handleMessageSubmit(e) {
    e.preventDefault()

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: e.target.message.value,
        channel_id: channelId,
        user_id: currentUser.id
      })
    }
    fetch('http://localhost:3000/messages', options)
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"action\": \"send_message\",
          \"content\": \"${e.target.message.value}\",
          \"username\": \"${currentUser.username}\"}`
    }
    webSocket.send(JSON.stringify(message))


    e.target.message.value = ''
  }

  function clearChannelPage() {
    document.querySelector('#chat-container')
      .innerHTML = ''
    document.querySelector('#add-video-container')
      .innerHTML = ''
  }



  // getChannelList()
  showUserSignIn()
  initVideo()
})


function videoInitOnJoin(data, time) {
  let playlistArr = data.videos.map(obj => obj.url)
  window.player.loadPlaylist(playlistArr, parseInt(data.playlist_index), time ? time : parseInt(data.time))
}

function videoSyncControl(data) {
  if (window.player.getPlaylistIndex() !== parseInt(data.playlist_index)) {
    player.playVideoAt(parseInt(data.playlist_index))
  }
  if (Math.abs(window.player.getCurrentTime() - parseInt(data.time)) > 1) {
    window.player.seekTo(parseInt(data.time))
  }
  switch (data.state) {
    case "1":
      window.player.playVideo()
      break;
    case "2":
      window.player.pauseVideo()
      break;
  }
}

function loadVideo(videoId) {
  window.player.loadVideoById(videoId)
}