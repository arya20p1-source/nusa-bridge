const os = require("os");
const orig = os.networkInterfaces;
os.networkInterfaces = function() {
  try {
    return orig.apply(this, arguments);
  } catch (e) {
    return { lo: [{ address: "127.0.0.1", family: "IPv4", internal: true }] };
  }
};
