'use strict';

const authState = {
  accessToken: null,
  refreshToken: null,
  username: null,
};

const playerState = {
  audio: new Audio(),
  currentId: null,
  currentTitle: '',
  playlist: [],
  playlistIndex: -1,
};

const router = {
  currentView: null,
  cleanupFn: null,
  abortController: null,
};