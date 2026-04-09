// Singleton YouTube IFrame API manager.
// The constructor return value doesn't have methods yet — methods are only
// available on event.target inside onReady. We update _player there.

let _player = null;
let _ready = false;
let _pending = [];
let _stateCallback = null;
let _initialized = false;

function exec(fn) {
  if (_ready && _player) {
    fn(_player);
  } else {
    _pending.push(fn);
  }
}

function onPlayerReady(event) {
  _player = event.target;
  _ready = true;
  _pending.forEach((fn) => fn(_player));
  _pending = [];
}

export function initYTPlayer(containerId, onStateChange) {
  if (_initialized) {
    _stateCallback = onStateChange;
    return;
  }
  _initialized = true;
  _stateCallback = onStateChange;

  const create = () => {
    // Do NOT assign return value — player methods aren't ready on it yet
    new window.YT.Player(containerId, {
      width: "2",
      height: "2",
      videoId: "",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: (e) => _stateCallback?.(e),
      },
    });
  };

  if (window.YT?.Player) {
    create();
  } else {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      create();
    };
  }
}

// Use simple string args — the object form isn't supported in all API versions
export function ytPlay() {
  exec((p) => p.playVideo());
}
export function ytPause() {
  exec((p) => p.pauseVideo());
}
export function ytCue(videoId) {
  exec((p) => p.cueVideoById(videoId));
}
export function ytLoad(videoId) {
  exec((p) => p.loadVideoById(videoId));
}
export function ytVolume(vol) {
  exec((p) => p.setVolume(vol));
}
export function ytReady() {
  return _ready;
}
