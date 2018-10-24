document.addEventListener("DOMContentLoaded", () => {
  let webSocket;
  let channelId;
  let userId = 1
  const container = document.querySelector('#container')

  function identifier(channelId) {
    return `{\"channel\":\"VideosChannel\",\"id\":\"${channelId}\"}`
  }

  function makeForm() {
    const form = document.createElement('form')
    form.id = 'add-video-form'
    form.innerHTML = `
    <input type="text" name="textform" placeholder="YouTube Video ID...">
    <input type="submit" value"Add Video">
    `;
    form.addEventListener('submit', addVideoHandler)
    container.append(form)
  }

  function getChannelList() {
    container.innerHTML = ''
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
    li.addEventListener('click', showChannelPage)
    return li
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
        user_id: userId,
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

  function showChannelPage(e) {
    container.innerHTML = ''
    showBackButton()
    document.querySelector('iframe')
      .hidden = false
    channelId = parseInt(e.target.dataset.id)
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
    button.innerText = 'Back'
    button.addEventListener('click', () => {
      const unsubscribeMsg = {
        "command": "unsubscribe",
        "identifier": identifier(channelId)
      }
      console.log('unsubscribed')
      webSocket.send(JSON.stringify(unsubscribeMsg))

      window.player.stopVideo()
      document.querySelector('iframe')
        .hidden = true

      getChannelList()
    })
    container.append(button)
  }


  function joinChannel() {
    makeForm()
    fetch(`http://localhost:3000/channels/${channelId}`)
      .then(r => r.json())
      .then(videoInitOnJoin)

    webSocket = openConnection()
    webSocket.onopen = (event) => {
      const subscribeMsg = {
        "command": "subscribe",
        "identifier": identifier(channelId)
      }
      webSocket.send(JSON.stringify(subscribeMsg))
    }
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
          \"current_video_url\": \"${event.target.j.videoData.video_id}\",
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
    }
  }

  getChannelList()
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