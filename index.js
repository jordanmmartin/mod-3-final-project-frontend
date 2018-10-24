document.addEventListener("DOMContentLoaded", () => {
  let webSocket;
  document.querySelector('#testbutton')
    .addEventListener('click', () => joinChannel())

  document.querySelector('#endbutton')
    .addEventListener('click', () => {
      const subscribeMsg = {
        "command": "unsubscribe",
        "identifier": "{\"channel\":\"VideosChannel\",\"id\":\"1\"}"
      }
      console.log('unsubscribed')
      webSocket.send(JSON.stringify(subscribeMsg))
      // webSocket.close()
    })

  function joinChannel() {
    fetch('http://localhost:3000/channels/1')
      .then(r => r.json())
      .then(videoInitOnJoin)

    webSocket = openConnection()
    webSocket.onopen = (event) => {
      const subscribeMsg = {
        "command": "subscribe",
        "identifier": "{\"channel\":\"VideosChannel\",\"id\":\"1\"}"
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
    }
  }

  function onPlayerStateChange(event) {
    console.log(event)
    const message = {
      "command": "message",
      "identifier": "{\"channel\":\"VideosChannel\",\"id\":\"1\"}",
      "data": `{\"action\": \"sync_videos\",
          \"current_video_url\": \"${event.target.j.videoData.video_id}\",
          \"time\": \"${event.target.j.currentTime}\",
          \"playlist_index\": \"${event.target.j.playlistIndex}\",
          \"state\": \"${event.data}\"}`
    }
    webSocket.send(JSON.stringify(message))
  }

  initVideo()
})

function socketListenerInit(webSocket) {
  webSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data["type"] !== "ping") {
      console.log(data)
    }
    if (data.message.action === "sync_videos") {
      videoSyncControl(data.message)
    }
    // if (!!data["message"]["video"]) {
    //   loadVideo(data["message"]["video"])
    // }
  }
}

function videoInitOnJoin(data) {
  let playlistArr = data.videos.map(obj => obj.url)
  console.log(playlistArr)
  window.player.loadPlaylist(playlistArr, parseInt(data.playlist_index), parseInt(data.time))
}

function videoSyncControl(data) {
  if (window.player.getPlaylistIndex() !== parseInt(data.playlist_index)) {
    player.playVideoAt(parseInt(data.playlist_index))
  }
  if (Math.abs(window.player.getCurrentTime() - parseInt(data.time)) > 0.5) {
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

// function getPlaylist() {
//
// }

function loadVideo(videoId) {
  window.player.loadVideoById(videoId)
}

["TeccAtqd5K8", "b1LNQBX8JwE", "UlFMVzo9zuE"]