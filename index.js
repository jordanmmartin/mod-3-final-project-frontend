document.addEventListener("DOMContentLoaded", () => {
  let webSocket;
  let channelId;
  let currentUser;
  const container = document.querySelector('#container')
  let hostPingInterval;
  let hostMode = false;
  let toggleEvent = false
  const ipAddress = 'localhost'
  const baseUrl = `http://${ipAddress}:3000`

  function identifier(channelId) {
    return `{\"channel\":\"VideosChannel\",\"id\":\"${channelId}\",\"userid\":\"${currentUser.id}\"}`
  }

  function showUserSignIn() {
    const about = showAbout()
    container.append(about)
  }

  function showAbout() {
    const div = document.createElement('div')
    div.className = "jumbotron"
    div.innerHTML = `
  <h2 class="display-4">What the hell is this?</h2>
  <p class="lead">tübular is a web app, made for friends to watch videos together in real-time.</p>
  <p>Create collaborative playlists, chat together, and enjoy your favorite YouTube videos in our immersive media viewing experience.</p>
`
    // const div2 = document.createElement('div')
    // div2.className = 'card'
    const form = document.createElement('form')
    // form.className = 'card-footer'
    form.innerHTML = `
            <label for="username-input" id="join-label">Join now!</label>
    <div class="input-group">
        <input type="text" name="username" id="username-input" class="form-control form-control-lg" placeholder="Enter a name..." autocomplete="off">
      <div class = "input-group-append">
        <button type="submit" class="btn btn-primary"><i class="fas fa-sign-in-alt"></i> Login</button>
      </div>
    </div>`
    form.addEventListener('submit', handleSignIn)
    div.append(form)
    return div
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
    fetch(`${baseUrl}/users`, options)
      .then(r => r.json())
      .then(user => {
        currentUser = { ...user }
        document.querySelector('#current_user')
          .innerText = `Logged in as ${currentUser.username}`
      })
      .then(getChannelList)
      .then(() => webSocket = openConnection())
  }

  function displayAddForm() {
    const div = document.querySelector('#add-video-container')
    const form = document.createElement('form')
    form.id = 'add-video-form'
    // form.className = 'form-inline'
    form.innerHTML = `<div class = "input-group"><input type = "text"name = "textform"class = "form-control"placeholder = "YouTube Video ID..." autocomplete = "off"><div class = "input-group-append"><input type="submit"value = "Add Video To Playlist"class = "btn btn-primary"></div></div>`
    form.addEventListener('submit', addVideoHandler)
    div.append(form)
  }

  function toggleChannels() {
    let channels = document.querySelectorAll('#channel-list li')
    channels.forEach(channel => {
      if (channel.dataset.active === "false" && channel.hidden === false) {
        channel.hidden = true
      } else {
        channel.hidden = false
      }
    })
  }

  function showToggleActiveButton() {
    const div = document.createElement('div')
    div.className = 'col-sm-3'
    div.id = 'toggle-container'
    const button = document.createElement('button')
    button.innerHTML = '<i class="far fa-clock"></i> Toggle Active'
    button.id = 'toggle-active'
    button.className = 'btn btn-primary'
    button.addEventListener('click', toggleChannels)
    div.append(button)
    return div
  }

  function showSearchForm() {
    const div = document.createElement('div')
    div.id = 'search-container'
    div.className = 'col-sm-9'
    const span = document.createElement('span')
    span.className = "fa fa-search"
    const search = document.createElement('input')
    search.className = 'form-control'
    search.id = 'search-form'
    search.placeholder = 'Search by channel name...'
    search.addEventListener('input', handleSearch)
    div.append(span, search)
    return div
  }

  function handleSearch(e) {
    let channels = document.querySelectorAll('#channel-list li')
    channels.forEach(channel => {
      if (channel.innerText.toLowerCase()
        .search(e.target.value.toLowerCase()) === -1) {
        channel.hidden = true
      } else {
        channel.hidden = false
      }
    })
  }

  function getChannelList() {
    container.innerHTML = ''
    const row = document.createElement('div')
    row.className = 'row'
    row.id = 'search-row'
    row.append(showSearchForm(), showToggleActiveButton())
    const card = document.createElement('div')
    card.className = 'card'
    document.querySelector('#page-name')
      .innerHTML = "<h2>Channels</h2>"
    card.append(displayNewChannelForm())
    const ul = document.createElement('ul')
    ul.id = 'channel-list'
    ul.className = 'list-group list-group-flush'
    fetch(`${baseUrl}/channels`)
      .then(r => r.json())
      .then(channels => channels.forEach(channel => ul.append(displayChannel(channel))))
    card.append(ul)
    container.append(row, card)
  }

  function displayChannel(channel) {
    const li = document.createElement('li')
    li.innerHTML = `${channel.name} <span>${channel.view_count} Viewer${parseInt(channel.view_count) > 1 || parseInt(channel.view_count) === 0 ? 's' : ''}</span>`
    li.className = 'list-group-item'
    li.dataset.id = channel.id
    li.dataset.active = channel.active
    li.addEventListener('click', e => showChannelPage(e.target.dataset.id))
    return li
  }

  function displayNewChannelForm() {
    const wrapper = document.createElement('div')
    wrapper.className = 'card-header'
    const showForm = document.createElement('div')
    showForm.id = 'show-form'
    showForm.innerHTML = '<i class="fas fa-plus"></i>'
    const form = document.createElement('form')
    form.id = 'new-channel-form'
    // form.className = 'form-inline'
    form.innerHTML = `<div class="input-group"><input type = "text" name="channelname" class="form-control" placeholder="Channel name..." autocomplete="off"><div class="input-group-append"><input type="submit" value="Create Channel" class="btn btn-primary"></div></div>`
    form.addEventListener('submit', handleNewChannel)
    form.hidden = true
    showForm.addEventListener('click', () => form.hidden === true ? form.hidden = false : form.hidden = true)
    wrapper.append(showForm, form)
    return wrapper
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
    fetch(`${baseUrl}/channels`, options)
      .then(r => r.json())
      .then(channel => showChannelPage(channel.id))
  }

  function addVideoHandler(e) {
    e.preventDefault()
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
    fetch(`${baseUrl}/videos`, options)
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

  function showViewCount(channel) {
    let view_count = parseInt(channel.view_count) + 1
    const div = document.querySelector('#chat-container')
    const viewCount = document.createElement('div')
    viewCount.id = 'view_count'
    viewCount.className = 'card-header text-center'
    viewCount.innerText = `${view_count} Viewer${(view_count > 1 || view_count === 0) ? 's' : ''}`
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"view_count\": \"${view_count}\"}`
    }
    webSocket.send(JSON.stringify(message))
    div.append(viewCount)
  }

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
    // button.innerText = 'Leave Channel'
    button.innerHTML = `<i class="fas fa-angle-left"></i>`
    button.className = "btn btn-outline-primary border-0"
    button.addEventListener('click', () => {
      toggleEvent = false
      if (hostMode) {
        hostMode = false
        clearInterval(hostPingInterval)
        hidePartyMode()
      }
      const unsubscribeMsg = {
        "command": "unsubscribe",
        "identifier": identifier(channelId)
      }
      console.log('unsubscribed')
      webSocket.send(JSON.stringify(unsubscribeMsg))
      window.player.stopVideo()
      toggleChannelPage(true)
      if (!!document.querySelector('canvas')) {
        endConfetti()
      }
      channelId = null
      document.querySelector('iframe')
        .hidden = true

      getChannelList()
    })
    return button
  }

  function joinChannel() {
    toggleChannelPage(false)
    displayAddForm()
    fetch(`${baseUrl}/channels/${channelId}`)
      .then(r => r.json())
      .then(json => {
        const pageName = document.querySelector('#page-name')
        pageName.innerHTML = ''
        const h2 = document.createElement('h2')
        h2.append(showBackButton(), json.name)
        pageName.append(h2, toggleHostingBadge())
        showViewCount(json)
        showMessageHistory(json.messages)
        videoInitOnJoin(json)
      })

    const subscribeMsg = {
      "command": "subscribe",
      "identifier": identifier(channelId)
    }
    webSocket.send(JSON.stringify(subscribeMsg))
    socketListenerInit(webSocket)
  }

  function toggleHostingBadge() {
    if (hostMode) {
      const head = document.querySelector('#page-name')
      const span = document.createElement('span')
      span.className = "badge badge-pill badge-primary"
      span.innerHTML = '<i class="fas fa-crown"></i> Hosting'
      // span.hidden = true
      return span
    } else {
      return ''
    }
  }

  function openConnection() {
    console.log('creating connection')
    return new WebSocket(`ws://${ipAddress}:3000/cable`)
  }

  function initVideo() {
    const youtubeScriptId = 'youtube-api';
    const youtubeScript = document.getElementById(youtubeScriptId);
    const video = document.querySelector('#player')

    if (youtubeScript === null) {
      const tag = document.createElement('script');
      const firstScript = document.getElementsByTagName('script')[0];

      tag.src = 'http://www.youtube.com/iframe_api';
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
        origin: `${baseUrl}`,
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
      document.querySelector('iframe')
        .hidden = true
    }
  }

  function onPlayerStateChange(event) {
    if (toggleEvent) {
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
  }

  function socketListenerInit(webSocket) {
    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.message === "YOU'RE THE HOST") {
        toggleHostMode()
      }
      if (data.message === "The host has left.") {
        findNewHost()
      }
      try {
        if (!!data.message["view_count"]) {
          // console.log(data.message["view_count"])
          let viewCount = document.querySelector('#view_count')
          let view_count = parseInt(data.message["view_count"])
          viewCount.innerText = `${view_count} Viewer${(view_count > 1 || view_count === 0) ? 's' : ''}`
        }
        if (data.message["party_mode"] === "true") {
          toggleEvent = true
          startConfetti()
        }
        if (data.message["party_mode"] === "false") {
          endConfetti()
          if (!hostMode) {
            toggleEvent = false
          }
        }
        if (data.message.action === "sync_videos") {
          videoSyncControl(data.message)
          if (hostMode) {
            clearInterval(hostPingInterval)
            hostPingInterval = setInterval(hostPing, 5000)
          }
        }
        if (data.message.action === "add_video") {
          fetch(`${baseUrl}/channels/${channelId}`)
            .then(r => r.json())
            .then(e => videoInitOnJoin(e, parseInt(data.message.time)))
          if (hostMode) {
            clearInterval(hostPingInterval)
            hostPingInterval = setInterval(hostPing, 5000)
          }
        }
        if (data.message.action === "send_message") {
          const ul = document.querySelector('#chat')
          const li = document.createElement('li')
          li.className = 'list-group-item'
          li.innerHTML = `<span class="chat-timestamps text-muted">${data.message.time} </span><span class="message-username">${data.message.username}</span>: ${data.message.content}`
          ul.append(li)
          ul.scrollTop = ul.scrollHeight
        }
      } catch (error) {
        ':^)'
      }
    }
  }

  function findNewHost() {
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"action\": \"delegate_host\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  function hostPing() {
    console.log('pinging as host')
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"action\": \"sync_videos\",
          \"time\": \"${window.player.j.currentTime}\",
          \"playlist_index\": \"${window.player.j.playlistIndex}\",
          \"state\": \"${window.player.j.playerState}\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  function toggleHostMode() {
    hostPingInterval = setInterval(hostPing, 5000)
    hostMode = true
    toggleEvent = true
    const row = document.querySelectorAll('.row')[1]
    row.append(showPartyModeButton())
  }

  // Message stuff

  function showMessageHistory(messages) {
    const div = document.querySelector('#chat-container')
    const ul = document.createElement('ul')
    ul.id = 'chat'
    ul.className = 'list-group list-group-flush'
    messages.forEach(message => {
      const li = document.createElement('li')
      li.className = 'list-group-item'
      li.innerHTML = `<span class="chat-timestamps text-muted">${message.time} </span><span class="message-username">${message.username}</span>: ${message.content}`
      ul.append(li)
    })
    div.append(ul, showMessageForm())
    ul.scrollTop = ul.scrollHeight
  }

  function showMessageForm() {
    const form = document.createElement('form')
    form.id = 'message-form'
    form.className = 'card-footer pb-1 pt-1'
    form.innerHTML = `
    <div class="input-group">
    <input type="text" name="message" class="form-control" placeholder="Send a message..." autocomplete="off">
      <div class="input-group-append">
    <input type="submit" value="Send" class="btn btn-primary">
    </div>
    </div>
    `
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
    fetch(`${baseUrl}/messages`, options)
    let d = new Date();
    let n = d.toLocaleTimeString();
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"action\": \"send_message\",
                \"time\": \"${n.slice(0,5)+n.slice(9,11)}\",
          \"content\": \"${e.target.message.value}\",
          \"username\": \"${currentUser.username}\"}`
    }
    webSocket.send(JSON.stringify(message))


    e.target.message.value = ''
  }

  function toggleChannelPage(bool) {
    const channel = document.querySelector('#channel-container')
    channel.hidden = bool
    const chat = document.querySelector('#chat-container')
    chat.innerHTML = ''
    const add = document.querySelector('#add-video-container')
    add.innerHTML = ''
  }

  function videoInitOnJoin(data, time) {
    let playlistArr = data.videos.map(obj => obj.url)
    window.player.loadPlaylist(playlistArr, parseInt(data.playlist_index), time ? time : parseInt(data.time))
  }

  function showPartyModeButton() {
    const div = document.createElement('div')
    div.className = "col-md-4 text-center"
    div.id = 'party-container'
    const button = document.createElement('button')
    button.id = 'party-mode'
    button.className = 'btn btn-danger'
    button.innerHTML = '<i class="fas fa-users"></i> Switch to Party Mode'
    button.addEventListener('click', () => {
      if (button.classList.toggle("party-hard")) {
        button.innerHTML = '<i class="fas fa-user"></i> Switch to Host Mode'
        startTheParty()
      } else {
        button.innerHTML = '<i class="fas fa-users"></i> Switch to Party Mode'
        endTheParty()
      }
    })
    div.append(button)
    return div
  }

  function hidePartyMode() {
    document.querySelector('#party-container')
      .remove()
  }

  function startTheParty() {
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"party_mode\": \"true\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  function endTheParty() {
    const message = {
      "command": "message",
      "identifier": identifier(channelId),
      "data": `{\"party_mode\": \"false\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  function startConfetti() {
    document.querySelector('#logo')
      .innerText = 'tübular🎉'
    const canvas = document.createElement('canvas')
    canvas.id = 'confetti'
    document.body.append(canvas)
    const confettiSettings = { target: 'confetti', max: 200, props: ['square', 'triangle', 'line'], rotate: true };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render()
  }

  function endConfetti() {
    document.querySelector('#logo')
      .innerText = 'tübular'
    document.querySelector('canvas')
      .remove()
  }

  // getChannelList()
  toggleChannelPage(true)
  showUserSignIn()
  initVideo()
})



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