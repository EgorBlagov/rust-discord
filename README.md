# Rust <-> Discord chat integration
Node.js + WebRCON based client to retransmit messages between server and Discord

- Can be configured as systemctl unit, to work all the time (check example of unit iside repository)
- Automatically reconnects to Discord and RCon of server if error is received
- By default supports login/logout, server initialized and disconnected messages
- Has an API, that can be used by other Plugins
