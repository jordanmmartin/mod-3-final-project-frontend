document.addEventListener("DOMContentLoaded", () => {
  // const webSocket = openConnection()
  webSocket.onopen = (event) => {
    console.log('what')
    const subscribeMsg = {
      "command": "subscribe",
      "identifier": "{\"channel\":\"VideosChannel\"}"
    }
    console.log(subscribeMsg)
    webSocket.send(JSON.stringify(subscribeMsg))
  }

  webSocket.onmessage = (event) => {
    console.log(JSON.parse(event.data))
  }

  function openConnection() {
    console.log('creating connection')
    return new WebSocket("ws://localhost:3000/cable")
  }


  function createVideo() {
    var youtubeScriptId = 'youtube-api';
    var youtubeScript = document.getElementById(youtubeScriptId);
    let video = document.querySelector('#player')
    // var videoId = video.getAttribute('data-video-id');

    if (youtubeScript === null) {
      var tag = document.createElement('script');
      var firstScript = document.getElementsByTagName('script')[0];

      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = youtubeScriptId;
      firstScript.parentNode.insertBefore(tag, firstScript);
    }

    window.onYouTubeIframeAPIReady = function() {
      window.player = new window.YT.Player(video, {
        videoId: '3bNITQR4Uso',
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0
        }
      });
    }
  }
  createVideo()


})