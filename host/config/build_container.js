module.exports = {
  AttachStdin: true,
  OpenStdin: true,
  StdinOnce: true,
  Image: 'progrium/buildstep',
  Cmd: ['/bin/bash', '-c', 'mkdir -p /app && tar -xC /app'],
  Tty: false
};
